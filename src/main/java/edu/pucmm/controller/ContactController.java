package edu.pucmm.controller;

import com.mongodb.client.MongoCollection;
import io.javalin.Javalin;
import org.bson.Document;

import java.util.ArrayList;

/**
 * Maneja la API de contactos.
 */
public class ContactController {

    private final MongoCollection<Document> contacts;

    public ContactController(MongoCollection<Document> contacts) {
        this.contacts = contacts;
    }

    /**
     * Registra los endpoints bajo /api/contacts.
     */
    public void register(Javalin app) {
        app.post("/api/contacts", ctx -> {
            Document doc = Document.parse(ctx.body());
            contacts.insertOne(doc);
            ctx.status(201).json(doc);
        });

        app.get("/api/contacts", ctx ->
                ctx.json(contacts.find().into(new ArrayList<>()))
        );
    }
}

