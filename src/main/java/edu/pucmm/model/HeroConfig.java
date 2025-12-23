package edu.pucmm.model;

import org.bson.types.ObjectId;
import java.time.Instant;

/**
 * Modelo para la configuración del Hero de la página de propiedades.
 * Permite personalizar la imagen de fondo, título y descripción del hero
 * de manera independiente de las propiedades individuales.
 */
public class HeroConfig {
    
    private ObjectId _id;
    private String id;              // ID fijo: "propiedades_hero"
    private String imageUrl;        // URL de la imagen de fondo
    private String title;           // Título del hero
    private String description;     // Descripción del hero
    private Instant updatedAt;      // Fecha de última actualización
    private String updatedBy;       // Email del admin que actualizó
    
    public HeroConfig() {}
    
    // Getters y setters
    
    public ObjectId get_id() {
        return _id;
    }
    
    public void set_id(ObjectId _id) {
        this._id = _id;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
