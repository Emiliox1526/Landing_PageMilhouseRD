package edu.pucmm;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import edu.pucmm.config.MongoConfig;
import io.javalin.Javalin;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // Crea y configura la instancia de Javalin
        Javalin app = Javalin.create(config -> {
            // Indica a Javalin la carpeta de archivos estáticos
            config.staticFiles.add("/public");
        }).start(7070);  // Inicia en el puerto 7070

        // Colecciones de MongoDB
        MongoCollection<Document> contacts = MongoConfig.getDatabase().getCollection("contacts");
        MongoCollection<Document> properties = MongoConfig.getDatabase().getCollection("properties");

        // Endpoint para insertar un contacto en MongoDB
        app.post("/api/contacts", ctx -> {
            Document doc = Document.parse(ctx.body());
            contacts.insertOne(doc);
            ctx.status(201).json(doc);
        });

        // Endpoint para listar los contactos almacenados
        app.get("/api/contacts", ctx -> {
            List<Document> docs = contacts.find().into(new ArrayList<>());
            ctx.json(docs);
        });

        // Endpoints para propiedades (CRUD básico)

        // Listar todas las propiedades
        app.get("/api/properties", ctx -> {
            List<Document> docs = properties.find().into(new ArrayList<>());
            ctx.json(docs);
        });

        // Obtener una propiedad por id
        app.get("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            Document doc = properties.find(Filters.eq("_id", new ObjectId(id))).first();
            if (doc == null) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                ctx.json(doc);
            }
        });

        // Crear una propiedad
        app.post("/api/properties", ctx -> {
            Document doc = Document.parse(ctx.body());
            properties.insertOne(doc);
            ctx.status(201).json(doc);
        });

        // Actualizar una propiedad
        app.put("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            Document update = Document.parse(ctx.body());
            Document replaced = properties.findOneAndReplace(Filters.eq("_id", new ObjectId(id)), update);
            if (replaced == null) {
                ctx.status(404).json(Map.of("message", "Property not found"));
            } else {
                update.put("_id", new ObjectId(id));
                ctx.json(update);
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

        // Opcional: Redirigir la raíz ("/") a "index.html"
        app.get("/", ctx -> ctx.redirect("/index.html"));

        System.out.println("Servidor Javalin corriendo en http://localhost:7070");
    }
}
