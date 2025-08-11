package edu.pucmm;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCollection;

import edu.pucmm.controller.PropertyController;

import io.javalin.Javalin;
import io.javalin.http.UploadedFile;
import io.javalin.http.staticfiles.Location;

import org.bson.Document;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

public class Main {

    public static void main(String[] args) throws Exception {

        // ========= ENV / Puertos / Paths =========
        int port = Integer.parseInt(Optional.ofNullable(System.getenv("PORT")).orElse("7070"));
        String uploadsDirEnv = Optional.ofNullable(System.getenv("UPLOADS_DIR")).orElse("");
        String allowedOrigin = Optional.ofNullable(System.getenv("ALLOWED_ORIGIN")).orElse("*");

        // Ruta absoluta para uploads (por defecto <workdir>/uploads)
        Path uploadsRoot = uploadsDirEnv.isBlank()
                ? Paths.get(System.getProperty("user.dir"), "uploads")
                : Paths.get(uploadsDirEnv);
        Files.createDirectories(uploadsRoot); // asegura existencia

        // ========= Mongo =========
        String mongoUri = Optional.ofNullable(System.getenv("MONGODB_URI"))
                .orElse(Optional.ofNullable(System.getenv("MONGO_URI")).orElse("mongodb://localhost:27017"));
        String dbName   = Optional.ofNullable(System.getenv("MONGODB_DB")).orElse("MilhouseRD");
        String collName = Optional.ofNullable(System.getenv("MONGODB_COLLECTION")).orElse("properties");

        MongoClient mongo = MongoClients.create(mongoUri);
        MongoDatabase db  = mongo.getDatabase(dbName);
        MongoCollection<Document> properties = db.getCollection(collName);

        // ========= Javalin (v5+) =========
        Javalin app = Javalin.create(cfg -> {
            cfg.showJavalinBanner = false;

            // Tamaño máx. request (JSON/multipart)
            cfg.http.maxRequestSize = 100L * 1024 * 1024; // 100 MB

            // / -> resources/public (CLASSPATH)
            cfg.staticFiles.add(staticFiles -> {
                staticFiles.directory = "/public";
                staticFiles.location  = Location.CLASSPATH;
                staticFiles.precompress = true;
            });

            // /uploads/** -> carpeta EXTERNAL
            cfg.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/uploads";
                staticFiles.directory  = uploadsRoot.toString();
                staticFiles.location   = Location.EXTERNAL;
            });

            // CORS (Netlify + dev)
            cfg.plugins.enableCors(cors -> cors.add(rule -> {
                if ("*".equals(allowedOrigin)) {
                    rule.anyHost();
                } else {
                    String host = allowedOrigin.replaceFirst("^https?://", "");
                    rule.allowHost(host);
                }
                // hosts locales para desarrollo
                rule.allowHost("localhost:3000", "localhost:5173", "localhost:8080");
                rule.allowCredentials = true;
                // Si necesitas exponer headers de respuesta, usa:
                // rule.exposeHeader("Content-Disposition");
            }));
        }).start(port);

        // ========= Rutas de dominio =========
        new PropertyController(properties).register(app);

        // ========= Healthcheck =========
        app.get("/health", ctx -> ctx.json(Map.of("status", "ok")));
        // Diagnóstico de Mongo
        app.get("/api/_diag/mongo", ctx -> {
            try {
                var ping = db.runCommand(new org.bson.Document("ping", 1));
                long count = properties.countDocuments();
                ctx.json(Map.of(
                        "ok", true,
                        "db", db.getName(),
                        "collection", properties.getNamespace().getCollectionName(),
                        "count", count,
                        "pingOk", ping.get("ok")
                ));
            } catch (Exception e) {
                ctx.status(500).json(Map.of(
                        "ok", false,
                        "error", e.getClass().getSimpleName() + ": " + e.getMessage()
                ));
            }
        });

        // ========= Endpoint de uploads =========
        // Frontend: FormData con name="files" (múltiples). Máx 10 por request.
        app.post("/api/uploads", ctx -> {
            var files = ctx.uploadedFiles("files");
            if (files == null || files.isEmpty()) {
                ctx.status(400).json(Map.of("message", "Sin archivos"));
                return;
            }
            if (files.size() > 10) {
                ctx.status(400).json(Map.of("message", "Máximo 10 archivos por solicitud"));
                return;
            }

            List<String> urls = new ArrayList<>();
            for (UploadedFile f : files) {
                String ct = f.contentType();
                if (ct == null || !ct.toLowerCase().startsWith("image/")) {
                    continue; // ignora no-imagen
                }

                // Deducir extensión
                String ext = "";
                String original = f.filename() == null ? "" : f.filename();
                int dot = original.lastIndexOf('.');
                if (dot > -1 && dot < original.length() - 1) {
                    ext = original.substring(dot).toLowerCase();
                } else if (ct.contains("/")) {
                    String guessed = ct.substring(ct.indexOf('/') + 1).toLowerCase();
                    if (guessed.equals("jpeg")) guessed = "jpg";
                    if (guessed.matches("[a-z0-9]+")) {
                        ext = "." + guessed;
                    }
                }

                String name = UUID.randomUUID().toString().replace("-", "") + ext;
                Path dest = uploadsRoot.resolve(name);

                try (InputStream in = f.content()) {
                    Files.copy(in, dest, REPLACE_EXISTING);
                }

                // URL pública servida por staticFiles (Location.EXTERNAL)
                urls.add("/uploads/" + name);
            }

            if (urls.isEmpty()) {
                ctx.status(400).json(Map.of("message", "No se subieron imágenes válidas"));
                return;
            }
            ctx.json(Map.of("urls", urls));
        });

        // ========= Apagado limpio =========
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { mongo.close(); } catch (Exception ignored) {}
        }));
    }
}
