package edu.pucmm.service;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import edu.pucmm.model.User;
import org.bson.Document;
import org.mindrot.jbcrypt.BCrypt;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authentication service for secure user authentication
 */
public class AuthService {
    private final MongoCollection<Document> usersCollection;
    private final ConcurrentHashMap<String, SessionData> activeSessions;

    // Session data class
    public static class SessionData {
        private final String email;
        private final Instant createdAt;
        private final Instant expiresAt;

        public SessionData(String email, Instant createdAt, Instant expiresAt) {
            this.email = email;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }

        public String getEmail() {
            return email;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public AuthService(MongoCollection<Document> usersCollection) {
        this.usersCollection = usersCollection;
        this.activeSessions = new ConcurrentHashMap<>();
    }

    /**
     * Hash a password using BCrypt
     */
    public String hashPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(12));
    }

    /**
     * Verify a password against a hash
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Create a new user with hashed password
     */
    public User createUser(String email, String plainPassword) {
        // Check if user already exists
        Document existingUser = usersCollection.find(Filters.eq("email", email)).first();
        if (existingUser != null) {
            throw new IllegalArgumentException("User already exists");
        }

        String passwordHash = hashPassword(plainPassword);
        User user = new User(email, passwordHash);
        usersCollection.insertOne(user.toDocument());
        return user;
    }

    /**
     * Authenticate user and create session
     * Returns session token if successful, null if failed
     */
    public String authenticate(String email, String plainPassword) {
        Document userDoc = usersCollection.find(Filters.eq("email", email)).first();
        if (userDoc == null) {
            return null; // User not found
        }

        User user = User.fromDocument(userDoc);
        if (!verifyPassword(plainPassword, user.getPasswordHash())) {
            return null; // Invalid password
        }

        // Update last login
        user.setLastLogin(Instant.now());
        usersCollection.updateOne(
            Filters.eq("_id", user.getId()),
            new Document("$set", new Document("lastLogin", user.getLastLogin().toString()))
        );

        // Create session token
        String token = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expires = now.plusSeconds(24 * 60 * 60); // 24 hours
        activeSessions.put(token, new SessionData(email, now, expires));

        return token;
    }

    /**
     * Validate a session token
     * Returns the associated email if valid, null otherwise
     */
    public String validateSession(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }

        SessionData session = activeSessions.get(token);
        if (session == null) {
            return null;
        }

        if (session.isExpired()) {
            activeSessions.remove(token);
            return null;
        }

        return session.getEmail();
    }

    /**
     * Invalidate a session (logout)
     */
    public void invalidateSession(String token) {
        if (token != null) {
            activeSessions.remove(token);
        }
    }

    /**
     * Get user by email
     */
    public User getUserByEmail(String email) {
        Document userDoc = usersCollection.find(Filters.eq("email", email)).first();
        if (userDoc == null) {
            return null;
        }
        return User.fromDocument(userDoc);
    }

    /**
     * Initialize default admin user if no users exist
     * IMPORTANT: Change this password after first deployment
     */
    public void initializeDefaultAdmin() {
        long userCount = usersCollection.countDocuments();
        if (userCount == 0) {
            // Create default admin with a temporary password
            // This should be changed immediately after deployment
            String defaultEmail = "admin@milhouserd.com";
            String temporaryPassword = "ChangeMe123!"; // MUST be changed after first login
            
            try {
                createUser(defaultEmail, temporaryPassword);
                System.out.println("Default admin user created: " + defaultEmail);
                System.out.println("IMPORTANT: Change the default password immediately!");
            } catch (Exception e) {
                System.err.println("Failed to create default admin user: " + e.getMessage());
            }
        }
    }

    /**
     * Clean up expired sessions periodically
     */
    public void cleanupExpiredSessions() {
        activeSessions.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}
