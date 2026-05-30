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

FROM debian:bookworm-slim
RUN apt-get update -qq && apt-get install -y -qq ca-certificates tzdata && rm -rf /var/lib/apt/lists/*
COPY --from=native /app/baluarte-core /usr/local/bin/baluarte-core
RUN chmod +x /usr/local/bin/baluarte-core
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/baluarte-core"]
