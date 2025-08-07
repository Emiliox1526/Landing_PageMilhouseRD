package edu.pucmm;

import com.mongodb.client.MongoCollection;
import edu.pucmm.config.MongoConfig;
import io.javalin.Javalin;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // Crea y configura la instancia de Javalin
        Javalin app = Javalin.create(config -> {
            // Indica a Javalin la carpeta de archivos estáticos
            config.staticFiles.add("/public");
        }).start(7070);  // Inicia en el puerto 7070

        // Colección "contacts" para probar la conexión a MongoDB
        MongoCollection<Document> contacts = MongoConfig.getDatabase().getCollection("contacts");

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

        // Opcional: Redirigir la raíz ("/") a "index.html"
        app.get("/", ctx -> {
            ctx.redirect("/index.html");
        });

        System.out.println("Servidor Javalin corriendo en http://localhost:7070");
    }
}
