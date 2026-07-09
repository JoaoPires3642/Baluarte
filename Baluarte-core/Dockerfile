FROM ghcr.io/graalvm/native-image-community:25 AS build
WORKDIR /app
RUN microdnf install -y maven && microdnf clean all
COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY src src
ENV SPRING_MAIL_HOST=build-placeholder
RUN mvn -B -Pnative -DskipTests native:compile

FROM debian:bookworm-slim
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates tzdata && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/baluarte-core /usr/local/bin/baluarte-core
RUN chmod +x /usr/local/bin/baluarte-core && \
    groupadd -r baluarte && \
    useradd -r -g baluarte -d /home/baluarte -s /sbin/nologin baluarte && \
    mkdir -p /home/baluarte && \
    chown -R baluarte:baluarte /home/baluarte
USER baluarte
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/baluarte-core"]
