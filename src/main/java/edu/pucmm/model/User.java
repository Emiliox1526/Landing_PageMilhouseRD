package edu.pucmm.model;

import org.bson.Document;
import org.bson.types.ObjectId;

import java.time.Instant;

/**
 * User model for authentication
 */
public class User {
    private ObjectId id;
    private String email;
    private String passwordHash;
    private Instant createdAt;
    private Instant lastLogin;

    public User() {
        this.createdAt = Instant.now();
    }

    public User(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now();
    }

    // Convert to MongoDB Document
    public Document toDocument() {
        Document doc = new Document();
        if (id != null) doc.append("_id", id);
        doc.append("email", email);
        doc.append("passwordHash", passwordHash);
        doc.append("createdAt", createdAt.toString());
        if (lastLogin != null) doc.append("lastLogin", lastLogin.toString());
        return doc;
    }

    // Create from MongoDB Document
    public static User fromDocument(Document doc) {
        User user = new User();
        user.setId(doc.getObjectId("_id"));
        user.setEmail(doc.getString("email"));
        user.setPasswordHash(doc.getString("passwordHash"));
        String createdAtStr = doc.getString("createdAt");
        if (createdAtStr != null) user.setCreatedAt(Instant.parse(createdAtStr));
        String lastLoginStr = doc.getString("lastLogin");
        if (lastLoginStr != null) user.setLastLogin(Instant.parse(lastLoginStr));
        return user;
    }

    // Getters and Setters
    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Instant lastLogin) {
        this.lastLogin = lastLogin;
    }
}
