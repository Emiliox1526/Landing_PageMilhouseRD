package edu.pucmm;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.text.NumberFormat;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

public class RandomPropertySeeder {

    private static final String[] TYPES = {
            "Apartamento", "Casa", "Local", "Penthouse", "Terreno", "Villa"
    };
    private static final String[] SALE_TYPES = {"Venta", "Alquiler", "Preventa"};

    private static final String[] PROVINCES = {
            "Santo Domingo", "Santiago", "La Romana", "La Altagracia", "Puerto Plata",
            "San Cristóbal", "San Pedro de Macorís", "La Vega"
    };
    private static final String[] CITIES = {
            "Santo Domingo", "Santiago", "Bávaro", "La Romana", "San Cristóbal",
            "Higüey", "Puerto Plata", "La Vega"
    };
    private static final String[] SECTORS = {
            "Naco", "Piantini", "Gazcue", "Evaristo Morales", "Arroyo Hondo",
            "Los Jardines", "Villa Olga", "Reparto Universitario", "Ciudad Nueva"
    };

    private static final String[] FEATURES_POOL = {
            "Balcón", "Cocina modular", "Walk-in closet", "Pisos en mármol",
            "Terminación en madera preciosa", "Vista al mar", "Jardín", "Terraza techada"
    };
    private static final String[] AMENITIES_POOL = {
            "Piscina", "Gimnasio", "Seguridad 24h", "Área infantil", "Casa club",
            "Ascensor", "Planta eléctrica", "Gas común", "Cisterna", "Parqueo techado"
    };

    public static void run(MongoDatabase db) {
        String seedEnv    = envOr("SEED", "false");
        boolean seed      = Boolean.parseBoolean(seedEnv);
        int desiredCount  = parseInt(envOr("SEED_COUNT", "10"), 10);
        boolean force     = Boolean.parseBoolean(envOr("SEED_FORCE", "false"));

        MongoCollection<Document> col = db.getCollection("properties");
        log("DB              : " + db.getName());
        log("Namespace       : " + col.getNamespace().getFullName());
        log("SEED            : " + seedEnv);
        log("SEED_COUNT      : " + desiredCount);
        log("SEED_FORCE      : " + force);

        if (!seed) {
            log("No se realizará seeding (SEED=false).");
            return;
        }

        long before = col.countDocuments();
        log("Conteo antes    : " + before);

        if (force) {
            col.deleteMany(new Document());
            log("Colección limpiada por SEED_FORCE=true");
        }

        long existing = col.countDocuments();
        int toInsert;

        // Regla: si FORCE => siempre insertamos desiredCount
        // si NO force => solo insertamos el faltante para llegar a desiredCount
        if (force) {
            toInsert = desiredCount;
        } else {
            toInsert = Math.max(0, desiredCount - (int) existing);
        }

        if (toInsert <= 0) {
            log("Sin inserción: existing=" + existing + " >= desired=" + desiredCount + " (o toInsert=0).");
            long after = col.countDocuments();
            log("Conteo después : " + after);
            return;
        }

        log("Sembrando       : " + toInsert + " propiedades…");

        List<Document> docs = new ArrayList<>(toInsert);
        for (int i = 0; i < toInsert; i++) {
            docs.add(randomPropertyDoc());
        }
        col.insertMany(docs);

        long after = col.countDocuments();
        log("Conteo después  : " + after);
        log("Seeding listo.");
    }

    // ---------------- helpers ----------------

    private static Document randomPropertyDoc() {
        ThreadLocalRandom r = ThreadLocalRandom.current();

        String type = weightedType(r);
        String saleType = pickOne(SALE_TYPES, r);

        String currency = r.nextDouble() < 0.75 ? "USD" : "DOP";
        double price = currency.equals("USD")
                ? roundMoney(r.nextDouble(60_000, 650_000))
                : roundMoney(r.nextDouble(3_500_000, 35_000_000));
        String priceFormatted = formatMoney(price, currency);

        String city = pickOne(CITIES, r);
        String sector = pickOne(SECTORS, r);
        String title = buildTitle(type, city, sector, r);

        Document location = randomLocation(r, city, sector);

        List<String> images = new ArrayList<>();
        String imgSeedBase = new ObjectId().toHexString().substring(0, 8);
        images.add(placeholder(imgSeedBase + "a", 1280, 720));
        images.add(placeholder(imgSeedBase + "b", 1280, 720));
        images.add(placeholder(imgSeedBase + "c", 1280, 720));

        List<String> features = pickManyDistinct(FEATURES_POOL, r.nextInt(2, 6), r);
        List<String> amenities = pickManyDistinct(AMENITIES_POOL, r.nextInt(3, 7), r);

        List<Document> units = new ArrayList<>();
        boolean hasUnits = type.equals("Apartamento") || type.equals("Penthouse");
        if (hasUnits) {
            int unitCount = r.nextInt(1, 4);
            for (int i = 1; i <= unitCount; i++) {
                units.add(randomUnit(r, i, currency));
            }
        }

        double area = round2(r.nextDouble(60, 420));
        int bedrooms, bathrooms, parking;

        if (hasUnits && !units.isEmpty()) {
            bedrooms = units.stream().mapToInt(u -> u.getInteger("bedrooms", 0)).max().orElse(2);
            bathrooms = units.stream().mapToInt(u -> u.getInteger("bathrooms", 0)).max().orElse(2);
            parking = units.stream().mapToInt(u -> u.getInteger("parking", 0)).max().orElse(1);
            area = units.stream().mapToDouble(u -> toDouble(u.get("area"))).max().orElse(area);
        } else {
            bedrooms = r.nextInt(2, 6);
            bathrooms = r.nextInt(1, 4);
            parking = r.nextInt(0, 3);
        }

        List<Document> related = new ArrayList<>();
        related.add(buildRelated("Apartamento Moderno", formatMoney(price * 1.12, currency)));
        related.add(buildRelated("Oportunidad en " + city, formatMoney(price * 0.87, currency)));

        Date now = new Date();

        return new Document("_id", new ObjectId())
                .append("type", type)
                .append("saleType", saleType)
                .append("title", title)
                .append("location", location)
                .append("price", price)
                .append("priceFormatted", priceFormatted)
                .append("currency", currency)
                .append("bedrooms", bedrooms)
                .append("bathrooms", bathrooms)
                .append("parking", parking)
                .append("area", area)
                .append("areaUnit", "m2")
                .append("descriptionParagraph", "Descripción generada automáticamente")
                .append("features", features)
                .append("amenities", amenities)
                .append("images", images)
                .append("units", units)
                .append("related", related)
                .append("active", true)
                .append("createdAt", now)
                .append("updatedAt", now);
    }

