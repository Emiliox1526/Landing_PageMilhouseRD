package edu.pucmm.controller;

import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import com.mongodb.client.model.Filters;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.NotFoundResponse;
import io.javalin.http.UploadedFile;
import org.bson.Document;
import org.bson.types.ObjectId;

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
        app.post("/api/uploads", ctx -> {
            List<UploadedFile> files = ctx.uploadedFiles("files");
            if (files == null || files.isEmpty()) {
                throw new BadRequestResponse("No se recibieron archivos (campo 'files').");
            }

            List<String> urls = new ArrayList<>();
            for (UploadedFile uf : files) {
                String filename = uf.filename() != null ? uf.filename() : "image";
                String contentType = uf.contentType() != null ? uf.contentType() : "application/octet-stream";

                // Solo permitir imágenes
                if (!contentType.toLowerCase().startsWith("image/")) {
                    throw new BadRequestResponse("Solo se permiten imágenes. Recibido: " + contentType);
                }

                try (var in = uf.content()) {
                    Document meta = new Document("contentType", contentType)
                            .append("originalName", filename);

                    GridFSUploadOptions opts = new GridFSUploadOptions().metadata(meta);
                    ObjectId id = bucket.uploadFromStream(filename, in, opts);

                    urls.add("/api/images/" + id.toHexString());
                }
            }

            ctx.status(201).json(Map.of("urls", urls));
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
