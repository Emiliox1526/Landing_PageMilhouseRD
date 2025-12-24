# Landing Page Milhouse RD

Sistema de administración de propiedades inmobiliarias con soporte avanzado de subida de imágenes.

## 🔗 Estructura de URLs

El sistema utiliza URLs limpias sin extensiones `.html` para una mejor experiencia de usuario y SEO:

### URLs Públicas
- **Inicio**: `/` o `/index.html`
- **Propiedades**: `/property/?id={propertyId}`
- **Login**: `/login/`

### URL de Administración
- **Panel de Administración**: `/management-panel-mh2024/`
  - La URL del panel de administración está ofuscada para dificultar el acceso no autorizado
  - Solo accesible tras autenticación exitosa mediante el sistema de login
  - El enlace al panel **no aparece en la navegación pública**
  - Solo es visible en el dropdown de usuario una vez autenticado

### Seguridad de Acceso al Panel de Administración

El sistema implementa múltiples capas de seguridad para proteger el panel de administración:

1. **URL No Obvia**: El panel usa una ruta ofuscada (`/management-panel-mh2024/`) en lugar de `/admin/`
2. **Autenticación Backend**: El servidor valida la sesión mediante `/api/auth/validate` antes de mostrar contenido
3. **Redirección Automática**: Usuarios no autenticados son redirigidos automáticamente a `/login/`
4. **Visibilidad Condicional**: El enlace al panel solo aparece en el header para usuarios autenticados
5. **Validación de Sesión**: Cada carga de página admin verifica la autenticación con el backend

> **Nota de Seguridad**: Aunque la URL está ofuscada, esto es solo una medida de "seguridad por oscuridad". La verdadera protección viene de la autenticación backend. No confíes únicamente en URLs ocultas para proteger contenido sensible.

## 🏖️ Características de Propiedades Tipo Solar

### Precio por Metro Cuadrado

Para propiedades de tipo **Solar** o **Solares**, el sistema incluye funcionalidad especial para mostrar el precio por metro cuadrado:

- **Cálculo Automático**: Si no se especifica, el sistema calcula automáticamente el precio por m² dividiendo el precio total entre el área
- **Visualización Destacada**: En la pantalla de detalles, el precio por m² se muestra prominentemente arriba del precio total
- **Formato Claro**: Se presenta en formato de moneda dominicana (RD$) con la etiqueta "/m²"
- **Sin Afectar Otros Tipos**: Esta funcionalidad solo aplica a propiedades tipo Solar/Solares, sin modificar la visualización de otros tipos

#### Ejemplo de Uso

Al crear o editar una propiedad tipo Solar:
1. El campo `pricePerSqm` puede especificarse manualmente en el backend
2. Si no se especifica, se calcula automáticamente: `pricePerSqm = price / area`
3. En la página de detalles, se muestra destacado con un fondo de color y borde distintivo

## 📸 Sistema de Subida de Imágenes

### Características

- **Formatos Soportados**: JPG, JPEG, PNG, GIF, BMP, WebP, SVG, TIFF
- **Tamaño Máximo por Imagen**: 25 MB
- **Límite de Imágenes**: Hasta 100 imágenes por lote
- **Almacenamiento**: GridFS (MongoDB) para persistencia segura
- **Validación**: MIME type, extensión y magic bytes (prevención de archivos maliciosos)
- **Interfaz**: Drag & drop, vista previa, barras de progreso

### Límites y Configuración

Los límites del sistema están configurados en `src/main/resources/upload-config.properties`:

```properties
# Tamaño máximo por imagen (MB)
max.image.size.mb=25

# Número máximo de imágenes por lote
max.images.per.batch=100

# Tamaño máximo total del request (MB)
max.request.size.mb=2600

# Extensiones permitidas
allowed.image.extensions=.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif

# Tipos MIME permitidos
allowed.mime.types=image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml,image/tiff

# Validación estricta de MIME
strict.mime.validation=true

# Validación de magic bytes (seguridad)
enable.magic.byte.validation=true
```

### Validación de Seguridad

El sistema implementa múltiples capas de validación:

1. **Frontend**:
   - Validación de extensión de archivo
   - Validación de tipo MIME
   - Validación de tamaño de archivo
   - Límite de cantidad de archivos

2. **Backend**:
   - Validación de extensión
   - Validación de tipo MIME
   - Validación de tamaño
   - **Validación de magic bytes**: Previene archivos maliciosos que intentan pasar como imágenes

### Uso

#### Subir Imágenes (Frontend)

El administrador puede subir imágenes de tres formas:

1. **Click**: Hacer clic en la zona de subida
2. **Drag & Drop**: Arrastrar archivos desde el explorador
3. **Selector de archivos**: Usar el input file tradicional

