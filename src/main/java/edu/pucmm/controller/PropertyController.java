package edu.pucmm.controller;

import com.mongodb.client.FindIterable;
import com.mongodb.client.model.Sorts;
import io.javalin.Javalin;
import io.javalin.http.Context;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.*;

/**
 * Controller de Propiedades (versión compatible con:
 *   new PropertyController(properties).register(app);
 *
 * Cambios soportados:
 *  - type ∈ {Casa, Apartamento, Penthouse, Solares, Villa}
 *  - units[].area (double)
 *  - latitude / longitude (double)
 */
public class PropertyController {

    private final MongoCollection<Document> properties;

    private static final Set<String> ALLOWED_TYPES = new HashSet<>(Arrays.asList(
            "Casa", "Apartamento", "Penthouse", "Solares", "Villa"
    ));

    public PropertyController(MongoCollection<Document> properties) {
        this.properties = properties;
    }

    /** Registra endpoints en Javalin */
    public void register(Javalin app) {
        System.out.println("[REGISTER] PropertyController routes");

        // LISTAR
        app.get("/api/properties", ctx -> {
            System.out.println("[HIT] GET /api/properties");
            List<Map<String, Object>> out = new ArrayList<>();
            FindIterable<Document> it = properties.find().sort(Sorts.descending("createdAt")).limit(200);
            for (Document d : it) {
                Map<String, Object> m = new LinkedHashMap<>(d);
                m.put("id", d.getObjectId("_id").toHexString());
                m.remove("_id");
                out.add(m);
            }
            ctx.json(out);
        });

        // DETALLE
        app.get("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            System.out.println("[HIT] GET /api/properties/" + id);
            Document d;
            try {
                d = properties.find(Filters.eq("_id", new ObjectId(id))).first();
            } catch (Exception e) {
                System.err.println("[ERR] Invalid ObjectId: " + id);
                ctx.status(400).result("Invalid id");
                return;
            }
            if (d == null) {
                System.out.println("[MISS] Not found: " + id);
                ctx.status(404).result("Not Found");
                return;
            }
            Map<String, Object> m = new LinkedHashMap<>(d);
            m.put("id", d.getObjectId("_id").toHexString());
            m.remove("_id");
            ctx.json(m);
        });

        // CREAR (POST)
        app.post("/api/properties", ctx -> {
            System.out.println("[HIT] POST /api/properties");
            System.out.println("[HIT] CT=" + ctx.contentType());
            String body = ctx.body();
            System.out.println("[HIT] Body=" + body);

            try {
                Document doc = Document.parse(body);
                doc.putIfAbsent("createdAt", Instant.now().toString());
                properties.insertOne(doc);

                String id = doc.getObjectId("_id").toHexString();
                System.out.println("[OK] Inserted _id=" + id);

                Map<String, Object> resp = new HashMap<>();
                resp.put("id", id);
                resp.put("message", "created");
                ctx.status(201).json(resp);

            } catch (org.bson.json.JsonParseException jpe) {
                System.err.println("[ERR] JSON parse: " + jpe.getMessage());
                ctx.status(400).json(Map.of("message", "Invalid JSON"));
            } catch (com.mongodb.MongoException me) {
                System.err.println("[ERR] Mongo: " + me.getMessage());
                ctx.status(500).json(Map.of("message", "DB error"));
            } catch (Exception e) {
                System.err.println("[ERR] Uncaught: " + e.getMessage());
                e.printStackTrace();
                ctx.status(500).json(Map.of("message", "Internal error"));
            }
        });

