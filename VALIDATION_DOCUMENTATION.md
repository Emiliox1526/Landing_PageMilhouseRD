# Documentación de Validación de Propiedades

## Resumen

Este documento describe las reglas de validación implementadas para la publicación de propiedades en el sistema MilhouseRD. Las validaciones aseguran que los datos de las propiedades sean consistentes según su tipo.

## Tipos de Propiedades Soportados

El sistema ahora soporta los siguientes tipos de propiedades:

1. **Casa**
2. **Apartamento**
3. **Penthouse**
4. **Solares** (Terrenos)
5. **Villa**
6. **Local Comercial** (Nuevo)

## Reglas de Validación por Tipo

### 1. Solares (Terrenos)

**Campos Requeridos:**
- Área del solar (m²)
- Precio

**Campos NO Permitidos:**
- Habitaciones
- Baños
- Amenidades residenciales
- Área construida

**Validación de Precio:**
- Mínimo: $10 USD/m²
- Máximo: $5,000 USD/m²

**Ejemplo de Uso:**
```json
{
  "type": "Solares",
  "title": "Terreno en Punta Cana",
  "saleType": "Venta",
  "area": 500,
  "price": 50000
}
```

### 2. Propiedades Residenciales (Casa, Apartamento, Villa, Penthouse)

**Campos Requeridos:**
- Habitaciones (bedrooms) - debe ser ≥ 0
- Baños (bathrooms) - debe ser > 0
- Área construida (m²)
- Precio

**Campos Opcionales:**
- Parqueos
- Amenidades (Piscina, Jardín, Gimnasio, etc.)
- Características especiales

**Validación de Precio:**
- Mínimo: $100 USD/m²
- Máximo: $15,000 USD/m²

**Ejemplo de Uso:**
```json
{
  "type": "Casa",
  "title": "Casa moderna en Santo Domingo",
  "saleType": "Venta",
  "bedrooms": 3,
  "bathrooms": 2,
  "parking": 2,
  "area": 150,
  "price": 75000,
  "amenities": ["Piscina", "Jardín", "Seguridad 24/7"]
}
```

### 3. Locales Comerciales

**Campos Requeridos:**
- Área del local (m²)
- Precio

**Campos Opcionales:**
- Baños (según necesidades)
- Parqueos
- Amenidades comerciales (Estacionamiento, Seguridad, Acceso vehicular)

**Campos NO Permitidos:**
- Habitaciones
- Amenidades residenciales (Piscina, Jardín privado, Cuarto de servicio, etc.)

**Validación de Precio:**
- Mínimo: $50 USD/m²
- Máximo: $10,000 USD/m²

**Ejemplo de Uso:**
```json
{
  "type": "Local Comercial",
  "title": "Local en zona comercial",
  "saleType": "Alquiler",
  "area": 100,
  "price": 25000,
  "bathrooms": 1,
  "amenities": ["Estacionamiento", "Seguridad 24/7"]
}
```

## Validación de Relación Precio/Área

El sistema valida automáticamente que el precio tenga una relación lógica con el área:

```
Precio por m² = Precio Total / Área
```

Si el precio por m² está fuera del rango esperado para el tipo de propiedad, el sistema genera un error de validación.

### Rangos de Precio por m² (USD)

| Tipo de Propiedad | Mínimo | Máximo |
|-------------------|--------|--------|
| Solares | $10 | $5,000 |
| Residencial | $100 | $15,000 |
| Local Comercial | $50 | $10,000 |

## Implementación Técnica

### Backend (Java)

La validación se implementa en la clase `PropertyValidator.java`:

```java
// Validar una propiedad
List<String> errors = PropertyValidator.validate(propertyData);

if (!errors.isEmpty()) {
    // La propiedad tiene errores
    return errors;
}
```

**Ubicación:** `/src/main/java/edu/pucmm/util/PropertyValidator.java`

**Métodos Principales:**
- `validate(Map<String, Object> data)` - Valida una propiedad completa
- `isResidentialType(String type)` - Verifica si es tipo residencial
- `isSolarType(String type)` - Verifica si es un solar
- `isCommercialType(String type)` - Verifica si es comercial

### Frontend (JavaScript)

La validación en el frontend se implementa en `admin.js`:

**Funciones Principales:**
- `getPropertyTypeCategory(type)` - Determina la categoría del tipo
- `toggleFieldsByPropertyType()` - Muestra/oculta campos según el tipo
- `toggleUnitsUI()` - Gestiona la UI de unidades (apartamentos/penthouses)

**Ubicación:** `/src/main/resources/public/js/admin.js`

**Comportamiento:**
- Los campos no aplicables se ocultan automáticamente
- Los campos requeridos se marcan con validación HTML5
- Los valores de campos ocultos se limpian automáticamente
- Las etiquetas se adaptan según el tipo (ej: "Área del solar" vs "Área construida")

## Tests Automatizados

Se han implementado 26 tests automatizados que verifican:

