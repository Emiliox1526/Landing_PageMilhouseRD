package edu.pucmm;

import edu.pucmm.controller.PropertyController;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JavalinJackson;
import edu.pucmm.RandomPropertySeeder;

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

        // 4) Configurar Javalin (JSON + CORS)
        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));
            config.jsonMapper(new JavalinJackson());
        });

        // 5) Registrar controller con la colección 'properties' antes de los estáticos
        MongoCollection<Document> propertiesCol = db.getCollection("properties");
        PropertyController propertyController = new PropertyController(propertiesCol);
        propertyController.register(app);

        // 6) Configurar archivos estáticos
        app.config.staticFiles.add(staticFiles -> {
            staticFiles.hostedPath = "/";                        // http://localhost:7070/
            staticFiles.directory = "/public";                   // carpeta dentro de resources
            staticFiles.location = Location.CLASSPATH;           // src/main/resources/public
            staticFiles.precompress = false;
        });

        // 7) Cierre ordenado de Mongo cuando el server pare
        app.events(e -> e.serverStopped(() -> {
            if (mongoClient != null) {
                mongoClient.close();
                System.out.println("🔌 MongoClient cerrado.");
            }
        }));

        // 8) Arrancar servidor
        app.start(port);
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
}
