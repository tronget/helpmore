package middleware

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/tronget/api-gateway/storage"
)

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

			var userInfo struct {
				Email string `db:"email"`
				Role  string `db:"role"`
			}
			db.Get(&userInfo, "SELECT email, role from app_user WHERE token=$1", auth)
			if userInfo.Role == "" || userInfo.Email == "" {
				http.Error(w, "Invalid Authorization header (user doesnt exist)", http.StatusUnauthorized)
				return
			}

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
