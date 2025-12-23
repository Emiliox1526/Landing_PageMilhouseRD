package edu.pucmm.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import edu.pucmm.config.UploadConfig;
import edu.pucmm.util.ImageValidator;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.UploadedFile;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador para gestionar la configuración del Hero de la página de propiedades.
 * Permite a los administradores configurar la imagen de fondo, título y descripción
 * del hero de manera independiente de las propiedades individuales.
 */
public class HeroConfigController {
    
    private static final String HERO_CONFIG_ID = "propiedades_hero";
    private final MongoCollection<Document> collection;
    private final GridFSBucket bucket;
    private final ObjectMapper mapper = new ObjectMapper();
    
    public HeroConfigController(MongoCollection<Document> collection, GridFSBucket bucket) {
        this.collection = collection;
        this.bucket = bucket;
    }
    
    public void register(Javalin app) {
        
        // GET /api/hero/propiedades - Obtener configuración actual
        app.get("/api/hero/propiedades", ctx -> {
            try {
                System.out.println("[HERO] GET request for hero config");
                
                Document config = collection.find(Filters.eq("id", HERO_CONFIG_ID)).first();
                
                if (config == null) {
                    System.out.println("[HERO] No configuration found, returning default");
                    // Retornar configuración por defecto
                    ctx.json(Map.of(
                        "id", HERO_CONFIG_ID,
                        "imageUrl", "/images/default-hero.jpg",
                        "title", "Encuentra tu hogar ideal",
                        "description", "Las mejores propiedades en República Dominicana"
                    ));
                } else {
                    System.out.println("[HERO] Configuration found: " + config.getString("imageUrl"));
                    // Convertir _id a string y eliminar campo _id
                    config.put("objectId", config.getObjectId("_id").toHexString());
                    config.remove("_id");
                    ctx.json(config);
                }
            } catch (Exception e) {
                System.err.println("[HERO] Error getting hero config: " + e.getMessage());
                e.printStackTrace();
                ctx.status(500).json(Map.of(
                    "success", false,
                    "message", "Error al obtener configuración del hero"
                ));
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
        
        // POST /api/hero/propiedades/image - Subir nueva imagen a GridFS
        app.post("/api/hero/propiedades/image", ctx -> {
            UploadedFile file = ctx.uploadedFile("image");
            
            if (file == null) {
                throw new BadRequestResponse("No se proporcionó ninguna imagen");
            }
            
            String contentType = file.contentType();
            String filename = file.filename() != null ? file.filename() : "hero-image";
            long fileSize = file.size();
            
            // Validate extension
            if (!ImageValidator.isExtensionAllowed(filename)) {
                throw new BadRequestResponse("Extensión no permitida. Permitidas: " + 
                    UploadConfig.getAllowedExtensions());
            }

            // Validate MIME type
            if (!ImageValidator.isMimeTypeAllowed(contentType)) {
                throw new BadRequestResponse("Tipo MIME no permitido. Recibido: " + contentType);
            }

            // Validate file size
            if (fileSize > UploadConfig.getMaxImageSizeBytes()) {
                throw new BadRequestResponse("La imagen es muy grande. Máximo " + 
                    UploadConfig.getMaxImageSizeMB() + "MB");
            }

            if (fileSize <= 0) {
                throw new BadRequestResponse("Archivo vacío");
            }

            // Validate magic bytes and upload to GridFS
            try (var in = new BufferedInputStream(file.content())) {
                // Mark the stream before validation so we can reset it
                in.mark(12);
                
                if (!ImageValidator.validateMagicBytes(in, contentType)) {
                    throw new BadRequestResponse("El contenido no coincide con el tipo declarado (posible archivo malicioso)");
                }

                // Reset stream to beginning for upload to GridFS
                in.reset();
                
                Document meta = new Document("contentType", contentType)
                        .append("originalName", filename)
                        .append("size", fileSize)
                        .append("uploadedBy", "hero-config");

                GridFSUploadOptions opts = new GridFSUploadOptions().metadata(meta);
                ObjectId id = bucket.uploadFromStream(filename, in, opts);

                String imageUrl = "/api/images/" + id.toHexString();
                
                ctx.json(Map.of(
                    "success", true,
                    "imageUrl", imageUrl,
                    "message", "Imagen subida exitosamente"
                ));
            } catch (IOException e) {
                throw new BadRequestResponse("Error al procesar imagen: " + e.getMessage());
            }
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
