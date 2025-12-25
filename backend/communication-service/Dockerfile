# ====== Build stage ======
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .

RUN go build -o communication-service .

# ====== Run stage ======
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/communication-service .

EXPOSE 8002

CMD ["./communication-service"]
