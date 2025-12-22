package edu.pucmm.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import edu.pucmm.util.PropertyValidator;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.NotFoundResponse;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PropertyController {

    private final MongoCollection<Document> collection;
    private final ObjectMapper mapper = new ObjectMapper();

    // Tipos permitidos (acepta ambos "Solar" y "Solares" para compatibilidad)
    private static final List<String> ALLOWED_TYPES = List.of(
            "Casa", "Apartamento", "Penthouse", "Solar", "Solares", "Villa", "Local Comercial"
    );

    public PropertyController(MongoCollection<Document> collection) {
        this.collection = collection;
    }

    public void register(Javalin app) {

        // -------- CREATE --------
        app.post("/api/properties", ctx -> {
            Map<String, Object> body = parseBody(ctx.body());
            String title    = reqStr(body.get("title"), "title");
            String type     = reqStr(body.get("type"), "type");
            String saleType = reqStr(body.get("saleType"), "saleType");

            if (!ALLOWED_TYPES.contains(type)) {
                throw new BadRequestResponse("type inválido. Permitidos: " + ALLOWED_TYPES);
            }

            // Validar la propiedad según su tipo
            List<String> validationErrors = PropertyValidator.validate(body);
            if (!validationErrors.isEmpty()) {
                ctx.status(400).json(Map.of("errors", validationErrors));
                return;
            }

            Document doc = buildDocFromBody(body);
            collection.insertOne(doc);
            String id = doc.getObjectId("_id").toHexString();
            ctx.status(201).json(Map.of("id", id, "message", "created"));
        });

        // -------- LIST --------
        app.get("/api/properties", ctx -> {
            var results = collection.find()
                    .map(d -> {
                        d.put("id", d.getObjectId("_id").toHexString());
                        d.remove("_id");
                        return d;
                    })
                    .into(new ArrayList<>());
            ctx.json(results);
        });

        // -------- DETAIL -------- (Javalin 4: {id})
        app.get("/api/properties/{id}", ctx -> {
            Document d = findByIdOrFail(ctx.pathParam("id"));
            d.put("id", d.getObjectId("_id").toHexString());
            d.remove("_id");
            ctx.json(d);
        });

        // -------- UPDATE -------- (para admin.js)
        app.put("/api/properties/{id}", ctx -> {
            String id = ctx.pathParam("id");
            Map<String, Object> body = parseBody(ctx.body());

            // Validar la propiedad según su tipo
            List<String> validationErrors = PropertyValidator.validate(body);
            if (!validationErrors.isEmpty()) {
                ctx.status(400).json(Map.of("errors", validationErrors));
                return;
            }

            ObjectId oid = parseOid(id);
            Document set = buildDocFromBody(body);

            if (set.isEmpty()) throw new BadRequestResponse("Nada para actualizar");
            var res = collection.updateOne(Filters.eq("_id", oid), new Document("$set", set));
            if (res.getMatchedCount() == 0) throw new NotFoundResponse("No existe");

            ctx.json(Map.of("id", id, "message", "updated"));
        });

        // -------- DELETE -------- (para admin.js)
        app.delete("/api/properties/{id}", ctx -> {
            ObjectId oid = parseOid(ctx.pathParam("id"));
            var res = collection.deleteOne(Filters.eq("_id", oid));
            if (res.getDeletedCount() == 0) throw new NotFoundResponse("No existe");
            ctx.json(Map.of("message", "deleted"));
        });
    }

    // ================= Helpers =================

    private Map<String, Object> parseBody(String body) {
        try {
            return mapper.readValue(body, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new BadRequestResponse("JSON inválido: " + e.getMessage());
        }
    }

    private String reqStr(Object v, String field) {
        String s = (v == null) ? null : String.valueOf(v).trim();
        if (s == null || s.isBlank()) throw new BadRequestResponse("El campo '" + field + "' es requerido");
        return s;
    }

    private ObjectId parseOid(String id) {
        try { return new ObjectId(id); }
        catch (IllegalArgumentException e) { throw new BadRequestResponse("ID inválido"); }
    }

    /**
     * Construye un documento MongoDB desde el cuerpo de la petición.
     * 
     * Para propiedades tipo Solar/Solares:
     * - Si no se proporciona pricePerSqm pero sí price y area, se calcula automáticamente
     * - El cálculo es: pricePerSqm = price / area
     * 
     * @param body Map con los datos de la propiedad
     * @return Document de MongoDB con los campos procesados
     */
    private Document buildDocFromBody(Map<String, Object> body) {
        Number price     = toNumber(body.get("price"));
        Number pricePerSqm = toNumber(body.get("pricePerSqm"));
        Integer bedrooms = toInteger(body.get("bedrooms"));
        Integer bathrooms= toInteger(body.get("bathrooms"));
        Integer parking  = toInteger(body.get("parking"));
        Double area      = toDouble(body.get("area"));  // Changed to Double to match Property model
        Double latitude  = toDouble(body.get("latitude"));
        Double longitude = toDouble(body.get("longitude"));

        List<String> features  = toStringList(body.get("features"));
        List<String> amenities = toStringList(body.get("amenities"));
        List<String> images    = toStringList(body.get("images"));

        Object unitsObj = body.get("units");
        List<?> units = (unitsObj instanceof List) ? (List<?>) unitsObj : null;
        
        // Calcular pricePerSqm para solares si no se proporciona explícitamente
        String type = body.get("type") != null ? String.valueOf(body.get("type")).trim() : "";
        if (isSolarType(type) && pricePerSqm == null && price != null && area != null && area > 0) {
            pricePerSqm = price.doubleValue() / area;
        }

        Document doc = new Document();
        putIfNotBlank(doc, "title", body.get("title"));
        putIfNotBlank(doc, "type", body.get("type"));
        putIfNotBlank(doc, "saleType", body.get("saleType"));
        putIfNotBlank(doc, "address", body.get("address"));
        putIfNotBlank(doc, "descriptionParagraph", body.get("descriptionParagraph"));
        
        // Hero configuration
        if (body.containsKey("isHeroDefault")) {
            doc.append("isHeroDefault", Boolean.TRUE.equals(body.get("isHeroDefault")));
        }
        putIfNotBlank(doc, "heroTitle", body.get("heroTitle"));
        putIfNotBlank(doc, "heroDescription", body.get("heroDescription"));

        if (price != null)     doc.append("price", price);
        if (pricePerSqm != null) doc.append("pricePerSqm", pricePerSqm);
        if (bedrooms != null)  doc.append("bedrooms", bedrooms);
        if (bathrooms != null) doc.append("bathrooms", bathrooms);
        if (parking != null)   doc.append("parking", parking);
        if (area != null)      doc.append("area", area);
        if (latitude != null)  doc.append("latitude", latitude);
        if (longitude != null) doc.append("longitude", longitude);
        if (!features.isEmpty())  doc.append("features", features);
        if (!amenities.isEmpty()) doc.append("amenities", amenities);
        if (!images.isEmpty())    doc.append("images", images);
        if (units != null)        doc.append("units", units);

        return doc;
    }

    private void putIfNotBlank(Document d, String key, Object val) {
        if (val == null) return;
        String s = String.valueOf(val).trim();
        if (!s.isBlank()) d.append(key, s);
    }

    private static Number toNumber(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n;
        try {
            String s = String.valueOf(o);
            return s.contains(".") ? Double.parseDouble(s) : Long.parseLong(s);
        } catch (NumberFormatException e) { return null; }
    }

    private static Integer toInteger(Object o) {
        Number n = toNumber(o);
        return (n == null) ? null : n.intValue();
    }

    private static Double toDouble(Object o) {
        Number n = toNumber(o);
        return (n == null) ? null : n.doubleValue();
    }

    @SuppressWarnings("unchecked")
    private static List<String> toStringList(Object o) {
        if (o == null) return List.of();
        if (o instanceof List<?> list) {
            List<String> out = new ArrayList<>(list.size());
            for (Object item : list) if (item != null) out.add(String.valueOf(item));
            return out;
        }
        if (o instanceof String s) return s.isBlank() ? List.of() : List.of(s);
        return List.of();
    }

    private Document findByIdOrFail(String id) {
        ObjectId oid = parseOid(id);
        Document d = collection.find(Filters.eq("_id", oid)).first();
        if (d == null) throw new NotFoundResponse("No existe");
        return d;
    }
    
    /**
     * Verifica si el tipo de propiedad es Solar o Solares
     * 
     * @param type Tipo de propiedad (ej: "Solar", "Solares", "Casa", etc.)
     * @return true si es tipo Solar/Solares, false en caso contrario
     */
    private boolean isSolarType(String type) {
        if (type == null) return false;
        String normalized = type.trim();
        return "Solar".equalsIgnoreCase(normalized) || "Solares".equalsIgnoreCase(normalized);
    }
}
