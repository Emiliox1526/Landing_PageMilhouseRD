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
        data.put("price", 2900000.0);  // RD$2,900,000 (RD$5,800/m² - válido)
        
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
        data.put("price", 2900000.0);  // RD$2,900,000
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
        data.put("price", 2900000.0);  // RD$2,900,000
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
        data.put("price", 2900000.0);  // RD$2,900,000
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
        data.put("price", 2900000.0);  // RD$2,900,000
        
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
        data.put("price", 4350000.0);  // RD$4,350,000 (~RD$29,000/m² - válido)
        
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
        data.put("price", 1044000.0);  // RD$1,044,000 (~RD$13,050/m² - válido)
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
        data.put("price", 4350000.0);  // RD$4,350,000
        
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
        data.put("price", 26100000.0);  // RD$26,100,000
        
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
        data.put("price", 14500000.0);  // RD$14,500,000
        
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
        data.put("price", 1450000.0);  // RD$1,450,000 (RD$14,500/m² - válido)
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
        data.put("price", 4640000.0);  // RD$4,640,000
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
        data.put("price", 4640000.0);  // RD$4,640,000
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
        data.put("price", 4640000.0);  // RD$4,640,000
        data.put("amenities", List.of("Estacionamiento", "Seguridad", "Acceso vehicular"));
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Los locales comerciales pueden tener amenidades comerciales", errors.isEmpty());
    }

    // ========== Tests de Validación de Precio - ELIMINADOS ==========
    // La validación de precio mínimo/máximo por m² ha sido eliminada del sistema
    // Los precios ahora solo se validan que sean mayores a 0
    
    @Test
    public void testPriceValidation_OnlyRequiresPositive() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 2);
        data.put("area", 150.0);
        data.put("price", 1.0);  // Cualquier precio positivo es válido ahora
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Cualquier precio positivo debe ser aceptado", errors.isEmpty());
    }

    // ========== Tests de Casos Extremos ==========
    
    @Test
    public void testMissingType_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("title", "Propiedad");
        data.put("saleType", "Venta");
        data.put("price", 2900000.0);  // RD$2,900,000
        
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
        data.put("price", 2900000.0);  // RD$2,900,000
        
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
        data.put("price", -2900000.0);  // Precio negativo
        
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
        data.put("price", 2900000.0);  // RD$2,900,000
        
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
        assertTrue(PropertyValidator.isSolarType("Solar"));
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

    // ========== Test para nombre unificado "Solar" ==========
    
    @Test
    public void testSolar_NewName_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Solar");  // Nuevo nombre estandarizado
        data.put("title", "Terreno en Bávaro");
        data.put("saleType", "Venta");
        data.put("area", 500.0);
        data.put("price", 2900000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un solar con el nuevo nombre debe ser válido", errors.isEmpty());
    }
}
