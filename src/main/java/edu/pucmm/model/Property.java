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
    private ObjectId _id;

    // Datos básicos
    private String title;
    private String type;           // Casa | Apartamento | Penthouse | Solares | Villa
    private String saleType;       // Venta / Alquiler / etc.

    // Precio principal (opcional si usas por unidad)
    private Double price;
    private String priceFormatted;

    // Resumen general
    private Integer bedrooms;
    private Integer bathrooms;
    private Integer parking;
    private Double area;           // Área total de la propiedad (m²) – opcional

    // Ubicación
    private String address;        // Texto libre (opcional)
    private Double latitude;       // NUEVO
    private Double longitude;      // NUEVO

    // Contenido
    private String descriptionParagraph;
    private List<String> features = new ArrayList<>();
    private List<String> amenities = new ArrayList<>();

    private List<String> images = new ArrayList<>();

    // Unidades / Tipología
    private List<Unit> units = new ArrayList<>();

    // Relacionados
    private List<Related> related = new ArrayList<>();

    // Metadatos
    private Date createdAt;
    private Date updatedAt;

    // ----- Getters & Setters -----

    public Property() {}

    public ObjectId get_id() { return _id; }
    public void set_id(ObjectId _id) { this._id = _id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSaleType() { return saleType; }
    public void setSaleType(String saleType) { this.saleType = saleType; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getPriceFormatted() { return priceFormatted; }
    public void setPriceFormatted(String priceFormatted) { this.priceFormatted = priceFormatted; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

    public Integer getParking() { return parking; }
    public void setParking(Integer parking) { this.parking = parking; }

    public Double getArea() { return area; }
    public void setArea(Double area) { this.area = area; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDescriptionParagraph() { return descriptionParagraph; }
    public void setDescriptionParagraph(String descriptionParagraph) { this.descriptionParagraph = descriptionParagraph; }

    public List<String> getFeatures() { return features; }
    public void setFeatures(List<String> features) { this.features = features; }

    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public List<Unit> getUnits() { return units; }
    public void setUnits(List<Unit> units) { this.units = units; }

    public List<Related> getRelated() { return related; }
    public void setRelated(List<Related> related) { this.related = related; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    // ----- Nested classes -----

    public static class Unit {
        private String name;
        private Integer floor;
        private Integer bedrooms;
        private Integer bathrooms;
        private Integer parking;
        private String zone;
        private Boolean terrace;

        private Double price;
        private String priceFormatted;

        private Double area; // área de la unidad (m²)

        public Unit() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getFloor() { return floor; }
        public void setFloor(Integer floor) { this.floor = floor; }

        public Integer getBedrooms() { return bedrooms; }
        public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

        public Integer getBathrooms() { return bathrooms; }
        public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

        public Integer getParking() { return parking; }
        public void setParking(Integer parking) { this.parking = parking; }

        public String getZone() { return zone; }
        public void setZone(String zone) { this.zone = zone; }

        public Boolean getTerrace() { return terrace; }
        public void setTerrace(Boolean terrace) { this.terrace = terrace; }

        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }

        public String getPriceFormatted() { return priceFormatted; }
        public void setPriceFormatted(String priceFormatted) { this.priceFormatted = priceFormatted; }

        public Double getArea() { return area; }
        public void setArea(Double area) { this.area = area; }
    }

    public static class Related {
        private String title;
        private String priceFormatted;
        private String thumb;
        private String url;

        public Related() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getPriceFormatted() { return priceFormatted; }
        public void setPriceFormatted(String priceFormatted) { this.priceFormatted = priceFormatted; }

        public String getThumb() { return thumb; }
        public void setThumb(String thumb) { this.thumb = thumb; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}

