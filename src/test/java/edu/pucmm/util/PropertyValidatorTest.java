package edu.pucmm.util;

import org.junit.Test;
import static org.junit.Assert.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Tests para PropertyValidator.
 * Verifica las reglas de validación específicas para cada tipo de propiedad.
 */
public class PropertyValidatorTest {

    // ========== Tests para Solares ==========
    
    @Test
    public void testSolar_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno en Punta Cana");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        data.put("price", 50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un solar válido no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testSolar_WithBedrooms_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        data.put("price", 50000.0);
        data.put("bedrooms", 3);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los solares no deben tener habitaciones", errors.isEmpty());
        assertTrue("Debe contener error sobre habitaciones", 
            errors.stream().anyMatch(e -> e.contains("habitaciones")));
    }
    
    @Test
    public void testSolar_WithBathrooms_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        data.put("price", 50000.0);
        data.put("bathrooms", 2);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los solares no deben tener baños", errors.isEmpty());
        assertTrue("Debe contener error sobre baños", 
            errors.stream().anyMatch(e -> e.contains("baños")));
    }
    
    @Test
    public void testSolar_WithAmenities_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        data.put("price", 50000.0);
        data.put("amenities", List.of("Piscina", "Jardín"));
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los solares no deben tener amenidades", errors.isEmpty());
        assertTrue("Debe contener error sobre amenidades", 
            errors.stream().anyMatch(e -> e.contains("amenidades")));
    }
    
    @Test
    public void testSolar_WithoutArea_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno");
        data.put("saleType", "Venta");
        data.put("price", 50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los solares requieren área", errors.isEmpty());
        assertTrue("Debe contener error sobre área", 
            errors.stream().anyMatch(e -> e.contains("área")));
    }
    
    @Test
    public void testSolar_WithoutPrice_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Terreno");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los solares requieren precio", errors.isEmpty());
        assertTrue("Debe contener error sobre precio", 
            errors.stream().anyMatch(e -> e.contains("precio")));
    }

    // ========== Tests para Propiedades Residenciales ==========
    
    @Test
    public void testCasa_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa en Santo Domingo");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 2);
        data.put("area", 150.0);
        data.put("price", 75000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Una casa válida no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testApartamento_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento moderno");
        data.put("saleType", "Alquiler");
        data.put("bedrooms", 2);
        data.put("bathrooms", 1);
        data.put("area", 80.0);
        data.put("price", 18000.0);
        data.put("amenities", List.of("Piscina", "Gimnasio", "Seguridad 24/7"));
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un apartamento válido no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testResidencial_WithoutBedrooms_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa");
        data.put("saleType", "Venta");
        data.put("bathrooms", 2);
        data.put("area", 150.0);
        data.put("price", 75000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Las propiedades residenciales requieren habitaciones", errors.isEmpty());
        assertTrue("Debe contener error sobre habitaciones", 
            errors.stream().anyMatch(e -> e.contains("habitaciones")));
    }
    
    @Test
    public void testResidencial_WithoutBathrooms_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Villa");
        data.put("title", "Villa de lujo");
        data.put("saleType", "Venta");
        data.put("bedrooms", 4);
        data.put("area", 300.0);
        data.put("price", 450000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Las propiedades residenciales requieren baños", errors.isEmpty());
        assertTrue("Debe contener error sobre baños", 
            errors.stream().anyMatch(e -> e.contains("baños")));
    }
    
    @Test
    public void testResidencial_WithoutArea_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Penthouse");
        data.put("title", "Penthouse exclusivo");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 3);
        data.put("price", 250000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Las propiedades residenciales requieren área", errors.isEmpty());
        assertTrue("Debe contener error sobre área construida", 
            errors.stream().anyMatch(e -> e.contains("área")));
    }

    // ========== Tests para Locales Comerciales ==========
    
    @Test
    public void testLocalComercial_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Local Comercial");
        data.put("title", "Local en zona comercial");
        data.put("saleType", "Alquiler");
        data.put("area", 100.0);
        data.put("price", 25000.0);
        data.put("bathrooms", 1);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un local comercial válido no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testLocalComercial_WithBedrooms_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Local Comercial");
        data.put("title", "Local");
        data.put("saleType", "Venta");
        data.put("area", 100.0);
        data.put("price", 80000.0);
        data.put("bedrooms", 1);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los locales comerciales no deben tener habitaciones", errors.isEmpty());
        assertTrue("Debe contener error sobre habitaciones", 
            errors.stream().anyMatch(e -> e.contains("habitaciones")));
    }
    
    @Test
    public void testLocalComercial_WithResidentialAmenities_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Local Comercial");
        data.put("title", "Local");
        data.put("saleType", "Venta");
        data.put("area", 100.0);
        data.put("price", 80000.0);
        data.put("amenities", List.of("Piscina", "Jardín privado"));
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Los locales comerciales no deben tener amenidades residenciales", errors.isEmpty());
        assertTrue("Debe contener error sobre amenidades residenciales", 
            errors.stream().anyMatch(e -> e.toLowerCase().contains("amenidades")));
    }
    
    @Test
    public void testLocalComercial_WithCommercialAmenities_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Local Comercial");
        data.put("title", "Local");
        data.put("saleType", "Venta");
        data.put("area", 100.0);
        data.put("price", 80000.0);
        data.put("amenities", List.of("Estacionamiento", "Seguridad", "Acceso vehicular"));
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Los locales comerciales pueden tener amenidades comerciales", errors.isEmpty());
    }

    // ========== Tests de Validación de Precio vs Área ==========
    
    @Test
    public void testPriceAreaRatio_TooLow_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 2);
        data.put("area", 150.0);
        data.put("price", 1000.0);  // $6.67/m² - muy bajo
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Precio por m² muy bajo debe generar error", errors.isEmpty());
        assertTrue("Debe contener error sobre precio por m² bajo", 
            errors.stream().anyMatch(e -> e.contains("precio por m²") && e.contains("bajo")));
    }
    
    @Test
    public void testPriceAreaRatio_TooHigh_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento");
        data.put("saleType", "Venta");
        data.put("bedrooms", 2);
        data.put("bathrooms", 1);
        data.put("area", 80.0);
        data.put("price", 2000000.0);  // $25,000/m² - muy alto
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Precio por m² muy alto debe generar error", errors.isEmpty());
        assertTrue("Debe contener error sobre precio por m² alto", 
            errors.stream().anyMatch(e -> e.contains("precio por m²") && e.contains("alto")));
    }
    
    @Test
    public void testSolar_PriceAreaRatio_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solares");
        data.put("title", "Solar");
        data.put("saleType", "Venta");
        data.put("area", 1000.0);
        data.put("price", 100000.0);  // $100/m² - válido para solares
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Precio válido para solar no debe generar errores", errors.isEmpty());
    }
    
    @Test
    public void testLocalComercial_PriceAreaRatio_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Local Comercial");
        data.put("title", "Local");
        data.put("saleType", "Venta");
        data.put("area", 200.0);
        data.put("price", 200000.0);  // $1,000/m² - válido para locales
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Precio válido para local comercial no debe generar errores", errors.isEmpty());
    }

    // ========== Tests de Casos Extremos ==========
    
    @Test
    public void testMissingType_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("title", "Propiedad");
        data.put("saleType", "Venta");
        data.put("price", 50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Debe fallar sin tipo de propiedad", errors.isEmpty());
        assertTrue("Debe contener error sobre tipo requerido", 
            errors.stream().anyMatch(e -> e.contains("tipo")));
    }
    
    @Test
    public void testInvalidType_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "TipoInválido");
        data.put("title", "Propiedad");
        data.put("saleType", "Venta");
        data.put("price", 50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Debe fallar con tipo inválido", errors.isEmpty());
        assertTrue("Debe contener error sobre tipo no reconocido", 
            errors.stream().anyMatch(e -> e.contains("no reconocido")));
    }
    
    @Test
    public void testNegativePrice_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 2);
        data.put("area", 150.0);
        data.put("price", -50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Debe fallar con precio negativo", errors.isEmpty());
        assertTrue("Debe contener error sobre precio", 
            errors.stream().anyMatch(e -> e.contains("precio")));
    }
    
    @Test
    public void testZeroArea_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento");
        data.put("saleType", "Venta");
        data.put("bedrooms", 2);
        data.put("bathrooms", 1);
        data.put("area", 0.0);
        data.put("price", 50000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Debe fallar con área cero", errors.isEmpty());
        assertTrue("Debe contener error sobre área", 
            errors.stream().anyMatch(e -> e.contains("área")));
    }

    // ========== Tests de Métodos Auxiliares ==========
    
    @Test
    public void testIsResidentialType() {
        assertTrue(PropertyValidator.isResidentialType("Casa"));
        assertTrue(PropertyValidator.isResidentialType("Apartamento"));
        assertTrue(PropertyValidator.isResidentialType("Penthouse"));
        assertTrue(PropertyValidator.isResidentialType("Villa"));
        assertFalse(PropertyValidator.isResidentialType("Solares"));
        assertFalse(PropertyValidator.isResidentialType("Local Comercial"));
    }
    
    @Test
    public void testIsSolarType() {
        assertTrue(PropertyValidator.isSolarType("Solares"));
        assertFalse(PropertyValidator.isSolarType("Casa"));
        assertFalse(PropertyValidator.isSolarType("Local Comercial"));
    }
    
    @Test
    public void testIsCommercialType() {
        assertTrue(PropertyValidator.isCommercialType("Local Comercial"));
        assertFalse(PropertyValidator.isCommercialType("Casa"));
        assertFalse(PropertyValidator.isCommercialType("Solares"));
    }
}
