FROM ghcr.io/graalvm/native-image-community:25 AS build
WORKDIR /app
RUN microdnf install -y maven && microdnf clean all

# Camada 1: só pom.xml e Maven wrapper — cacheável (só re-roda se pom.xml mudar)
COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
RUN mvn -B -Pnative dependency:go-offline -DskipTests

# Camada 2: código fonte — invalida a cada push, mas dependências já estão cacheadas
COPY src src
# BuildKit mount cache preserva ~/.m2 entre builds (zero re-download); -T 4 paraleliza
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -Pnative -DskipTests -T 4 native:compile

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