    private static Document randomUnit(ThreadLocalRandom r, int i, String currency) {
        int floor = r.nextInt(2, 16);
        int beds = r.nextInt(1, 4);
        int baths = r.nextInt(1, 3);
        int pk = r.nextInt(0, 3);
        double uArea = round2(r.nextDouble(45, 180));
        double uPrice = roundMoney(r.nextDouble(55_000, 350_000));
        String uPriceFmt = formatMoney(uPrice, currency);

        return new Document("id", UUID.randomUUID().toString())
                .append("name", "Unidad " + i)
                .append("floor", floor)
                .append("bedrooms", beds)
                .append("bathrooms", baths)
                .append("parking", pk)
                .append("zone", r.nextDouble() < 0.5 ? "A" : "B")
                .append("terrace", r.nextDouble() < 0.35)
                .append("area", uArea)
                .append("price", uPrice)
                .append("priceFormatted", uPriceFmt);
    }

    private static Document randomLocation(ThreadLocalRandom r, String city, String sector) {
        String province = pickOne(PROVINCES, r);
        String country = "República Dominicana";
        String address = "Calle " + (r.nextInt(1, 200)) + " #" + (r.nextInt(1, 99));
        double lat = round6(17.5 + r.nextDouble() * 2.8);
        double lng = round6(-72.0 + r.nextDouble() * 3.0);

        return new Document("country", country)
                .append("province", province)
                .append("city", city)
                .append("sector", sector)
                .append("address", address)
                .append("latitude", lat)
                .append("longitude", lng);
    }

    private static Document buildRelated(String title, String priceFormatted) {
        String seed = new ObjectId().toHexString().substring(0, 6);
        return new Document("title", title)
                .append("priceFormatted", priceFormatted)
                .append("thumb", placeholder(seed, 300, 200))
                .append("url", "#");
    }

    private static String buildTitle(String type, String city, String sector, ThreadLocalRandom r) {
        String[] adjs = {"Moderno", "Céntrico", "Elegante", "Minimalista", "Acogedor", "De Lujo"};
        String adj = pickOne(adjs, r);
        return type + " " + adj + " en " + sector + ", " + city;
    }

    private static String weightedType(ThreadLocalRandom r) {
        double x = r.nextDouble();
        if (x < 0.42) return "Apartamento";
        if (x < 0.68) return "Casa";
        if (x < 0.78) return "Local";
        if (x < 0.88) return "Penthouse";
        if (x < 0.94) return "Terreno";
        return "Villa";
    }

    private static String placeholder(String seed, int w, int h) {
        return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
    }

    private static String envOr(String k, String def) {
        String v = System.getenv(k);
        return (v == null || v.isBlank()) ? def : v.trim();
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; }
    }

    private static String formatMoney(double value, String currencyCode) {
        try {
            NumberFormat nf = NumberFormat.getCurrencyInstance(Locale.US);
            nf.setCurrency(java.util.Currency.getInstance(currencyCode));
            return nf.format(value);
        } catch (Exception e) {
            return "US$" + String.format(Locale.US, "%,.2f", value);
        }
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round6(double v) { return Math.round(v * 1_000_000.0) / 1_000_000.0; }
    private static double roundMoney(double v) { return Math.round(v / 10.0) * 10.0; }

    private static <T> T pickOne(T[] arr, ThreadLocalRandom r) { return arr[r.nextInt(arr.length)]; }

    private static List<String> pickManyDistinct(String[] pool, int n, ThreadLocalRandom r) {
        List<String> list = new ArrayList<>(Arrays.asList(pool));
        Collections.shuffle(list, new Random(r.nextLong()));
        return list.subList(0, Math.min(n, list.size()));
    }

    private static double toDouble(Object o) {
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(String.valueOf(o)); } catch (Exception e) { return 0.0; }
    }

    private static void log(String msg) { System.out.println("??  [SEED] " + msg); }
}
