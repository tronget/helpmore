# Builder stage
FROM gradle:9.2.1-jdk21 AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN ./gradlew clean bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
ENV APP_PORT=8282 \
    DB_URL=jdbc:postgresql://postgres:5432/cursach \
    DB_USERNAME=tronget \
    DB_PASSWORD=postgres
COPY --from=builder /app/build/libs/*.jar /app/app.jar
EXPOSE 8282
ENTRYPOINT ["java","-jar","/app/app.jar"]
