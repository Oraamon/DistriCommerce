FROM gradle:8.5-jdk17
WORKDIR /workspace/app

COPY settings.gradle .
COPY build.gradle .
COPY payment-service/build.gradle ./payment-service/
COPY payment-service/src ./payment-service/src
COPY order-service/build.gradle ./order-service/
COPY order-service/src ./order-service/src

# Verifique a estrutura do projeto
RUN echo "Project structure:" && \
    find . -type f | grep -v "build/" | sort

# Primeiro construa o payment-service para resolver a dependência
RUN gradle :payment-service:jar --no-daemon

EXPOSE 8082

# Execute a aplicação em modo de desenvolvimento
CMD ["gradle", ":order-service:bootRun", "--no-daemon"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1 