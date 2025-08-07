package edu.pucmm;

import com.mongodb.client.MongoCollection;
import edu.pucmm.config.MongoConfig;
import edu.pucmm.controller.ContactController;
import edu.pucmm.controller.PropertyController;
import io.javalin.Javalin;
import org.bson.Document;

public class Main {
    public static void main(String[] args) {
        // 1) Puerto (puede venir de entorno o usar 7070 por defecto)
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "7070"));

        // 2) Conexión a MongoDB usando tu MongoConfig estático
        var database = MongoConfig.getDatabase();
        System.out.println("✅ Conectado a la base de datos: " + database.getName());
        MongoCollection<Document> contacts   = database.getCollection("contacts");
        MongoCollection<Document> properties = database.getCollection("properties");
        long count = properties.countDocuments();
        System.out.println("📦 Documentos en 'properties': " + count);

        // 3) Inicializa Javalin y sirve estáticos desde resources/public
        Javalin app = Javalin.create(cfg -> {
            cfg.staticFiles.add("/public");
        }).start(port);

        // Registrar controladores
        new ContactController(contacts).register(app);
        new PropertyController(properties).register(app);

        // Redirige la raíz a tu index estático
        app.get("/", ctx -> ctx.redirect("/index.html"));

        System.out.printf("Servidor Javalin corriendo en http://localhost:%d%n", port);
    }
}

