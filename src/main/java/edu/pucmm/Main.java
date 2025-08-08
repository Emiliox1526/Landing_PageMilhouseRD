package edu.pucmm;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.bson.Document;

import com.mongodb.client.MongoCollection;

import edu.pucmm.config.MongoConfig;
import edu.pucmm.controller.ContactController;
import edu.pucmm.controller.PropertyController;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

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
        if (count == 0) {
            System.out.println("⚠️  Colección vacía. Generando datos de ejemplo...");
            seedProperties(properties);
            System.out.println("✅ Datos de propiedades generados.");
        }

        // 3) Inicializa Javalin y sirve estáticos desde resources/public
        Javalin app = Javalin.create(cfg -> {
            cfg.staticFiles.add(staticConfig -> {
                staticConfig.directory = "/public";          // carpeta en classpath: src/main/resources/public
                staticConfig.hostedPath = "/";               // monta en la raíz
                staticConfig.location   = Location.CLASSPATH;
                // evita servir cualquier ruta que empiece con /api/
                staticConfig.aliasCheck = (path, resource) ->
                        !path.startsWith("/api/");
            });
        }).start(7070);

        // Registrar controladores
        new ContactController(contacts).register(app);
        new PropertyController(properties).register(app);

        // Redirige la raíz a tu index estático
        app.get("/", ctx -> ctx.redirect("/index.html"));

        System.out.printf("Servidor Javalin corriendo en http://localhost:%d%n", port);
    }

    private static void seedProperties(MongoCollection<Document> properties) {
        Random random = new Random();
        String[] titles = {
                "Apartamento Moderno", "Casa en la Playa",
                "Villa de Lujo", "Loft Céntrico", "Estudio Acogedor"
        };
        String[] cities = {"Santiago", "Santo Domingo", "Puerto Plata"};
        String[] areas = {"Centro", "Naco", "Piantini", "Gurabo"};
        String[] saleTypes = {"Venta", "Renta"};
        String[] featureOptions = {"Piscina", "Jardín", "Gimnasio", "Seguridad 24h", "Ascensor"};
        String[] amenityOptions = {"Wifi", "Aire acondicionado", "Parque", "Supermercado cercano"};
        String[] zones = {"A", "B", "C"};

        for (int i = 0; i < 5; i++) {
            String title = titles[random.nextInt(titles.length)];
            String city = cities[random.nextInt(cities.length)];
            String area = areas[random.nextInt(areas.length)];
            String saleType = saleTypes[random.nextInt(saleTypes.length)];
            double price = 100000 + random.nextInt(900000);
            String priceFormatted = "US$" + price;
            int bedrooms = 1 + random.nextInt(5);
            int bathrooms = 1 + random.nextInt(4);
            int parking = random.nextInt(3);
            int m2 = 50 + random.nextInt(200);

            List<String> features = new ArrayList<>();
            for (int j = 0; j < 3; j++) {
                features.add(featureOptions[random.nextInt(featureOptions.length)]);
            }

            List<String> amenities = new ArrayList<>();
            for (int j = 0; j < 3; j++) {
                amenities.add(amenityOptions[random.nextInt(amenityOptions.length)]);
            }

            List<Document> images = new ArrayList<>();
            for (int j = 0; j < 3; j++) {
                images.add(new Document("src", "https://via.placeholder.com/800x600?text=Img" + (j + 1)));
            }

            List<Document> units = new ArrayList<>();
            for (int j = 0; j < 3; j++) {
                double unitPrice = price + (j * 10000);
                units.add(new Document("name", "Unidad " + (j + 1))
                        .append("floor", 1 + random.nextInt(10))
                        .append("bedrooms", 1 + random.nextInt(4))
                        .append("bathrooms", 1 + random.nextInt(3))
                        .append("parking", random.nextInt(2) + 1)
                        .append("zone", zones[random.nextInt(zones.length)])
                        .append("terrace", random.nextBoolean())
                        .append("priceFormatted", "US$" + unitPrice)
                        .append("price", unitPrice)
                );
            }

            List<Document> related = new ArrayList<>();
            for (int j = 0; j < 2; j++) {
                related.add(new Document("title", titles[random.nextInt(titles.length)])
                        .append("priceFormatted", "US$" + (100000 + random.nextInt(900000)))
                        .append("thumb", "https://via.placeholder.com/300x200?text=Related" + (j + 1))
                        .append("url", "#"));
            }

            Document property = new Document("title", title)
                    .append("location", new Document("city", city).append("area", area))
                    .append("saleType", saleType)
                    .append("priceFormatted", priceFormatted)
                    .append("price", price)
                    .append("bedrooms", bedrooms)
                    .append("bathrooms", bathrooms)
                    .append("parking", parking)
                    .append("area", m2)
                    .append("descriptionParagraph", "Descripción generada automáticamente")
                    .append("features", features)
                    .append("amenities", amenities)
                    .append("images", images)
                    .append("units", units)
                    .append("related", related);

            properties.insertOne(property);
        }
    }
}

