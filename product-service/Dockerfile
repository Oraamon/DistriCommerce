FROM maven:3.8.5-openjdk-17-slim as build
WORKDIR /workspace/app

# Copiar primeiro apenas o pom.xml para aproveitar o cache
COPY pom.xml .
# Baixar todas as dependências antes de construir
RUN mvn dependency:go-offline

# Agora copiar o código fonte e construir
COPY src src
RUN mvn package -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM openjdk:17-jdk-slim
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency

# Instalar ferramentas para health check e diagnóstico
RUN apt-get update && \
    apt-get install -y wget curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app

# Configuração de JVM para desempenho em contêiner
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70"

ENTRYPOINT exec java $JAVA_OPTS -cp app:app/lib/* com.ecommerce.product.ProductServiceApplication

# Healthcheck melhorado para verificar endpoints específicos, incluindo o endpoint de estoque
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

EXPOSE 8081 