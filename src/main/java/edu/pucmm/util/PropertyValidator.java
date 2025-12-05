package edu.pucmm.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Validador de propiedades según tipo de inmueble.
 * Implementa reglas lógicas específicas para cada tipo de propiedad.
 */
public class PropertyValidator {

    // Tipos de propiedad
    public static final String TYPE_CASA = "Casa";
    public static final String TYPE_APARTAMENTO = "Apartamento";
    public static final String TYPE_PENTHOUSE = "Penthouse";
    public static final String TYPE_SOLARES = "Solares";
    public static final String TYPE_VILLA = "Villa";
    public static final String TYPE_LOCAL_COMERCIAL = "Local Comercial";

    // Tipos residenciales (casas/apartamentos)
    private static final List<String> RESIDENTIAL_TYPES = List.of(
            TYPE_CASA, TYPE_APARTAMENTO, TYPE_PENTHOUSE, TYPE_VILLA
    );

    /**
     * Valida una propiedad según su tipo.
     * @param data Mapa con los datos de la propiedad
     * @return Lista de errores de validación (vacía si es válida)
     */
    public static List<String> validate(Map<String, Object> data) {
        List<String> errors = new ArrayList<>();
        
        String type = getString(data, "type");
        if (type == null || type.isBlank()) {
            errors.add("El tipo de propiedad es requerido");
            return errors;
        }

        // Validaciones según tipo
        switch (type) {
            case TYPE_SOLARES:
                validateSolar(data, errors);
                break;
            case TYPE_CASA:
            case TYPE_APARTAMENTO:
            case TYPE_PENTHOUSE:
            case TYPE_VILLA:
                validateResidential(data, errors);
                break;
            case TYPE_LOCAL_COMERCIAL:
                validateCommercial(data, errors);
                break;
            default:
                errors.add("Tipo de propiedad no reconocido: " + type);
        }

        // Validación de precio vs área (común para todos)
        validatePriceAreaRatio(data, errors);

        return errors;
    }

    /**
     * Valida un terreno/solar.
     * - Requiere: área (solar) y precio
     * - No permite: habitaciones, baños, amenidades residenciales, área construida
     */
    private static void validateSolar(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (area == null || area <= 0) {
            errors.add("El área del solar es requerida y debe ser mayor a 0");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0");
        }

        // Campos no permitidos
        if (hasValue(data, "bedrooms")) {
            errors.add("Los solares no deben tener habitaciones");
        }
        if (hasValue(data, "bathrooms")) {
            errors.add("Los solares no deben tener baños");
        }
        if (hasValue(data, "amenities")) {
            errors.add("Los solares no deben tener amenidades residenciales");
        }
    }

    /**
     * Valida una propiedad residencial (casa, apartamento, villa, penthouse).
     * - Requiere: habitaciones, baños, área construida, precio
     * - Permite: amenidades relevantes
     */
    private static void validateResidential(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Integer bedrooms = getInteger(data, "bedrooms");
        Integer bathrooms = getInteger(data, "bathrooms");
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (bedrooms == null || bedrooms < 0) {
            errors.add("El número de habitaciones es requerido y debe ser mayor o igual a 0");
        }
        if (bathrooms == null || bathrooms <= 0) {
            errors.add("El número de baños es requerido y debe ser mayor a 0");
        }
        if (area == null || area <= 0) {
            errors.add("El área construida es requerida y debe ser mayor a 0");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0");
        }
    }

    /**
     * Valida un local comercial.
     * - Requiere: área, precio
     * - Permite: baños (opcional, según región)
     * - No permite: habitaciones, amenidades residenciales
     */
    private static void validateCommercial(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (area == null || area <= 0) {
            errors.add("El área del local comercial es requerida y debe ser mayor a 0");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0");
        }

        // Campos no permitidos
        if (hasValue(data, "bedrooms")) {
            errors.add("Los locales comerciales no deben tener habitaciones");
        }

        // Amenidades residenciales no permitidas
        @SuppressWarnings("unchecked")
        List<String> amenities = (List<String>) data.get("amenities");
        if (amenities != null && !amenities.isEmpty()) {
            List<String> residentialAmenities = List.of(
                    "Piscina", "Jardín", "Terraza privada", "Balcón", "Cuarto de servicio"
            );
            for (String amenity : amenities) {
                if (residentialAmenities.stream().anyMatch(ra -> 
                    amenity.toLowerCase().contains(ra.toLowerCase()))) {
                    errors.add("Los locales comerciales no deben tener amenidades residenciales como: " + amenity);
                }
            }
        }
    }

    /**
     * Valida que el precio tenga una relación lógica con los metros cuadrados.
     * Evita valores incoherentes (ej: precio muy bajo o muy alto por m²)
     */
    private static void validatePriceAreaRatio(Map<String, Object> data, List<String> errors) {
        Double price = getDouble(data, "price");
        Double area = getDouble(data, "area");

        if (price == null || area == null || area <= 0) {
            return; // Ya validado en otras reglas
        }

        double pricePerSqm = price / area;
        
        // Rangos razonables para República Dominicana (USD/m²)
        String type = getString(data, "type");
        double minPricePerSqm = 0;
        double maxPricePerSqm = 0;

        switch (type) {
            case TYPE_SOLARES:
                minPricePerSqm = 10;      // Mínimo $10/m² para solares
                maxPricePerSqm = 5000;    // Máximo $5,000/m² para solares premium
                break;
            case TYPE_LOCAL_COMERCIAL:
                minPricePerSqm = 50;      // Mínimo $50/m² para locales
                maxPricePerSqm = 10000;   // Máximo $10,000/m² para locales premium
                break;
            case TYPE_CASA:
            case TYPE_APARTAMENTO:
            case TYPE_PENTHOUSE:
            case TYPE_VILLA:
                minPricePerSqm = 100;     // Mínimo $100/m² para residencial
                maxPricePerSqm = 15000;   // Máximo $15,000/m² para residencial de lujo
                break;
        }

        if (pricePerSqm < minPricePerSqm) {
            errors.add(String.format(
                "El precio por m² es muy bajo (%.2f USD/m²). Mínimo esperado: %.0f USD/m²",
                pricePerSqm, minPricePerSqm
            ));
        }
        if (pricePerSqm > maxPricePerSqm) {
            errors.add(String.format(
                "El precio por m² es muy alto (%.2f USD/m²). Máximo esperado: %.0f USD/m²",
                pricePerSqm, maxPricePerSqm
            ));
        }
    }

    /**
     * Verifica si un tipo de propiedad es residencial.
     */
    public static boolean isResidentialType(String type) {
        return RESIDENTIAL_TYPES.contains(type);
    }

    /**
     * Verifica si un tipo de propiedad es un solar/terreno.
     */
    public static boolean isSolarType(String type) {
        return TYPE_SOLARES.equals(type);
    }

    /**
     * Verifica si un tipo de propiedad es comercial.
     */
    public static boolean isCommercialType(String type) {
        return TYPE_LOCAL_COMERCIAL.equals(type);
    }

    // Métodos auxiliares para extraer valores del mapa

    private static String getString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        String str = String.valueOf(value).trim();
        return str.isEmpty() ? null : str;
    }

    private static Integer getInteger(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Double getDouble(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static boolean hasValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return false;
        if (value instanceof Number) {
            return ((Number) value).doubleValue() != 0;
        }
        if (value instanceof List) {
            return !((List<?>) value).isEmpty();
        }
        String str = String.valueOf(value).trim();
        return !str.isEmpty();
    }
}