```javascript
// Las imágenes se validan automáticamente
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];
const MAX_FILE_MB = 25;
const MAX_IMAGES = 100;
```

#### API de Subida (Backend)

**Endpoint**: `POST /api/uploads`

**Request**: `multipart/form-data` con campo `files`

**Response exitoso**:
```json
{
  "urls": [
    "/api/images/507f1f77bcf86cd799439011",
    "/api/images/507f191e810c19729de860ea"
  ]
}
```

**Response con errores parciales**:
```json
{
  "urls": ["/api/images/507f1f77bcf86cd799439011"],
  "warnings": [
    "Archivo 2 (malicious.exe): el contenido no coincide con el tipo declarado"
  ]
}
```

**Response con error total**:
```json
{
  "message": "No se pudieron subir imágenes",
  "errors": [
    "Archivo 1 (image.jpg): excede el tamaño máximo de 25MB",
    "Archivo 2 (file.txt): tipo MIME no permitido"
  ]
}
```

### Compatibilidad

- ✅ **Imágenes Antiguas**: El sistema mantiene compatibilidad con imágenes previamente subidas
- ✅ **Flujos Existentes**: No se modifican los flujos de negocio actuales
- ✅ **Base de Datos**: La estructura de datos se mantiene sin cambios

### Desarrollo

#### Ejecutar en Local

```bash
# Iniciar el servidor backend (Java)
./gradlew run

# O con Docker
docker build -t milhouse-rd .
docker run -p 7070:7070 milhouse-rd
```

El servidor estará disponible en `http://localhost:7070`

#### Ejecutar Tests

```bash
# Tests completos
./gradlew test

# Tests específicos de validación de imágenes
./gradlew test --tests "edu.pucmm.util.ImageValidatorTest"
```

#### Build para Producción

```bash
# Build con shadow JAR
./gradlew shadowJar

# El JAR estará en build/libs/Landing_PageMilhouseRD-1.0-SNAPSHOT-all.jar
```

### Variables de Entorno

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=MilhouseRD
MONGODB_COLLECTION=properties

# Server
PORT=7070
ALLOWED_ORIGIN=*

# Uploads
UPLOADS_DIR=/path/to/uploads
```

### Estructura de Archivos

```
src/
├── main/
│   ├── java/
│   │   └── edu/pucmm/
│   │       ├── config/
│   │       │   ├── MongoConfig.java
│   │       │   └── UploadConfig.java          # Configuración de uploads
│   │       ├── controller/
│   │       │   ├── PropertyController.java
│   │       │   └── UploadController.java       # Manejo de subida de imágenes
│   │       ├── model/
│   │       │   └── Property.java
│   │       ├── util/
│   │       │   ├── ImageValidator.java         # Validación de imágenes
│   │       │   └── PropertyValidator.java
│   │       └── Main.java
│   └── resources/
│       ├── upload-config.properties            # Configuración de límites
│       └── public/
│           ├── admin.html                      # Interfaz de administración
│           └── js/
│               └── admin.js                    # Lógica de frontend
└── test/
    └── java/
        └── edu/pucmm/
            └── util/
                └── PropertyValidatorTest.java
```

### Formatos de Imagen Soportados

| Formato | Extensión | MIME Type | Magic Bytes Validados |
|---------|-----------|-----------|----------------------|
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` | ✅ |
| PNG | `.png` | `image/png` | ✅ |
| GIF | `.gif` | `image/gif` | ✅ |
| BMP | `.bmp` | `image/bmp` | ✅ |
| WebP | `.webp` | `image/webp` | ✅ |
| SVG | `.svg` | `image/svg+xml` | ✅ |
| TIFF | `.tiff`, `.tif` | `image/tiff` | ✅ |

### Seguridad

El sistema implementa las siguientes medidas de seguridad:

1. **Validación de Magic Bytes**: Verifica que el contenido del archivo coincida con su tipo declarado
2. **Validación de MIME Type**: Solo acepta tipos MIME de imagen
3. **Validación de Extensión**: Solo acepta extensiones de imagen conocidas
4. **Límite de Tamaño**: Previene ataques de denegación de servicio
5. **Límite de Cantidad**: Previene sobrecarga del servidor
6. **Sanitización de Nombres**: Los nombres de archivo son generados por el servidor

### Métricas de Rendimiento

- **Subida Concurrente**: Hasta 10 imágenes simultáneas
- **Tamaño Máximo por Request**: 2.6 GB
- **Timeout**: 60 segundos por imagen
- **Almacenamiento**: GridFS con compresión automática

### Soporte

Para reportar issues o solicitar nuevas características, por favor contacta al equipo de desarrollo.

## Licencia

Propietario - Milhouse RD © 2025
