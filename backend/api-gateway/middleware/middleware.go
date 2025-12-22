package middleware

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/tronget/api-gateway/storage"
)

func YandexToken(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		client := &http.Client{Timeout: 5 * time.Second}

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			auth = strings.TrimPrefix(auth, "Bearer ")
			auth = strings.Trim(auth, "\"")
			if auth == "" {
				http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
				return
			}

			var email string
			db.Get(&email, "SELECT email from app_user WHERE token=$1", auth)

			req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, "https://login.yandex.ru/info?format=json", nil)
			if err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			req.Header.Set("Authorization", auth)

			resp, err := client.Do(req)
			if err != nil {
				http.Error(w, "Failed to verify token", http.StatusUnauthorized)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			var info struct {
				DefaultEmail string `json:"default_email"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
				http.Error(w, "Failed to parse token info", http.StatusUnauthorized)
				return
			}

			if info.DefaultEmail == "" {
				http.Error(w, "Invalid info payload", http.StatusUnauthorized)
				return
			}

			r.Header.Set("X-Yandex-Email", info.DefaultEmail)

			next.ServeHTTP(w, r)
		})
	}

}

func IsExistingUser(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			email := r.Header.Get("X-Yandex-Email")

			var exists bool

			row := db.QueryRow("SELECT EXISTS(SELECT 1 FROM app_user WHERE email=$1)", email)
			if err := row.Scan(&exists); err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				log.Println("serialize user existence check:", err)
				return
			}

			if !exists {
				http.Error(w, "User does not exist", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func IsBanned(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			email := r.Header.Get("X-Yandex-Email")

			var bannedTill sql.NullTime

			row := db.QueryRow(`SELECT banned_till FROM app_user WHERE email=$1`, email)
			if err := row.Scan(&bannedTill); err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				log.Println("serialize banned check:", err)
				return
			}

			isBanned := bannedTill.Valid && bannedTill.Time.After(time.Now())

			if isBanned {
				http.Error(w, "User is banned", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
