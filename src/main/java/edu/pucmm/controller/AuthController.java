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
        try {
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            String email = (String) body.get("email");
            String password = (String) body.get("password");

            if (email == null || email.trim().isEmpty()) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Email es requerido"
                ));
                return;
            }

            if (password == null || password.trim().isEmpty()) {
                ctx.status(400).json(Map.of(
                    "success", false,
                    "message", "Contraseña es requerida"
                ));
                return;
            }

            // Authenticate user
            String token = authService.authenticate(email.trim(), password);
            
            if (token == null) {
                ctx.status(401).json(Map.of(
                    "success", false,
                    "message", "Usuario o contraseña incorrectos"
                ));
                return;
            }

            // Set cookie with session token (HTTPOnly and Secure in production)
            ctx.cookie("session_token", token, 24 * 60 * 60); // 24 hours
            
            ctx.json(Map.of(
                "success", true,
                "message", "Autenticación exitosa",
                "token", token
            ));

        } catch (Exception e) {
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Error interno del servidor"
            ));
        }
    }

    /**
     * Handle logout request
     */
    private void logout(Context ctx) {
        try {
            String token = ctx.cookie("session_token");
            if (token != null) {
                authService.invalidateSession(token);
            }
            
            // Clear the cookie
            ctx.removeCookie("session_token");
            
            ctx.json(Map.of(
                "success", true,
                "message", "Sesión cerrada exitosamente"
            ));
        } catch (Exception e) {
            ctx.status(500).json(Map.of(
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
            String token = ctx.cookie("session_token");
            String email = authService.validateSession(token);
            
            if (email != null) {
                ctx.json(Map.of(
                    "success", true,
                    "authenticated", true,
                    "email", email
                ));
            } else {
                ctx.json(Map.of(
                    "success", true,
                    "authenticated", false
                ));
            }
        } catch (Exception e) {
            ctx.status(500).json(Map.of(
                "success", false,
                "message", "Error al validar sesión"
            ));
        }
    }

    /**
     * Authentication middleware - call before protected endpoints
     */
    public static void requireAuth(Context ctx, AuthService authService) {
        String token = ctx.cookie("session_token");
        String email = authService.validateSession(token);
        
        if (email == null) {
            ctx.status(401).json(Map.of(
                "success", false,
                "message", "No autorizado - inicie sesión"
            ));
            // Prevent further processing
            ctx.skipRemainingHandlers();
        }
        
        // Store email in attribute for use in handler
        ctx.attribute("userEmail", email);
    }
}
