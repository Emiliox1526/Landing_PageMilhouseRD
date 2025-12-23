package edu.pucmm.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.UploadedFile;
import org.bson.Document;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

/**
 * Controlador para gestionar la configuración del Hero de la página de propiedades.
 * Permite a los administradores configurar la imagen de fondo, título y descripción
 * del hero de manera independiente de las propiedades individuales.
 */
public class HeroConfigController {
    
    private static final String HERO_CONFIG_ID = "propiedades_hero";
    private final MongoCollection<Document> collection;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Path uploadsRoot;
    
    public HeroConfigController(MongoCollection<Document> collection) {
        this.collection = collection;
        
        // Configurar ruta de uploads
        String uploadsDirEnv = Optional.ofNullable(System.getenv("UPLOADS_DIR")).orElse("");
        this.uploadsRoot = uploadsDirEnv.isBlank()
                ? Paths.get(System.getProperty("user.dir"), "uploads")
                : Paths.get(uploadsDirEnv);
        
        try {
            Files.createDirectories(uploadsRoot);
        } catch (Exception e) {
            System.err.println("Error creating uploads directory: " + e.getMessage());
        }
    }
    
    public void register(Javalin app) {
        
        // GET /api/hero/propiedades - Obtener configuración actual
        app.get("/api/hero/propiedades", ctx -> {
            Document config = collection.find(Filters.eq("id", HERO_CONFIG_ID)).first();
            
            if (config == null) {
                // Retornar configuración por defecto
                ctx.json(Map.of(
                    "id", HERO_CONFIG_ID,
                    "imageUrl", "/images/default-hero.jpg",
                    "title", "Encuentra tu hogar ideal",
                    "description", "Las mejores propiedades en República Dominicana"
                ));
            } else {
                // Convertir _id a string y eliminar campo _id
                config.put("objectId", config.getObjectId("_id").toHexString());
                config.remove("_id");
                ctx.json(config);
            }
        });
        
        // POST /api/hero/propiedades - Actualizar configuración (título y descripción)
        app.post("/api/hero/propiedades", ctx -> {
            Map<String, Object> body = parseBody(ctx.body());
            
            String title = reqStr(body.get("title"), "title");
            String description = String.valueOf(body.get("description")).trim();
            String imageUrl = body.containsKey("imageUrl") 
                ? String.valueOf(body.get("imageUrl")).trim() 
                : null;
            
            // Construir documento de configuración
            Document doc = new Document();
            doc.append("id", HERO_CONFIG_ID);
            doc.append("title", title);
            doc.append("description", description);
            if (imageUrl != null && !imageUrl.isEmpty()) {
                doc.append("imageUrl", imageUrl);
            }
            doc.append("updatedAt", Instant.now().toString());
            
            // TODO: Obtener email del usuario autenticado
            // Por ahora, usar un valor por defecto
            doc.append("updatedBy", "admin@milhouserd.com");
            
            // Upsert: actualizar si existe, crear si no existe
            ReplaceOptions options = new ReplaceOptions().upsert(true);
            collection.replaceOne(
                Filters.eq("id", HERO_CONFIG_ID),
                doc,
                options
            );
            
            // Retornar configuración actualizada
            Document updated = collection.find(Filters.eq("id", HERO_CONFIG_ID)).first();
            if (updated != null) {
                updated.put("objectId", updated.getObjectId("_id").toHexString());
                updated.remove("_id");
            }
            
            ctx.json(updated != null ? updated : doc);
        });
        
        // POST /api/hero/propiedades/image - Subir nueva imagen
        app.post("/api/hero/propiedades/image", ctx -> {
            UploadedFile file = ctx.uploadedFile("image");
            
            if (file == null) {
                throw new BadRequestResponse("No se proporcionó ninguna imagen");
            }
            
            String contentType = file.contentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                throw new BadRequestResponse("El archivo debe ser una imagen");
            }
            
            // Validar tamaño (máximo 10MB)
            long maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size() > maxSize) {
                throw new BadRequestResponse("La imagen es muy grande. Máximo 10MB");
            }
            
            // Generar nombre único para la imagen
            String ext = "";
            String original = file.filename() == null ? "" : file.filename();
            int dot = original.lastIndexOf('.');
            if (dot > -1 && dot < original.length() - 1) {
                ext = original.substring(dot).toLowerCase();
            } else if (contentType.contains("/")) {
                String guessed = contentType.substring(contentType.indexOf('/') + 1).toLowerCase();
                if (guessed.equals("jpeg")) guessed = "jpg";
                if (guessed.matches("[a-z0-9]+")) {
                    ext = "." + guessed;
                }
            }
            
            String filename = "hero-propiedades-" + UUID.randomUUID().toString().replace("-", "") + ext;
            Path dest = uploadsRoot.resolve(filename);
            
            try (InputStream in = file.content()) {
                Files.copy(in, dest, REPLACE_EXISTING);
            }
            
            String imageUrl = "/uploads/" + filename;
            
            ctx.json(Map.of(
                "success", true,
                "imageUrl", imageUrl,
                "message", "Imagen subida exitosamente"
            ));
        });
    }
    
    // ================= Helpers =================
    
    private Map<String, Object> parseBody(String body) {
        try {
            return mapper.readValue(body, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new BadRequestResponse("JSON inválido: " + e.getMessage());
        }
    }
    
    private String reqStr(Object v, String field) {
        String s = (v == null) ? null : String.valueOf(v).trim();
        if (s == null || s.isBlank()) {
            throw new BadRequestResponse("El campo '" + field + "' es requerido");
        }
        return s;
    }
}
