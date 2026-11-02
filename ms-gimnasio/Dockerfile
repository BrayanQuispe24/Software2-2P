# ==========================================
# Dockerfile - MS Gimnasio (Spring Boot 3 / Java 21)
# ==========================================

# Etapa 1: Compilación con Maven
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copiar archivos de Maven Wrapper y dependencias
COPY mvnw pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copiar código fuente y compilar JAR
COPY src ./src
RUN ./mvnw package -DskipTests -B

# Etapa 2: Runtime ligero
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

ENV SERVER_PORT=8082
ENV SPRING_PROFILES_ACTIVE=prod

# Crear usuario sin privilegios para seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8082

CMD ["java", "-jar", "app.jar"]
