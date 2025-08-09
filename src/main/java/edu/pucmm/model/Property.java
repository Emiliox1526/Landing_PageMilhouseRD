package edu.pucmm.model;

import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Modelo de Propiedad.
 * - type: Casa | Apartamento | Penthouse | Solares | Villa
 * - latitude / longitude: coordenadas
 * - units[].area: área de cada unidad (m²)
 */
public class Property {

    // Identificador Mongo
    public ObjectId _id;

    // Datos básicos
    public String title;
    public String type;           // Casa | Apartamento | Penthouse | Solares | Villa
    public String saleType;       // Venta / Alquiler / etc.

    // Precio principal (opcional si usas por unidad)
    public Double price;
    public String priceFormatted;

    // Resumen general
    public Integer bedrooms;
    public Integer bathrooms;
    public Integer parking;
    public Double area;           // Área total de la propiedad (m²) – opcional

    // Ubicación
    public String address;        // Texto libre (opcional)
    public Double latitude;       // NUEVO
    public Double longitude;      // NUEVO

    // Contenido
    public String descriptionParagraph;
    public List<String> features = new ArrayList<>();
    public List<String> amenities = new ArrayList<>();
    public List<String> images = new ArrayList<>();

    // Unidades / Tipología
    public List<Unit> units = new ArrayList<>();

    // Relacionados
    public List<Related> related = new ArrayList<>();

    // Metadatos
    public Date createdAt;
    public Date updatedAt;

    public static class Unit {
        public String name;
        public Integer floor;
        public Integer bedrooms;
        public Integer bathrooms;
        public Integer parking;
        public String zone;
        public Boolean terrace;

        public Double price;
        public String priceFormatted;

        public Double area; // NUEVO: área de la unidad (m²)

        public Unit() {}
    }

    public static class Related {
        public String title;
        public String priceFormatted;
        public String thumb;
        public String url;

        public Related() {}
    }

    public Property() {}
}
