package edu.pucmm.controller;

import edu.pucmm.service.AuthService;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

/**
 * Authentication controller for handling login/logout operations
 */
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public void register(Javalin app) {
        
        // Login endpoint
        app.post("/api/auth/login", this::login);
        
        // Logout endpoint
        app.post("/api/auth/logout", this::logout);
        
        // Validate session endpoint
        app.get("/api/auth/validate", this::validateSession);
    }

    /**
     * Handle login request
     * Expects JSON: { "email": "user@example.com", "password": "plaintext" }
     * Returns: { "success": true, "token": "session-token" } or { "success": false, "message": "error" }
     */
    private void login(Context ctx) {
        String email = null;
        try {
            System.out.println("[AUTH] Login request received");
            
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            email = (String) body.get("email");
            String password = (String) body.get("password");

            System.out.println("[AUTH] Login attempt for email: " + (email != null ? email : "null"));

            if (email == null || email.trim().isEmpty()) {
                System.out.println("[AUTH] Login failed: Email is required");
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Email es requerido"
                ));
                return;
            }

            if (password == null || password.trim().isEmpty()) {
                System.out.println("[AUTH] Login failed: Password is required for email: " + email);
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Contraseña es requerida"
                ));
                return;
            }

            // Authenticate user
            String token = authService.authenticate(email.trim(), password);
            
            if (token == null) {
                System.out.println("[AUTH] Authentication failed for email: " + email);
                ctx.status(401).json(Map.of(
                    "success", false,
                    "message", "Usuario o contraseña incorrectos"
                ));
                return;
            }

            System.out.println("[AUTH] Authentication successful for email: " + email);

            // Set cookie with session token with security attributes
            // In production with HTTPS, the Secure flag should be enabled
            io.javalin.http.Cookie cookie = new io.javalin.http.Cookie(
                "session_token", 
                token,
                "/",           // path
                24 * 60 * 60,  // maxAge in seconds (24 hours)
                false,         // secure - set to true in production with HTTPS
                0,             // version
                true           // httpOnly - prevents XSS attacks
            );
            cookie.setSameSite(io.javalin.http.SameSite.STRICT); // CSRF protection
            ctx.cookie(cookie);
            
            System.out.println("[AUTH] Sending successful response with token");
            
            // Ensure we explicitly set status and content-type before sending JSON
            ctx.status(200);
            ctx.contentType("application/json; charset=utf-8");
            ctx.json(Map.of(
                "success", true,
                "message", "Autenticación exitosa",
                "token", token
            ));

        } catch (Exception e) {
            System.err.println("[AUTH] Error in login endpoint: " + e.getMessage());
            e.printStackTrace();
            
            // Ensure we always return valid JSON even on error
            try {
                ctx.status(500);
                ctx.contentType("application/json; charset=utf-8");
                ctx.json(Map.of(
                    "success", false,
                    "message", "Error interno del servidor"
                ));
            } catch (Exception innerE) {
                System.err.println("[AUTH] Critical: Failed to send error response: " + innerE.getMessage());
                innerE.printStackTrace();
            }
        }
    }

    /**
     * Handle logout request
     */
    private void logout(Context ctx) {
        try {
            System.out.println("[AUTH] Logout request received");
            String token = ctx.cookie("session_token");
            if (token != null) {
                authService.invalidateSession(token);
                System.out.println("[AUTH] Session invalidated");
            } else {
                System.out.println("[AUTH] No session token found for logout");
            }
            
            // Clear the cookie
            ctx.removeCookie("session_token");
            
            ctx.status(200);
            ctx.contentType("application/json; charset=utf-8");
            ctx.json(Map.of(
                "success", true,
                "message", "Sesión cerrada exitosamente"
            ));
        } catch (Exception e) {
            System.err.println("[AUTH] Error in logout endpoint: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500);
            ctx.contentType("application/json; charset=utf-8");
            ctx.json(Map.of(
                "success", false,
                "message", "Error al cerrar sesión"
            ));
        }
    }

    /**
     * Validate current session
     */
    private void validateSession(Context ctx) {
        try {
            System.out.println("[AUTH] Session validation request received");
            String token = ctx.cookie("session_token");
            String email = authService.validateSession(token);
            
            if (email != null) {
                System.out.println("[AUTH] Session valid for email: " + email);
                ctx.status(200);
                ctx.contentType("application/json; charset=utf-8");
                ctx.json(Map.of(
                    "success", true,
                    "authenticated", true,
                    "email", email
                ));
            } else {
                System.out.println("[AUTH] Session validation failed - no valid session");
                ctx.status(200);
                ctx.contentType("application/json; charset=utf-8");
                ctx.json(Map.of(
                    "success", true,
                    "authenticated", false
                ));
            }
        } catch (Exception e) {
            System.err.println("[AUTH] Error in validate session endpoint: " + e.getMessage());
            e.printStackTrace();
            ctx.status(500);
            ctx.contentType("application/json; charset=utf-8");
            ctx.json(Map.of(
                "success", false,
                "message", "Error al validar sesión"
            ));
        }
    }

    /**
     * Authentication middleware - call before protected endpoints
     * Returns true if authenticated, false otherwise
     */
    public static boolean requireAuth(Context ctx, AuthService authService) {
        String token = ctx.cookie("session_token");
        String email = authService.validateSession(token);
        
        if (email == null) {
            ctx.status(401).json(Map.of(
                "success", false,
                "message", "No autorizado - inicie sesión"
            ));
            return false;
        }
        
        // Store email in attribute for use in handler
        ctx.attribute("userEmail", email);
        return true;
    }
}
