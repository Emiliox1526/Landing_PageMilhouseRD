package edu.pucmm.model;

import java.util.List;

/**
 * Representa una propiedad inmobiliaria tal como se definía en el backend de Node.js.
 */
public class Property {

    public String id;
    public String title;
    public Location location;
    public String saleType;
    public String priceFormatted;
    public double price;
    public int bedrooms;
    public int bathrooms;
    public int parking;
    public int area;
    public String descriptionParagraph;
    public List<String> features;
    public List<String> amenities;
    public List<Image> images;
    public List<Unit> units;
    public List<Related> related;

    public static class Location {
        public String city;
        public String area;
    }

    public static class Image {
        public String src;
    }

    public static class Unit {
        public String name;
        public int floor;
        public int bedrooms;
        public int bathrooms;
        public int parking;
        public String zone;
        public boolean terrace;
        public String priceFormatted;
        public double price;
    }

    public static class Related {
        public String title;
        public String priceFormatted;
        public String thumb;
        public String url;
    }

}

