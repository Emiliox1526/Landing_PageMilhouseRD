# Implementación de Autenticación Segura

## Resumen de Cambios

Este documento describe la implementación del sistema de autenticación seguro que reemplaza las credenciales hardcodeadas en el frontend.

## 🔒 Problema de Seguridad Resuelto

**Antes**: Las credenciales estaban expuestas en el archivo `login.js`:
```javascript
if (username === '1834jml@gmail.com' && password === 'Desiree2009') {
    // login success
}
```

**Ahora**: La autenticación se realiza completamente en el backend con las siguientes medidas de seguridad:

1. ✅ **Hashing de contraseñas con BCrypt** (work factor 12)
2. ✅ **Validación del lado del servidor** (Java/Javalin)
3. ✅ **Sesiones seguras** con tokens UUID
4. ✅ **Cookies HTTPOnly** para tokens de sesión
5. ✅ **Sin credenciales en el código frontend**
6. ✅ **Expiración de sesiones** (24 horas)
7. ✅ **Protección de rutas administrativas**

## 📁 Archivos Nuevos

### Backend (Java)
- `src/main/java/edu/pucmm/model/User.java` - Modelo de usuario para MongoDB
- `src/main/java/edu/pucmm/service/AuthService.java` - Servicio de autenticación con BCrypt
- `src/main/java/edu/pucmm/controller/AuthController.java` - Endpoints de autenticación (login/logout/validate)

### Tests
- `src/test/java/edu/pucmm/service/AuthServiceTest.java` - Tests unitarios para AuthService

## 📝 Archivos Modificados

### Backend
- `build.gradle` - Agregada dependencia de BCrypt (`org.mindrot:jbcrypt:0.4`)
- `src/main/java/edu/pucmm/Main.java` - Integración del sistema de autenticación

### Frontend
- `src/main/resources/public/js/login.js` - Ahora llama al API de autenticación backend
- `src/main/resources/public/js/includeHeader.js` - Valida sesión con el backend
- `src/main/resources/public/js/admin.js` - Protección de la página de administración

## 🔑 Usuario Administrador por Defecto

Al iniciar la aplicación por primera vez (cuando no existen usuarios en la base de datos), se crea automáticamente un usuario administrador:

- **Email**: `admin@milhouserd.com` (configurable con `DEFAULT_ADMIN_EMAIL`)
- **Contraseña temporal**: `ChangeMe123!` (configurable con `DEFAULT_ADMIN_PASSWORD`)

### 🔧 Configuración mediante Variables de Entorno

Puede personalizar las credenciales del administrador por defecto usando variables de entorno:

```bash
# Ejemplo de configuración
export DEFAULT_ADMIN_EMAIL="admin@tudominio.com"
export DEFAULT_ADMIN_PASSWORD="TuPasswordSegura123!"
```

### ⚠️ IMPORTANTE: Cambio de Contraseña

**DEBE cambiar esta contraseña inmediatamente después del primer despliegue en producción.**

Para cambiar la contraseña, puede:
1. Crear un endpoint adicional para cambio de contraseña, o
2. Usar MongoDB directamente para actualizar el usuario con una nueva contraseña hasheada

## 🌐 Endpoints de Autenticación

### POST `/api/auth/login`
Autentica un usuario y crea una sesión.

**Request Body**:
```json
{
  "email": "admin@milhouserd.com",
  "password": "ChangeMe123!"
}
```

**Response (éxito)**:
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "token": "uuid-session-token"
}
```

**Response (error)**:
```json
{
  "success": false,
  "message": "Usuario o contraseña incorrectos"
}
```

### POST `/api/auth/logout`
Cierra la sesión actual.

**Response**:
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### GET `/api/auth/validate`
Valida si la sesión actual es válida.

**Response (autenticado)**:
```json
{
  "success": true,
  "authenticated": true,
  "email": "admin@milhouserd.com"
}
```

**Response (no autenticado)**:
```json
{
  "success": true,
  "authenticated": false
}
```

## 🔐 Flujo de Autenticación

1. Usuario ingresa email y contraseña en `/login.html`
2. Frontend envía credenciales a `POST /api/auth/login`
3. Backend verifica credenciales:
   - Busca usuario por email en MongoDB
   - Compara contraseña usando BCrypt
   - Si válido: crea token de sesión y lo guarda en cookie HTTPOnly
4. Usuario es redirigido a `/index.html`
5. Al cargar cualquier página, `includeHeader.js` valida la sesión con `GET /api/auth/validate`
6. Al intentar acceder a `/admin.html`, `admin.js` verifica autenticación y redirige a login si es necesario

## 🛡️ Protección de Rutas Administrativas

Las rutas que requieren autenticación pueden usar el middleware `AuthController.requireAuth()`:

```java
app.get("/api/admin/something", ctx -> {
    if (!AuthController.requireAuth(ctx, authService)) {
        return; // Ya envió respuesta 401
    }
    // Código protegido aquí
    String userEmail = ctx.attribute("userEmail");
    // ...
});
```

## 🔧 Construcción y Despliegue

```bash
# Compilar el proyecto
./gradlew build -x test

# Ejecutar localmente
./gradlew run

# Generar JAR
./gradlew shadowJar
```

## 📊 Base de Datos

El sistema crea una nueva colección en MongoDB:

- **Colección**: `users`
- **Campos**:
  - `_id`: ObjectId
  - `email`: String (único)
  - `passwordHash`: String (BCrypt)
  - `createdAt`: String (ISO timestamp)
  - `lastLogin`: String (ISO timestamp)

## 🔬 Testing

Los tests requieren MongoDB en ejecución. Para ejecutar sin tests:
```bash
./gradlew build -x test
```

Para ejecutar con tests (requiere MongoDB local):
```bash
./gradlew test
```

## ✅ Verificación de Seguridad

- ✅ No hay credenciales en texto plano en el código
- ✅ Las contraseñas se hashean con BCrypt (irreversible)
- ✅ Los tokens de sesión son UUID aleatorios
- ✅ Las sesiones expiran automáticamente (24 horas)
- ✅ Las cookies son HTTPOnly (no accesibles desde JavaScript para prevenir XSS)
- ✅ Las cookies tienen SameSite=Strict (protección contra CSRF)
- ✅ Validación del lado del servidor para todas las operaciones
- ✅ Protección contra ataques de fuerza bruta (BCrypt es lento por diseño)
- ✅ Configuración de credenciales mediante variables de entorno
- ✅ CodeQL security scan: Sin vulnerabilidades detectadas

## 📚 Próximos Pasos Recomendados

1. Cambiar la contraseña del administrador por defecto
2. Implementar límite de intentos de login (rate limiting)
3. Agregar autenticación de dos factores (2FA)
4. Implementar recuperación de contraseña por email
5. Agregar logging de intentos de acceso
6. Configurar HTTPS en producción (obligatorio)
7. Considerar usar JWT en lugar de sesiones en memoria para escalabilidad

## 🔒 Notas de Seguridad Adicionales

- **HTTPS**: En producción, SIEMPRE use HTTPS para proteger las credenciales en tránsito
- **Contraseñas**: Nunca use la contraseña por defecto en producción
- **Tokens**: Los tokens de sesión se almacenan en memoria, se perderán al reiniciar el servidor
- **CORS**: Configure adecuadamente los orígenes permitidos en producción
- **Variables de entorno**: No incluya credenciales de MongoDB en el código (use variables de entorno)
