package edu.pucmm.controller;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.client.model.Filters;
import edu.pucmm.config.UploadConfig;
import edu.pucmm.util.ImageValidator;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.NotFoundResponse;
import io.javalin.http.UploadedFile;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class UploadController {

    private final GridFSBucket bucket;

    public UploadController(GridFSBucket bucket) {
        this.bucket = bucket;
    }

    public void register(Javalin app) {

        // ===== Subir imágenes -> GridFS =====
        // Request: multipart/form-data con "files"
        // Response: { "urls": ["/api/images/<id1>", "/api/images/<id2>", ...] }
        // Soporta múltiples formatos: jpg, jpeg, png, gif, bmp, webp, svg, tiff
        // Límite: hasta 100 imágenes por lote, 25MB por imagen
        app.post("/api/uploads", ctx -> {
            List<UploadedFile> files = ctx.uploadedFiles("files");
            if (files == null || files.isEmpty()) {
                throw new BadRequestResponse("No se recibieron archivos (campo 'files').");
            }

            // Validate batch size
            if (files.size() > UploadConfig.getMaxImagesPerBatch()) {
                throw new BadRequestResponse("Máximo " + UploadConfig.getMaxImagesPerBatch() + 
                    " imágenes por lote. Recibido: " + files.size());
            }

            List<String> urls = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (int i = 0; i < files.size(); i++) {
                UploadedFile uf = files.get(i);
                String filename = uf.filename() != null ? uf.filename() : "image";
                String contentType = uf.contentType() != null ? uf.contentType() : "application/octet-stream";
                long fileSize = uf.size();
                
                try {
                    // Validate extension
                    if (!ImageValidator.isExtensionAllowed(filename)) {
                        errors.add("Archivo " + (i + 1) + " (" + filename + "): extensión no permitida. " +
                            "Permitidas: " + UploadConfig.getAllowedExtensions());
                        continue;
                    }

                    // Validate MIME type
                    if (!ImageValidator.isMimeTypeAllowed(contentType)) {
                        errors.add("Archivo " + (i + 1) + " (" + filename + "): tipo MIME no permitido. " +
                            "Recibido: " + contentType);
                        continue;
                    }

                    // Validate file size
                    if (fileSize > UploadConfig.getMaxImageSizeBytes()) {
                        errors.add("Archivo " + (i + 1) + " (" + filename + "): excede el tamaño máximo de " +
                            UploadConfig.getMaxImageSizeMB() + "MB");
                        continue;
                    }

                    if (fileSize <= 0) {
                        errors.add("Archivo " + (i + 1) + " (" + filename + "): archivo vacío");
                        continue;
                    }

                    // Validate magic bytes (wrap in BufferedInputStream for mark/reset support)
                    try (var in = new BufferedInputStream(uf.content())) {
                        if (!ImageValidator.validateMagicBytes(in, contentType)) {
                            errors.add("Archivo " + (i + 1) + " (" + filename + 
                                "): el contenido no coincide con el tipo declarado (posible archivo malicioso)");
                            continue;
                        }

                        // Reset stream and upload to GridFS
                        in.reset();
                        
                        Document meta = new Document("contentType", contentType)
                                .append("originalName", filename)
                                .append("size", fileSize);

                        GridFSUploadOptions opts = new GridFSUploadOptions().metadata(meta);
                        ObjectId id = bucket.uploadFromStream(filename, in, opts);

                        urls.add("/api/images/" + id.toHexString());
                    }
                } catch (IOException e) {
                    errors.add("Archivo " + (i + 1) + " (" + filename + "): error al procesar - " + e.getMessage());
                }
            }

            // If no files were uploaded successfully but there were errors, return error
            if (urls.isEmpty() && !errors.isEmpty()) {
                ctx.status(400).json(Map.of(
                    "message", "No se pudieron subir imágenes",
                    "errors", errors
                ));
                return;
            }

            // Return URLs and any errors that occurred
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("urls", urls);
            if (!errors.isEmpty()) {
                response.put("warnings", errors);
            }
            
            ctx.status(201).json(response);
        });

        // ===== Servir imágenes desde GridFS =====
        app.get("/api/images/{id}", ctx -> {
            ObjectId oid;
            try {
                oid = new ObjectId(ctx.pathParam("id"));
            } catch (IllegalArgumentException e) {
                throw new BadRequestResponse("ID de imagen inválido");
            }

            GridFSFile gfile = bucket.find(Filters.eq("_id", oid)).first();
            if (gfile == null) throw new NotFoundResponse("Imagen no encontrada");

            String contentType = "application/octet-stream";
            Document meta = gfile.getMetadata();
            if (meta != null) {
                String ct = meta.getString("contentType");
                if (ct != null && !ct.isBlank()) contentType = ct;
            }

            ctx.res().setContentType(contentType);
            ctx.res().setHeader("Cache-Control", "public, max-age=31536000, immutable");
            ctx.res().setHeader("Content-Length", String.valueOf(gfile.getLength()));
            String safeName = gfile.getFilename() == null ? "image" : gfile.getFilename().replace("\"", "");
            ctx.res().setHeader("Content-Disposition", "inline; filename=\"" + safeName + "\"");

            try (OutputStream out = ctx.res().getOutputStream()) {
                bucket.downloadToStream(oid, out);
            }
        });
    }
}
