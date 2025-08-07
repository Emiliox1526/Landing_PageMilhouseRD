package edu.pucmm;

import io.javalin.Javalin;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import edu.pucmm.config.MongoConfig;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // 1) Puerto (puede venir de entorno o usar 7070 por defecto)
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "7070"));

        // 2) Conexión a MongoDB usando tu MongoConfig estático
        var database = MongoConfig.getDatabase();  // :contentReference[oaicite:0]{index=0}
        System.out.println("✅ Conectado a la base de datos: " + database.getName());
        MongoCollection<Document> contacts   = database.getCollection("contacts");
        MongoCollection<Document> properties = database.getCollection("properties");
// (Opcional) Comprueba que puedes leer algo:
        long count = properties.countDocuments();
        System.out.println("📦 Documentos en 'properties': " + count);

        // 3) Inicializa Javalin y sirve estáticos desde resources/public
        Javalin app = Javalin.create(cfg -> {
            cfg.staticFiles.add("/public");
        }).start(port);

        // ====== Rutas para contacts ======
        app.post("/api/contacts", ctx -> {
            Document doc = Document.parse(ctx.body());
            contacts.insertOne(doc);
            ctx.status(201).json(doc);
        });

        app.get("/api/contacts", ctx ->
                ctx.json(contacts.find().into(new ArrayList<>()))
        );

        // ====== Rutas para properties ======
        app.get("/api/properties", ctx ->
                ctx.json(properties.find().into(new ArrayList<>()))
        );

        app.get("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            Document doc = properties.find(Filters.eq("_id", new ObjectId(id))).first();
            if (doc == null) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                ctx.json(doc);
            }
        });

        app.post("/api/properties", ctx -> {
            Document doc = Document.parse(ctx.body());
            properties.insertOne(doc);
            ctx.status(201).json(doc);
        });

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

        app.delete("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            DeleteResult result = properties.deleteOne(Filters.eq("_id", new ObjectId(id)));
            if (result.getDeletedCount() == 0) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                ctx.json(Map.of("message", "Property deleted"));
            }
        });

        // Redirige la raíz a tu index estático
        app.get("/", ctx -> ctx.redirect("/index.html"));

        System.out.printf("Servidor Javalin corriendo en http://localhost:%d%n", port);
    }
}
