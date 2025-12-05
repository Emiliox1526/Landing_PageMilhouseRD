package edu.pucmm.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Validador de propiedades según tipo de inmueble.
 * Implementa reglas lógicas específicas para cada tipo de propiedad.
 */
public class PropertyValidator {

    // Tipos de propiedad (nombres estandarizados)
    public static final String TYPE_CASA = "Casa";
    public static final String TYPE_APARTAMENTO = "Apartamento";
    public static final String TYPE_PENTHOUSE = "Penthouse";
    public static final String TYPE_SOLAR = "Solar";  // Nombre estándar
    public static final String TYPE_SOLARES = "Solares";  // Backwards compatibility
    public static final String TYPE_VILLA = "Villa";
    public static final String TYPE_LOCAL_COMERCIAL = "Local Comercial";

    // Tipos residenciales (casas/apartamentos)
    private static final List<String> RESIDENTIAL_TYPES = List.of(
            TYPE_CASA, TYPE_APARTAMENTO, TYPE_PENTHOUSE, TYPE_VILLA
    );

    // Amenidades residenciales no permitidas en locales comerciales
    private static final List<String> RESIDENTIAL_AMENITIES = List.of(
            "Piscina", "Jardín", "Terraza privada", "Balcón", "Cuarto de servicio"
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
            case TYPE_SOLAR:
            case TYPE_SOLARES:  // Backwards compatibility
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

        // Minimum price validation removed - no longer validating price/area ratio

        return errors;
    }

    /**
     * Valida un terreno/solar.
     * - Requiere: área (solar) y precio en RD$
     * - No permite: habitaciones, baños, amenidades residenciales, área construida
     */
    private static void validateSolar(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (area == null || area <= 0) {
            errors.add("El área del solar es requerida y debe ser mayor a 0 m². " +
                    "Ejemplo: ingrese un valor como 500 para un solar de 500 m²");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0. " +
                    "Ingrese el precio total en Pesos Dominicanos (RD$). " +
                    "Ejemplo: RD$2,500,000 para un solar de 500 m²");
        }  // ← ESTA LLAVE FALTABA

        // Campos no permitidos
        if (hasValue(data, "bedrooms")) {
            errors.add("Los solares/terrenos no deben tener habitaciones. " +
                    "Este campo solo aplica para propiedades residenciales como casas o apartamentos");
        }
        if (hasValue(data, "bathrooms")) {
            errors.add("Los solares/terrenos no deben tener baños. " +
                    "Este campo solo aplica para propiedades residenciales o comerciales");
        }
        if (hasValue(data, "amenities")) {
            errors.add("Los solares/terrenos no deben tener amenidades residenciales. " +
                    "Elimine campos como piscina, jardín, etc.");
        }
    }


    /**
     * Valida una propiedad residencial (casa, apartamento, villa, penthouse).
     * - Requiere: habitaciones, baños, área construida, precio en RD$
     * - Permite: amenidades relevantes
     */
    private static void validateResidential(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Integer bedrooms = getInteger(data, "bedrooms");
        Integer bathrooms = getInteger(data, "bathrooms");
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (bedrooms == null || bedrooms < 0) {
            errors.add("El número de habitaciones es requerido y debe ser mayor o igual a 0. " +
                      "Ejemplo: ingrese 3 para una propiedad de 3 habitaciones, o 0 para un estudio");
        }
        if (bathrooms == null || bathrooms <= 0) {
            errors.add("El número de baños es requerido y debe ser mayor a 0. " +
                      "Ejemplo: ingrese 2 para una propiedad con 2 baños completos");
        }
        if (area == null || area <= 0) {
            errors.add("El área construida es requerida y debe ser mayor a 0 m². " +
                      "Ejemplo: ingrese 150 para una casa de 150 m² construidos");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0. " +
                      "Ingrese el precio total en Pesos Dominicanos (RD$). " +
                      "Ejemplo: RD$8,700,000 para una casa de 150 m²");
        }
    }

    /**
     * Valida un local comercial.
     * - Requiere: área, precio en RD$
     * - Permite: baños (opcional, según región)
     * - No permite: habitaciones, amenidades residenciales
     */
    private static void validateCommercial(Map<String, Object> data, List<String> errors) {
        // Campos requeridos
        Double area = getDouble(data, "area");
        Double price = getDouble(data, "price");

        if (area == null || area <= 0) {
            errors.add("El área del local comercial es requerida y debe ser mayor a 0 m². " +
                      "Ejemplo: ingrese 100 para un local de 100 m²");
        }
        if (price == null || price <= 0) {
            errors.add("El precio es requerido y debe ser mayor a 0. " +
                      "Ingrese el precio total en Pesos Dominicanos (RD$). " +
                      "Ejemplo: RD$5,800,000 para un local de 100 m²");
        }

        // Campos no permitidos
        if (hasValue(data, "bedrooms")) {
            errors.add("Los locales comerciales no deben tener habitaciones. " +
                      "Este campo solo aplica para propiedades residenciales");
        }

        // Amenidades residenciales no permitidas
        Object amenitiesObj = data.get("amenities");
        if (amenitiesObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> amenities = (List<String>) amenitiesObj;
            if (!amenities.isEmpty()) {
                for (String amenity : amenities) {
                    if (RESIDENTIAL_AMENITIES.stream().anyMatch(ra -> 
                        amenity.toLowerCase().contains(ra.toLowerCase()))) {
                        errors.add("Los locales comerciales no deben tener amenidades residenciales como: " + amenity + ". " +
                                  "Use amenidades comerciales como: Estacionamiento, Seguridad 24/7, Aire acondicionado");
                    }
                }
            }
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
        return TYPE_SOLAR.equals(type) || TYPE_SOLARES.equals(type);
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
