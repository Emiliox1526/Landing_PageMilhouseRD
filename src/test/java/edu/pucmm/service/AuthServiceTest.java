package edu.pucmm.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import edu.pucmm.model.User;
import org.bson.Document;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Tests for AuthService
 */
public class AuthServiceTest {
    
    private MongoClient mongoClient;
    private MongoDatabase database;
    private MongoCollection<Document> usersCollection;
    private AuthService authService;
    
    @Before
    public void setUp() {
        // Use a test database
        mongoClient = MongoClients.create("mongodb://localhost:27017");
        database = mongoClient.getDatabase("MilhouseRD_Test");
        usersCollection = database.getCollection("users_test");
        
        // Clear the collection before each test
        usersCollection.drop();
        
        authService = new AuthService(usersCollection);
    }
    
    @After
    public void tearDown() {
        if (usersCollection != null) {
            usersCollection.drop();
        }
        if (mongoClient != null) {
            mongoClient.close();
        }
    }
    
    @Test
    public void testHashPassword() {
        String plainPassword = "mySecurePassword123";
        String hash1 = authService.hashPassword(plainPassword);
        String hash2 = authService.hashPassword(plainPassword);
        
        assertNotNull("Hash should not be null", hash1);
        assertNotEquals("Hash should not equal plain password", plainPassword, hash1);
        assertNotEquals("Different hashes should be generated for same password", hash1, hash2);
        assertTrue("Hash should start with $2a$ (BCrypt)", hash1.startsWith("$2a$"));
    }
    
    @Test
    public void testVerifyPassword_Valid() {
        String plainPassword = "testPassword123";
        String hash = authService.hashPassword(plainPassword);
        
        assertTrue("Valid password should verify successfully", 
            authService.verifyPassword(plainPassword, hash));
    }
    
    @Test
    public void testVerifyPassword_Invalid() {
        String plainPassword = "testPassword123";
        String wrongPassword = "wrongPassword";
        String hash = authService.hashPassword(plainPassword);
        
        assertFalse("Invalid password should not verify", 
            authService.verifyPassword(wrongPassword, hash));
    }
    
    @Test
    public void testCreateUser_Success() {
        String email = "test@example.com";
        String password = "securePass123";
        
        User user = authService.createUser(email, password);
        
        assertNotNull("User should be created", user);
        assertEquals("Email should match", email, user.getEmail());
        assertNotNull("Password hash should be set", user.getPasswordHash());
        assertNotEquals("Password should be hashed", password, user.getPasswordHash());
        assertNotNull("Created timestamp should be set", user.getCreatedAt());
    }
    
    @Test(expected = IllegalArgumentException.class)
    public void testCreateUser_DuplicateEmail() {
        String email = "duplicate@example.com";
        String password = "password123";
        
        authService.createUser(email, password);
        // Trying to create another user with same email should throw exception
        authService.createUser(email, password);
    }
    
    @Test
    public void testAuthenticate_Success() {
        String email = "auth@example.com";
        String password = "myPassword123";
        
        authService.createUser(email, password);
        String token = authService.authenticate(email, password);
        
        assertNotNull("Token should be generated on successful authentication", token);
        assertFalse("Token should not be empty", token.isEmpty());
    }
    
    @Test
    public void testAuthenticate_InvalidEmail() {
        String token = authService.authenticate("nonexistent@example.com", "anyPassword");
        
        assertNull("Token should be null for non-existent user", token);
    }
    
    @Test
    public void testAuthenticate_InvalidPassword() {
        String email = "user@example.com";
        String correctPassword = "correctPass123";
        String wrongPassword = "wrongPass123";
        
        authService.createUser(email, correctPassword);
        String token = authService.authenticate(email, wrongPassword);
        
        assertNull("Token should be null for wrong password", token);
    }
    
    @Test
    public void testValidateSession_ValidToken() {
        String email = "session@example.com";
        String password = "password123";
        
        authService.createUser(email, password);
        String token = authService.authenticate(email, password);
        
        String validatedEmail = authService.validateSession(token);
        
        assertNotNull("Validated email should not be null", validatedEmail);
        assertEquals("Validated email should match", email, validatedEmail);
    }
    
    @Test
    public void testValidateSession_InvalidToken() {
        String validatedEmail = authService.validateSession("invalid-token-12345");
        
        assertNull("Invalid token should return null", validatedEmail);
    }
    
    @Test
    public void testValidateSession_NullToken() {
        String validatedEmail = authService.validateSession(null);
        
        assertNull("Null token should return null", validatedEmail);
    }
    
    @Test
    public void testInvalidateSession() {
        String email = "logout@example.com";
        String password = "password123";
        
        authService.createUser(email, password);
        String token = authService.authenticate(email, password);
        
        // Verify token is valid
        assertNotNull("Token should be valid before invalidation", 
            authService.validateSession(token));
        
        // Invalidate the session
        authService.invalidateSession(token);
        
        // Verify token is no longer valid
        assertNull("Token should be invalid after invalidation", 
            authService.validateSession(token));
    }
    
    @Test
    public void testGetUserByEmail_Exists() {
        String email = "getuser@example.com";
        String password = "password123";
        
        authService.createUser(email, password);
        User user = authService.getUserByEmail(email);
        
        assertNotNull("User should be found", user);
        assertEquals("Email should match", email, user.getEmail());
    }
    
    @Test
    public void testGetUserByEmail_NotExists() {
        User user = authService.getUserByEmail("nonexistent@example.com");
        
        assertNull("Non-existent user should return null", user);
    }
}
