package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"sync"
	"time"
)

type cacheEntry struct {
	status   int
	header   http.Header
	body     []byte
	storedAt time.Time
}

type ResponseCache struct {
	ttl          time.Duration
	maxBodyBytes int64
	maxEntries   int

	mu   sync.RWMutex
	data map[string]cacheEntry
}

func NewResponseCache(ttl time.Duration, maxBodyBytes int64, maxEntries int) *ResponseCache {
	if ttl <= 0 {
		ttl = 5 * time.Second
	}
	if maxBodyBytes <= 0 {
		maxBodyBytes = 512 * 1024
	}
	if maxEntries <= 0 {
		maxEntries = 256
	}
	return &ResponseCache{
		ttl:          ttl,
		maxBodyBytes: maxBodyBytes,
		maxEntries:   maxEntries,
		data:         make(map[string]cacheEntry),
	}
}

func (c *ResponseCache) Handler(next http.Handler) http.Handler {
	log.Println("ResponseCache middleware initialized: ttl =", c.ttl, ", maxBodyBytes =", c.maxBodyBytes, ", maxEntries =", c.maxEntries)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			next.ServeHTTP(w, r)
			return
		}

		if reqCC := strings.ToLower(r.Header.Get("Cache-Control")); strings.Contains(reqCC, "no-store") {
			next.ServeHTTP(w, r)
			return
		}

		if strings.HasSuffix(r.URL.Path, "/ws") ||
			strings.EqualFold(r.Header.Get("Connection"), "Upgrade") ||
			strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
			next.ServeHTTP(w, r)
			return
		}

		key := c.cacheKey(r)
		if entry, ok := c.get(key); ok {
			c.writeFromCache(w, r, entry)
			return
		}

		rec := httptest.NewRecorder()
		next.ServeHTTP(rec, r)

		res := rec.Result()
		defer res.Body.Close()

		body, _ := io.ReadAll(res.Body)

		copyHeaders(w.Header(), res.Header)

		respCC := strings.ToLower(res.Header.Get("Cache-Control"))
		if strings.Contains(respCC, "no-store") {
			copyHeaders(w.Header(), res.Header)
			w.Header().Set("X-Cache", "MISS")
			statusCode := res.StatusCode
			if statusCode == 0 {
				statusCode = http.StatusOK
			}
			w.WriteHeader(statusCode)
			if r.Method != http.MethodHead {
				_, _ = w.Write(body)
			}
			return
		}

		// Force our cache policy unless upstream explicitly forbids storage.
		w.Header().Set("Cache-Control", fmt.Sprintf("private, max-age=%d", int(c.ttl.Seconds())))
		w.Header().Set("X-Cache", "MISS")

		statusCode := res.StatusCode
		if statusCode == 0 {
			statusCode = http.StatusOK
		}

		w.WriteHeader(statusCode)
		if r.Method != http.MethodHead {
			_, _ = w.Write(body)
		}

		if statusCode != http.StatusOK {
			return
		}

		if int64(len(body)) > c.maxBodyBytes {
			return
		}

		// already handled no-store above; allow storing despite no-cache/max-age=0

		entry := cacheEntry{
			status:   statusCode,
			header:   cloneHeader(w.Header()),
			body:     append([]byte(nil), body...),
			storedAt: time.Now(),
		}
		c.set(key, entry)
	})
}

func (c *ResponseCache) cacheKey(r *http.Request) string {
	method := r.Method
	if method == http.MethodHead {
		method = http.MethodGet
	}

	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	accept := strings.TrimSpace(r.Header.Get("Accept"))
	acceptEnc := strings.TrimSpace(r.Header.Get("Accept-Encoding"))
	acceptLang := strings.TrimSpace(r.Header.Get("Accept-Language"))

	parts := []string{
		method,
		r.URL.RequestURI(),
		r.Host,
		hashString(auth + "|" + accept + "|" + acceptEnc + "|" + acceptLang),
	}
	return strings.Join(parts, "|")
}

func (c *ResponseCache) get(key string) (cacheEntry, bool) {
	c.mu.RLock()
	entry, ok := c.data[key]
	c.mu.RUnlock()

	if !ok {
		return cacheEntry{}, false
	}
	if time.Since(entry.storedAt) > c.ttl {
		c.mu.Lock()
		delete(c.data, key)
		c.mu.Unlock()
		return cacheEntry{}, false
	}
	return entry, true
}

func (c *ResponseCache) set(key string, entry cacheEntry) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.data) >= c.maxEntries {
		oldestKey := ""
		var oldestTime time.Time
		for k, v := range c.data {
			if oldestKey == "" || v.storedAt.Before(oldestTime) {
				oldestKey = k
				oldestTime = v.storedAt
			}
		}
		delete(c.data, oldestKey)
	}
	c.data[key] = entry
}

func (c *ResponseCache) writeFromCache(w http.ResponseWriter, r *http.Request, entry cacheEntry) {
	for k := range w.Header() {
		w.Header().Del(k)
	}
	copyHeaders(w.Header(), entry.header)

	age := int(time.Since(entry.storedAt).Seconds())
	w.Header().Set("Age", fmt.Sprintf("%d", age))
	w.Header().Set("X-Cache", "HIT")

	w.WriteHeader(entry.status)
	if r.Method != http.MethodHead {
		_, _ = w.Write(entry.body)
	}
}

func copyHeaders(dst, src http.Header) {
	keys := make([]string, 0, len(src))
	for k := range src {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	for _, k := range keys {
		values := src.Values(k)
		copied := make([]string, len(values))
		copy(copied, values)
		dst[k] = copied
	}
}

func cloneHeader(h http.Header) http.Header {
	out := make(http.Header, len(h))
	for k, values := range h {
		copied := make([]string, len(values))
		copy(copied, values)
		out[k] = copied
	}
	return out
}

func hashString(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}
