package middlewares

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/tronget/communication-service/constants"
	"github.com/tronget/communication-service/models"
	"github.com/tronget/communication-service/storage"
)

func WithDB(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), constants.CtxDBKey, db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func WithUser(db *storage.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := resolveUser(r, db)
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), constants.CtxUserKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func resolveUser(r *http.Request, db *storage.DB) (models.User, error) {
	var user models.User

	email := strings.TrimSpace(r.Header.Get("X-Auth-Email"))
	if email == "" {
		return user, errors.New("missing user identity")
	}

	err := db.Get(&user, `SELECT id, email, role FROM app_user WHERE email=$1`, email)
	if errors.Is(err, sql.ErrNoRows) {
		return user, errors.New("user with email \"" + email + "\" not found")
	}
	if err != nil {
		log.Println("resolveUser: db.Get:", err)
		return user, errors.New("internal error")
	}
	return user, err
}
