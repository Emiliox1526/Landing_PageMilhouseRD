# ---- Build ----
FROM gradle:8.7-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle clean shadowJar --no-daemon

# ---- Run ----
FROM eclipse-temurin:17-jre
WORKDIR /app
ENV PORT=7070 \
    UPLOADS_DIR=/app/uploads
COPY --from=build /app/build/libs/*-all.jar /app/app.jar
RUN mkdir -p $UPLOADS_DIR
EXPOSE 7070
CMD ["sh","-c","java -jar /app/app.jar"]
