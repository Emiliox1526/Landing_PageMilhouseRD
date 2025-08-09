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

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

public class Main {

    public static void main(String[] args) throws Exception {

        // ========= Mongo =========
        String mongoUri   = System.getenv().getOrDefault("MONGODB_URI", "mongodb://localhost:27017");
        String dbName     = System.getenv().getOrDefault("MONGODB_DB",  "MilhouseRD");
        String collName   = System.getenv().getOrDefault("MONGODB_COLLECTION", "properties");

        MongoClient mongo = MongoClients.create(mongoUri);
        MongoDatabase db  = mongo.getDatabase(dbName);
        MongoCollection<Document> properties = db.getCollection(collName);

        // ========= Ruta de uploads (EXTERNAL) =========
        // Usamos una ruta absoluta basada en el directorio de trabajo
        Path uploadsRoot = Paths.get(System.getProperty("user.dir"), "uploads");
        Files.createDirectories(uploadsRoot); // <-- crea si no existe (evita el error)

        // ========= Javalin (v5+) =========
        Javalin app = Javalin.create(cfg -> {
            cfg.showJavalinBanner = false;

            // Evita 413 (Payload Too Large) para JSON o multipart
            cfg.http.maxRequestSize = 100L * 1024 * 1024; // 100 MB

            // Sirve / (admin.html, js, css) desde resources/public
            cfg.staticFiles.add(staticFiles -> {
                staticFiles.directory = "/public";
                staticFiles.location  = Location.CLASSPATH;
                staticFiles.precompress = true;
            });

            // Sirve /uploads/** desde carpeta externa ./uploads ya creada arriba
            cfg.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/uploads";
                staticFiles.directory  = uploadsRoot.toString(); // usa la ruta absoluta
                staticFiles.location   = Location.EXTERNAL;
            });

            // Si sirves desde otro dominio:
            // cfg.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));
        }).start(7070);

        // ========= Rutas de dominio =========
        new PropertyController(properties).register(app);

        // ========= Healthcheck simple =========
        app.get("/health", ctx -> ctx.json(Map.of("status", "ok")));

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
                if (dot > -1 && dot < original.length()-1) {
                    ext = original.substring(dot).toLowerCase();
                } else if (ct.contains("/")) {
                    String guessed = ct.substring(ct.indexOf('/')+1).toLowerCase();
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
