FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY src src
RUN mvn -B -DskipTests clean package

FROM ghcr.io/graalvm/native-image-community:21 AS native
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN native-image \
    -jar app.jar \
    --enable-https \
    --enable-http \
    --no-fallback \
    baluarte-core

FROM alpine:3.21
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=native /app/baluarte-core .
EXPOSE 8080
ENTRYPOINT ["./baluarte-core"]
