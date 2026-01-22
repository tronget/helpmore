package middleware

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/tronget/api-gateway/storage"
)

type cachedUser struct {
	email string
	role  string
	exp   time.Time
}

type tokenCache struct {
	ttl  time.Duration
	mu   sync.RWMutex
	data map[string]cachedUser
}

func newTokenCache(ttl time.Duration) *tokenCache {
	if ttl <= 0 {
		ttl = 30 * time.Second
	}
	return &tokenCache{ttl: ttl, data: make(map[string]cachedUser)}
}

func (c *tokenCache) get(token string) (cachedUser, bool) {
	c.mu.RLock()
	entry, ok := c.data[token]
	c.mu.RUnlock()
	if !ok || time.Now().After(entry.exp) {
		if ok {
			c.mu.Lock()
			delete(c.data, token)
			c.mu.Unlock()
		}
		return cachedUser{}, false
	}
	return entry, true
}

func (c *tokenCache) set(token string, email, role string) {
	c.mu.Lock()
	c.data[token] = cachedUser{email: email, role: role, exp: time.Now().Add(c.ttl)}
	c.mu.Unlock()
}

var defaultTokenCache = newTokenCache(2 * time.Minute)

func YandexToken(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
			queryToken := strings.TrimSpace(r.URL.Query().Get("auth"))
			auth := strings.TrimPrefix(authHeader, "Bearer ")
			auth = strings.Trim(auth, "\"")
			if auth == "" {
				if queryToken == "" {
					http.Error(w, "Missing Authorization header and auth query parameter", http.StatusUnauthorized)
					return
				}
				auth = queryToken
			}

			// ensure downstream services still see the auth token
			r.Header.Set("Authorization", "Bearer "+auth)

			if cached, ok := defaultTokenCache.get(auth); ok {
				r.Header.Set("X-Auth-Role", cached.role)
				r.Header.Set("X-Auth-Email", cached.email)
				next.ServeHTTP(w, r)
				return
			}

			var userInfo struct {
				Email string `db:"email"`
				Role  string `db:"role"`
			}
			db.Get(&userInfo, "SELECT email, role from app_user WHERE token=$1", auth)
			if userInfo.Role == "" || userInfo.Email == "" {
				http.Error(w, "Invalid Authorization header (user doesnt exist)", http.StatusUnauthorized)
				return
			}

			defaultTokenCache.set(auth, userInfo.Email, userInfo.Role)

			r.Header.Set("X-Auth-Role", userInfo.Role)
			r.Header.Set("X-Auth-Email", userInfo.Email)
			next.ServeHTTP(w, r)
		})
	}

}

func EnsureUserAllowed(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			email := r.Header.Get("X-Auth-Email")

			var bannedTill sql.NullTime

			row := db.QueryRow(`SELECT banned_till FROM app_user WHERE email=$1`, email)
			if err := row.Scan(&bannedTill); err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					http.Error(w, "User does not exist", http.StatusUnauthorized)
					return
				}
				http.Error(w, "Internal error", http.StatusInternalServerError)
				log.Println("serialize user existence/banned check:", err)
				return
			}

			if bannedTill.Valid && bannedTill.Time.After(time.Now()) {
				http.Error(w, "User is banned", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
