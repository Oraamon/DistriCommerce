FROM gradle:8.5-jdk17
WORKDIR /workspace/app

COPY settings.gradle .
COPY build.gradle .
COPY payment-service/build.gradle ./payment-service/
COPY payment-service/src ./payment-service/src

# Verifique a estrutura do projeto
RUN echo "Project structure:" && \
    find . -type f | grep -v "build/" | sort

EXPOSE 8083

# Execute a aplicação em modo de desenvolvimento
CMD ["gradle", ":payment-service:bootRun", "--no-daemon"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8083/actuator/health || exit 1 