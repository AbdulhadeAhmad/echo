# Dockerfile
FROM golang:tip-alpine3.22 AS builder
WORKDIR /app
# RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -ldflags="-s -w" -o /app/echo .

FROM alpine:3.22
# RUN apk add --no-cache ca-certificates tzdata && update-ca-certificates
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=builder /app/echo /app/echo
COPY --from=builder /app/front_files /app/front_files
# EXPOSE is optional with custom networking, we can keep or remove it as we are using custom network with compose
EXPOSE 8900
ENTRYPOINT ["/app/echo"]
