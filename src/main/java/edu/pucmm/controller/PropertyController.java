package edu.pucmm.controller;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import io.javalin.Javalin;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Map;

/**
 * Encapsula las rutas CRUD para la colección de propiedades.
 */
public class PropertyController {

    private final MongoCollection<Document> properties;

    public PropertyController(MongoCollection<Document> properties) {
        this.properties = properties;
    }

    /**
     * Registra los endpoints bajo /api/properties.
     */
    public void register(Javalin app) {
        // Obtener todas las propiedades
        app.get("/api/properties", ctx -> {
            var docs = properties.find().into(new ArrayList<Document>());
            docs.forEach(d -> d.put("_id", d.getObjectId("_id").toHexString()));
            ctx.json(docs);
        });

        // Obtener una propiedad por ID
        app.get("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            Document doc = properties.find(Filters.eq("_id", new ObjectId(id))).first();
            if (doc == null) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                doc.put("_id", doc.getObjectId("_id").toHexString());
                ctx.json(doc);
            }
        });

        // Crear una nueva propiedad
        app.post("/api/properties", ctx -> {
            Document doc = Document.parse(ctx.body());
            properties.insertOne(doc);
            ctx.status(201).json(doc);
        });

        // Actualizar una propiedad existente
        app.put("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            Document updates = Document.parse(ctx.body());
            properties.updateOne(
                    Filters.eq("_id", new ObjectId(id)),
                    new Document("$set", updates)
            );
            Document updated = properties.find(Filters.eq("_id", new ObjectId(id))).first();
            if (updated == null) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                ctx.json(updated);
            }
        });

        // Eliminar una propiedad
        app.delete("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            DeleteResult result = properties.deleteOne(Filters.eq("_id", new ObjectId(id)));
            if (result.getDeletedCount() == 0) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                ctx.json(Map.of("message", "Property deleted"));
            }
        });
    }
}

