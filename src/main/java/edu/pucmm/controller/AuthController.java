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
        System.out.println("[AUTH] Login endpoint called");
        String email = null;
        try {
            System.out.println("[AUTH] Parsing request body");
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            email = (String) body.get("email");
            String password = (String) body.get("password");

            System.out.println("[AUTH] Login attempt for: " + (email != null ? email : "null"));

            // Validate email
            if (email == null || email.trim().isEmpty()) {
                System.out.println("[AUTH] Missing email");
                ctx.status(400)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Email es requerido"
                   ));
                return;
            }

            // Validate password
            if (password == null || password.trim().isEmpty()) {
                System.out.println("[AUTH] Missing password");
                ctx.status(400)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Contraseña es requerida"
                   ));
                return;
            }

            // Authenticate user
            String token = null;
            try {
                System.out.println("[AUTH] Calling authentication service");
                token = authService.authenticate(email.trim(), password);
                System.out.println("[AUTH] Authentication result: " + (token != null ? "SUCCESS" : "FAILED"));
            } catch (Exception authEx) {
                System.err.println("[AUTH] Exception during authentication: " + authEx.getMessage());
                authEx.printStackTrace();
                ctx.status(500)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Error durante la autenticación"
                   ));
                return;
            }
            
            if (token == null) {
                System.out.println("[AUTH] Invalid credentials");
                ctx.status(401)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Usuario o contraseña incorrectos"
                   ));
                return;
            }

            System.out.println("[AUTH] Authentication successful");

            // Set cookie - this might be where the error occurs in production
            try {
                System.out.println("[AUTH] Setting session cookie");
                io.javalin.http.Cookie cookie = new io.javalin.http.Cookie(
                    "session_token", 
                    token,
                    "/",           // path
                    24 * 60 * 60,  // maxAge in seconds (24 hours)
                    false,         // secure - consider true for HTTPS in production
                    0,             // version
                    true           // httpOnly - prevents XSS attacks
                );
                cookie.setSameSite(io.javalin.http.SameSite.STRICT); // CSRF protection
                ctx.cookie(cookie);
                System.out.println("[AUTH] Cookie set successfully");
            } catch (Exception cookieEx) {
                System.err.println("[AUTH] Error setting cookie: " + cookieEx.getMessage());
                cookieEx.printStackTrace();
                // Cookie setting failed - return error since session won't work
                ctx.status(500)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Error al establecer la sesión"
                   ));
                return;
            }
            
            // Return success response
            try {
                System.out.println("[AUTH] Sending success response");
                ctx.status(200)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", true,
                       "message", "Autenticación exitosa"
                   ));
                System.out.println("[AUTH] Response sent successfully");
            } catch (Exception responseEx) {
                System.err.println("[AUTH] Error sending response: " + responseEx.getMessage());
                responseEx.printStackTrace();
                throw responseEx; // Re-throw to be caught by outer catch
            }

        } catch (Exception e) {
            System.err.println("[AUTH] Unexpected error in login endpoint: " + e.getMessage());
            e.printStackTrace();
            
            // Ensure we always return valid JSON even on error
            try {
                ctx.status(500)
                   .contentType("application/json; charset=utf-8")
                   .json(Map.of(
                       "success", false,
                       "message", "Error interno del servidor"
                   ));
            } catch (Exception jsonEx) {
                System.err.println("[AUTH] Failed to send error response: " + jsonEx.getMessage());
                jsonEx.printStackTrace();
                // Last resort - send plain text error
                ctx.status(500)
                   .contentType("text/plain")
                   .result("Internal server error");
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
