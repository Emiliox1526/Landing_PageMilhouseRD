package edu.pucmm;

import edu.pucmm.controller.PropertyController;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCollection;

import org.bson.Document;

public class Main {

    // Hacemos estas referencias de clase para que estén visibles en todo el Main
    private static MongoClient mongoClient;
    private static MongoDatabase db;

    public static void main(String[] args) {

        // 1) Leer configuración
        String uri = getenvOr("MONGODB_URI",
                "mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/MilhouseRD?retryWrites=true&w=majority");
        String dbName = getenvOr("DB_NAME", "MilhouseRD");
        int port = parseInt(getenvOr("PORT", "7070"), 7070);

        // 2) Conectar a Mongo
        mongoClient = MongoClients.create(uri);
        db = mongoClient.getDatabase(dbName);

        System.out.println("🔗 URI leída: " + uri);
        System.out.println("✅ Conectando a DB: " + dbName);
        System.out.println("✅ Conectado a la base de datos: " + dbName);

        // 3) Seeding (si está activado por variables de entorno)
        try {
            RandomPropertySeeder.run(db);
        } catch (Exception e) {
            e.printStackTrace();
        }
        long countAfter = db.getCollection("properties").countDocuments();
        System.out.println("🧮 properties.countDocuments(): " + countAfter);
        // 4) Iniciar Javalin y estáticos
        Javalin app = Javalin.create(config -> {
            config.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/";                        // http://localhost:7070/
                staticFiles.directory = "/public";                   // carpeta dentro de resources
                staticFiles.location = Location.CLASSPATH;           // src/main/resources/public
                staticFiles.precompress = false;
            });
        }).start(port);

        // --- LOGS GLOBALES ---
        app.before(ctx -> {
            System.out.printf("[REQ] %s %s | CT=%s%n", ctx.method(), ctx.path(), ctx.contentType());
        });
        app.after(ctx -> {
            System.out.printf("[RES] %s %s -> %d%n", ctx.method(), ctx.path(), ctx.status());
        });
        app.error(404, ctx -> {
            System.out.printf("[404] %s %s | Body=%s%n", ctx.method(), ctx.path(), safeBody(ctx));
            ctx.result("Not Found");
        });

        // 5) Registrar controller con la colección 'properties'
        MongoCollection<Document> propertiesCol = db.getCollection("properties");
        PropertyController propertyController = new PropertyController(propertiesCol);
        propertyController.register(app);

        // 6) Cierre ordenado de Mongo cuando el server pare
        app.events(e -> e.serverStopped(() -> {
            if (mongoClient != null) {
                mongoClient.close();
                System.out.println("🔌 MongoClient cerrado.");
            }
        }));

        System.out.println("🚀 Server levantado en http://localhost:" + port);
    }

    // ----------------- utilidades -----------------

    private static String getenvOr(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v.trim();
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; }
    }

    public static String safeBody(io.javalin.http.Context ctx){
        try { return ctx.body(); } catch(Exception e){ return "<no-readable-body>"; }
    }
}
