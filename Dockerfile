# Multi-stage build for Syncora Spring Boot app (Java 21)
# Builder stage: compiles and packages the app
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace
COPY pom.xml .
# Pre-fetch dependencies for faster incremental builds
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

# Runtime stage: slim JRE image
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/target/*.jar /app/app.jar
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75 -Dserver.port=8080"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