1. ✅ Validación correcta de solares
2. ✅ Rechazo de campos no permitidos en solares
3. ✅ Validación correcta de propiedades residenciales
4. ✅ Validación de campos requeridos en residenciales
5. ✅ Validación correcta de locales comerciales
6. ✅ Rechazo de habitaciones en locales comerciales
7. ✅ Rechazo de amenidades residenciales en locales comerciales
8. ✅ Validación de ratio precio/área (muy bajo)
9. ✅ Validación de ratio precio/área (muy alto)
10. ✅ Validación de casos extremos (valores negativos, cero, etc.)

**Ejecutar tests:**
```bash
./gradlew test --tests "edu.pucmm.util.PropertyValidatorTest"
```

**Ubicación:** `/src/test/java/edu/pucmm/util/PropertyValidatorTest.java`

## Mensajes de Error

### Ejemplos de Mensajes de Validación:

**Solares:**
- "Los solares no deben tener habitaciones"
- "Los solares no deben tener baños"
- "Los solares no deben tener amenidades residenciales"
- "El área del solar es requerida y debe ser mayor a 0"

**Propiedades Residenciales:**
- "El número de habitaciones es requerido y debe ser mayor o igual a 0"
- "El número de baños es requerido y debe ser mayor a 0"
- "El área construida es requerida y debe ser mayor a 0"

**Locales Comerciales:**
- "Los locales comerciales no deben tener habitaciones"
- "Los locales comerciales no deben tener amenidades residenciales como: Piscina"
- "El área del local comercial es requerida y debe ser mayor a 0"

**Precio/Área:**
- "El precio por m² es muy bajo (6.67 USD/m²). Mínimo esperado: 100 USD/m²"
- "El precio por m² es muy alto (25000.00 USD/m²). Máximo esperado: 15000 USD/m²"

## Flujo de Validación

### En el Frontend:

1. Usuario selecciona tipo de propiedad
2. Los campos se muestran/ocultan automáticamente según el tipo
3. Usuario completa el formulario
4. Validación HTML5 verifica campos requeridos
5. Submit envía datos al backend

### En el Backend:

1. PropertyController recibe la petición POST/PUT
2. Se invoca `PropertyValidator.validate()`
3. Si hay errores, se retorna HTTP 400 con lista de errores
4. Si es válido, se guarda en la base de datos

```
Frontend → PropertyController → PropertyValidator → MongoDB
                ↓ (errores)
           HTTP 400 con lista de errores
```

## Ejemplos de Respuestas API

### Éxito (HTTP 201/200):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "message": "created"
}
```

### Error de Validación (HTTP 400):
```json
{
  "errors": [
    "Los solares no deben tener habitaciones",
    "Los solares no deben tener baños",
    "El precio por m² es muy bajo (5.00 USD/m²). Mínimo esperado: 10 USD/m²"
  ]
}
```

## Recomendaciones de Uso

1. **Siempre especifique el tipo de propiedad primero** - Esto permitirá que el sistema muestre los campos apropiados.

2. **Verifique el precio por m²** - Use la calculadora: `Precio Total / Área = USD/m²` para verificar que esté en el rango correcto.

3. **No mezcle conceptos** - No agregue habitaciones a locales comerciales ni amenidades residenciales a solares.

4. **Use amenidades apropiadas**:
   - Residencial: Piscina, Jardín, Gimnasio, Terraza privada, etc.
   - Comercial: Estacionamiento, Seguridad, Acceso vehicular, etc.

5. **Pruebe antes de enviar** - El frontend mostrará errores de validación antes de enviar al servidor.

## Mantenimiento

### Agregar un Nuevo Tipo de Propiedad:

1. Agregar el tipo a `ALLOWED_TYPES` en `PropertyController.java`
2. Agregar constante en `PropertyValidator.java`
3. Implementar método de validación específico (ej: `validateNuevoTipo()`)
4. Agregar caso en el switch de `validate()`
5. Actualizar `admin.html` para incluir el tipo en el select
6. Actualizar `getPropertyTypeCategory()` en `admin.js`
7. Crear tests para el nuevo tipo

### Ajustar Rangos de Precio:

Los rangos se encuentran en el método `validatePriceAreaRatio()` de `PropertyValidator.java`.

```java
case TYPE_CASA:
    minPricePerSqm = 100;     // Ajustar según mercado
    maxPricePerSqm = 15000;   // Ajustar según mercado
    break;
```

## Compatibilidad

- **Java:** 11+
- **Gradle:** 8.x
- **MongoDB:** 4.x+
- **Navegadores:** Chrome, Firefox, Safari, Edge (últimas versiones)

## Soporte

Para preguntas o reportar problemas:
- Revisar los tests en `/src/test/java/edu/pucmm/util/PropertyValidatorTest.java`
- Consultar el código fuente de `PropertyValidator.java`
- Ejecutar los tests para verificar el comportamiento esperado

---

**Última actualización:** Diciembre 2025
**Versión:** 1.0
