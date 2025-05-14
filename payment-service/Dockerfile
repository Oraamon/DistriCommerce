FROM gradle:8.5-jdk17 as build
WORKDIR /workspace/app

# Copiar arquivos de configuração de compilação
COPY settings.gradle .
COPY build.gradle .
COPY payment-service/build.gradle ./payment-service/

# Descarregar dependências para aproveitar o cache
RUN gradle dependencies --no-daemon

# Copiar código fonte
COPY payment-service/src ./payment-service/src

# Verifique a estrutura do projeto
RUN echo "Project structure:" && \
    find . -type f | grep -v "build/" | sort

# Construir o JAR
RUN gradle :payment-service:bootJar --no-daemon

FROM openjdk:17-jdk-slim
WORKDIR /app

# Instalar ferramentas para health check e diagnóstico
RUN apt-get update && \
    apt-get install -y wget curl && \
    rm -rf /var/lib/apt/lists/*

# Copiar o JAR construído
COPY --from=build /workspace/app/payment-service/build/libs/*.jar app.jar

# Configuração de JVM para desempenho em contêiner
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70"

EXPOSE 8083

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8083/actuator/health || exit 1

ENTRYPOINT exec java $JAVA_OPTS -jar app.jar 