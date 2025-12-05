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

    // ========== Tests de Validación de Precio - REMOVED ==========
    // Minimum/maximum price per square meter validation has been removed from the system
    // Prices are now only validated to be greater than 0
    
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

    // ========== Tests para Apartamento/Penthouse con Unidades ==========
    
    @Test
    public void testApartamento_WithUnits_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Edificio con apartamentos");
        data.put("saleType", "Venta");
        data.put("price", 3500000.0);  // Precio del apartamento más económico
        
        // Unidades con sus características
        List<Map<String, Object>> units = List.of(
            Map.of("name", "Tipo A", "bedrooms", 2, "bathrooms", 2, "area", 85.0, "price", 3500000.0),
            Map.of("name", "Tipo B", "bedrooms", 3, "bathrooms", 2, "area", 120.0, "price", 4200000.0)
        );
        data.put("units", units);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un apartamento con unidades válidas no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testPenthouse_WithUnits_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Penthouse");
        data.put("title", "Penthouse de lujo");
        data.put("saleType", "Venta");
        data.put("price", 15000000.0);
        
        List<Map<String, Object>> units = List.of(
            Map.of("name", "PH-A", "bedrooms", 3, "bathrooms", 3, "area", 250.0, "price", 15000000.0),
            Map.of("name", "PH-B", "bedrooms", 4, "bathrooms", 4, "area", 300.0, "price", 18000000.0)
        );
        data.put("units", units);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Un penthouse con unidades válidas no debe tener errores", errors.isEmpty());
    }
    
    @Test
    public void testApartamento_WithUnits_NoRootLevelFieldsRequired() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamentos modernos");
        data.put("saleType", "Venta");
        data.put("price", 2800000.0);
        // NO se incluyen bedrooms, bathrooms, area a nivel raíz
        
        List<Map<String, Object>> units = List.of(
            Map.of("name", "Estudio", "bedrooms", 0, "bathrooms", 1, "area", 45.0, "price", 2800000.0),
            Map.of("name", "1 habitación", "bedrooms", 1, "bathrooms", 1, "area", 60.0, "price", 3200000.0)
        );
        data.put("units", units);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Apartamento con unidades no debe requerir bedrooms/bathrooms/area a nivel raíz", 
                   errors.isEmpty());
    }
    
    @Test
    public void testApartamento_WithEmptyUnits_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento");
        data.put("saleType", "Venta");
        data.put("price", 3500000.0);
        data.put("units", List.of());  // Array vacío
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Apartamento con array de unidades vacío debe fallar", errors.isEmpty());
        assertTrue("Debe requerir al menos una unidad", 
                   errors.stream().anyMatch(e -> e.toLowerCase().contains("unidad")));
    }
    
    @Test
    public void testApartamento_WithIncompleteUnit_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento");
        data.put("saleType", "Venta");
        data.put("price", 3500000.0);
        
        // Unidad sin area
        List<Map<String, Object>> units = List.of(
            Map.of("name", "Tipo A", "bedrooms", 2, "bathrooms", 2)
        );
        data.put("units", units);
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Unidad sin área debe fallar", errors.isEmpty());
        assertTrue("Debe contener error sobre área en la unidad", 
                   errors.stream().anyMatch(e -> e.toLowerCase().contains("área")));
    }
    
    @Test
    public void testApartamento_WithoutUnits_Legacy_RequiresRootFields() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento individual");
        data.put("saleType", "Venta");
        data.put("price", 3500000.0);
        // NO hay campo units - caso legacy
        data.put("bedrooms", 2);
        data.put("bathrooms", 2);
        data.put("area", 85.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Apartamento legacy con campos a nivel raíz debe ser válido", errors.isEmpty());
    }
    
    @Test
    public void testApartamento_WithoutUnits_Legacy_MissingFields_ShouldFail() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Apartamento");
        data.put("title", "Apartamento");
        data.put("saleType", "Venta");
        data.put("price", 3500000.0);
        // NO hay campo units NI campos a nivel raíz
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Apartamento legacy sin campos debe fallar", errors.isEmpty());
        assertTrue("Debe contener error sobre habitaciones", 
                   errors.stream().anyMatch(e -> e.contains("habitaciones")));
        assertTrue("Debe contener error sobre baños", 
                   errors.stream().anyMatch(e -> e.contains("baños")));
        assertTrue("Debe contener error sobre área", 
                   errors.stream().anyMatch(e -> e.contains("área")));
    }
    
    @Test
    public void testPenthouse_WithoutUnits_Legacy_Valid() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Penthouse");
        data.put("title", "Penthouse exclusivo");
        data.put("saleType", "Venta");
        data.put("bedrooms", 3);
        data.put("bathrooms", 3);
        data.put("area", 200.0);
        data.put("price", 14500000.0);
        
        List<String> errors = PropertyValidator.validate(data);
        assertTrue("Penthouse legacy con campos a nivel raíz debe ser válido", errors.isEmpty());
    }
    
    @Test
    public void testCasa_AlwaysRequiresRootFields() {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "Casa");
        data.put("title", "Casa");
        data.put("saleType", "Venta");
        data.put("price", 5000000.0);
        // Casa no soporta unidades, siempre debe tener campos a nivel raíz
        
        List<String> errors = PropertyValidator.validate(data);
        assertFalse("Casa sin campos a nivel raíz debe fallar", errors.isEmpty());
        assertTrue("Debe contener errores sobre campos requeridos", 
                   errors.stream().anyMatch(e -> e.contains("habitaciones") || 
                                                 e.contains("baños") || 
                                                 e.contains("área")));
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
