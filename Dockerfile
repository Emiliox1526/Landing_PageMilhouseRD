# ---------- Build ----------
FROM gradle:8.7-jdk17 AS build
WORKDIR /app

# Copiamos solo lo necesario para cachear mejor
COPY gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew && sed -i 's/\r$//' gradlew

COPY build.gradle settings.gradle ./
RUN ./gradlew --no-daemon dependencies || true

COPY src ./src
RUN ./gradlew clean shadowJar --no-daemon

# ---------- Run ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Vars útiles
ENV PORT=7070 \
    UPLOADS_DIR=/app/uploads

# Copia el jar (sea app.jar por config arriba o el que genere shadow por defecto)
COPY --from=build /app/build/libs/*.jar /app/app.jar

# Carpeta para uploads
RUN mkdir -p $UPLOADS_DIR

EXPOSE 7070
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["java","-jar","/app/app.jar"]
