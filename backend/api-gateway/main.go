package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
	"github.com/tronget/api-gateway/middleware"
	"github.com/tronget/api-gateway/storage"
)

func proxyURL(target string) *httputil.ReverseProxy {
	u, _ := url.Parse(target)
	return httputil.NewSingleHostReverseProxy(u)
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Missing `DATABASE_URL` in environment variables")
	}
	dbx, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	dbLogger := log.New(os.Stdout, "db ", log.LstdFlags|log.Lmicroseconds)
	db := storage.NewDB(dbx, dbLogger)

	authProxy := http.StripPrefix("/auth", proxyURL("http://auth:8001"))
	commProxy := http.StripPrefix("/comm", proxyURL("http://comm:8002"))
	servProxy := http.StripPrefix("/serv", proxyURL("http://serv:8003"))

	r := chi.NewRouter()
	r.Use(middleware.CORS)

	r.Route("/auth", func(r chi.Router) {
		r.Handle("/yandex", authProxy)

		r.Group(func(r chi.Router) {
			r.Use(middleware.YandexToken(db), middleware.IsExistingUser(db), middleware.IsBanned(db))
			r.Handle("/*", authProxy)
		})
	})

	r.Route("/comm", func(r chi.Router) {
		r.Use(middleware.YandexToken(db), middleware.IsExistingUser(db), middleware.IsBanned(db))
		r.Handle("/*", commProxy)
	})

	r.Route("/serv", func(r chi.Router) {
		r.Use(middleware.YandexToken(db), middleware.IsExistingUser(db), middleware.IsBanned(db))
		r.Handle("/*", servProxy)
	})

	port := os.Getenv("API_GATEWAY_PORT")
	if port == "" {
		port = "8000"
	}
	log.Println("gateway on", port)
	http.ListenAndServe(":"+port, r)
}
