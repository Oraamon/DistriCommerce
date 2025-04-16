FROM gradle:8.5-jdk17 as build-backend

WORKDIR /app

COPY build.gradle settings.gradle ./
RUN mkdir -p gradle/wrapper

RUN echo "distributionBase=GRADLE_USER_HOME\n\
distributionPath=wrapper/dists\n\
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip\n\
networkTimeout=10000\n\
validateDistributionUrl=true\n\
zipStoreBase=GRADLE_USER_HOME\n\
zipStorePath=wrapper/dists" > gradle/wrapper/gradle-wrapper.properties

RUN curl -o gradle/wrapper/gradle-wrapper.jar https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar

COPY gradlew gradlew.bat ./

RUN chmod +x ./gradlew

COPY src src

RUN echo 'plugins {\n\
    id "org.springframework.boot" version "3.2.3"\n\
    id "io.spring.dependency-management" version "1.1.4"\n\
    id "java"\n\
}\n\
\n\
group = "com.example"\n\
version = "0.0.1-SNAPSHOT"\n\
\n\
java {\n\
    sourceCompatibility = "17"\n\
}\n\
\n\
repositories {\n\
    mavenCentral()\n\
}\n\
\n\
dependencies {\n\
    implementation "org.springframework.boot:spring-boot-starter-web"\n\
    implementation "org.springframework.boot:spring-boot-starter-data-jpa"\n\
    implementation "org.springframework.boot:spring-boot-starter-validation"\n\
    implementation "org.springframework.boot:spring-boot-starter-security"\n\
    implementation "org.springframework.boot:spring-boot-starter-actuator"\n\
    runtimeOnly "com.h2database:h2"\n\
    testImplementation "org.springframework.boot:spring-boot-starter-test"\n\
}\n\
\n\
tasks.named("test") {\n\
    useJUnitPlatform()\n\
}' > build.gradle

RUN ./gradlew build -x test

FROM node:18-alpine as build-frontend

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/src ./src
COPY frontend/public ./public

RUN npm run build

FROM openjdk:17-slim

WORKDIR /app

COPY --from=build-backend /app/build/libs/*.jar app.jar

COPY --from=build-frontend /app/build /app/static

RUN mkdir -p BOOT-INF/classes/static && \
    echo '#!/bin/sh\n\
mkdir -p BOOT-INF/classes/static\n\
cp -r /app/static/* BOOT-INF/classes/static/\n\
java -jar app.jar' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"] 