        // ACTUALIZAR
        app.put("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            ObjectId objectId = parseObjectIdOrNull(id);
            if (objectId == null) {
                ctx.status(400).result("Invalid id");
                return;
            }

            Document body = parseBodyAsDocument(ctx);

            List<String> errors = validateAndNormalize(body);
            if (!errors.isEmpty()) {
                ctx.status(400).json(Map.of("ok", false, "errors", errors));
                return;
            }

            // Mantén estos sets como ya los tengas…
            body.put("updatedAt", new Date());

            Bson filter = Filters.eq("_id", objectId);
            Document update = new Document("$set", body);

            UpdateResult res = properties.updateOne(filter, update);
            if (res.getMatchedCount() == 0) {
                ctx.status(404).result("Not Found");
                return;
            }

            Document updated = properties.find(filter).first();
            ctx.json(normalizeId(updated)); // <- devolver con _id string
        });

        // ELIMINAR
        app.delete("/api/properties/:id", ctx -> {
            String id = ctx.pathParam("id");
            ObjectId objectId = parseObjectIdOrNull(id);
            if (objectId == null) {
                ctx.status(400).result("Invalid id");
                return;
            }
            DeleteResult res = properties.deleteOne(Filters.eq("_id", objectId));
            if (res.getDeletedCount() == 0) {
                ctx.status(404).result("Not Found");
            } else {
                ctx.json(Map.of("ok", true));
            }
        });
    }

    // -------------------------
    // Helpers
    // -------------------------

    private static ObjectId parseObjectIdOrNull(String id) {
        try {
            return new ObjectId(id);
        } catch (Exception e) {
            return null;
        }
    }

    private static Document parseBodyAsDocument(Context ctx) {
        String raw = ctx.body();
        if (raw == null || raw.isBlank()) {
            return new Document();
        }
        return Document.parse(raw);
    }
    private Document normalizeId(Document doc) {
        if (doc == null) return null;
        Document out = new Document(doc); // copia
        Object val = out.get("_id");
        if (val instanceof ObjectId) {
            out.put("_id", ((ObjectId) val).toHexString());
        } else if (val != null) {
            // Si viene serializado raro, intenta extraer el hex 24
            String s = String.valueOf(val);
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("[0-9a-fA-F]{24}")
                    .matcher(s);
            if (m.find()) out.put("_id", m.group());
        }
        return out;
    }
    /**
     * Normaliza y valida:
     * - type ∈ {Casa, Apartamento, Penthouse, Solares, Villa}
     * - latitude / longitude como Double
     * - units[].area como Double
     */
    private static List<String> validateAndNormalize(Document body) {
        List<String> errors = new ArrayList<>();

        // TYPE
        if (body.containsKey("type")) {
            Object t = body.get("type");
            if (t == null) {
                errors.add("type no puede ser null");
            } else {
                String typeStr = String.valueOf(t).trim();
                if (!ALLOWED_TYPES.contains(typeStr)) {
                    errors.add("type inválido. Permitidos: " + String.join(", ", ALLOWED_TYPES));
                } else {
                    body.put("type", typeStr);
                }
            }
        }

        // LAT / LNG
        coerceNumber(body, "latitude", errors);
        coerceNumber(body, "longitude", errors);

        // PRICE / AREA generales (opcionales)
        coerceNumber(body, "price", errors);
        coerceNumber(body, "area", errors);

        // UNITS
        Object unitsObj = body.get("units");
        if (unitsObj instanceof List<?>) {
            @SuppressWarnings("unchecked")
            List<Object> rawUnits = (List<Object>) unitsObj;

            List<Document> normalizedUnits = new ArrayList<>();

            for (int i = 0; i < rawUnits.size(); i++) {
                Object u = rawUnits.get(i);
                if (u instanceof Map<?, ?>) {
                    // Copiar con putAll para evitar problemas de generics
                    @SuppressWarnings("unchecked")
                    Map<String, Object> asMap = (Map<String, Object>) u;

                    Document unit = new Document();
                    unit.putAll(asMap);

                    coerceNumber(unit, "floor", errors, "units[" + i + "].floor");
                    coerceNumber(unit, "bedrooms", errors, "units[" + i + "].bedrooms");
                    coerceNumber(unit, "bathrooms", errors, "units[" + i + "].bathrooms");
                    coerceNumber(unit, "parking", errors, "units[" + i + "].parking");
                    coerceNumber(unit, "price", errors, "units[" + i + "].price");
                    coerceNumber(unit, "area", errors, "units[" + i + "].area"); // NUEVO

                    normalizedUnits.add(unit);
                } else {
                    errors.add("units[" + i + "] debe ser un objeto");
                }
            }
            body.put("units", normalizedUnits);
        } else if (unitsObj != null) {
            errors.add("units debe ser un arreglo");
        }

        return errors;
    }

    private static void coerceNumber(Document doc, String key, List<String> errors) {
        coerceNumber(doc, key, errors, key);
    }

    private static void coerceNumber(Document doc, String key, List<String> errors, String label) {
        if (!doc.containsKey(key)) return;

        Object val = doc.get(key);
        if (val == null) return;

        if (val instanceof Number) return;

        try {
            double d = Double.parseDouble(String.valueOf(val).trim());
            doc.put(key, d);
        } catch (Exception e) {
            errors.add(label + " debe ser numérico (recibido: " + val + ")");
        }
    }
}
