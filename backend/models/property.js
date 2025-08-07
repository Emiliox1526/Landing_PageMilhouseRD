const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: String,
  floor: Number,
  bedrooms: Number,
  bathrooms: Number,
  parking: Number,
  zone: String,
  terrace: Boolean,
  priceFormatted: String,
  price: Number
});

const relatedSchema = new mongoose.Schema({
  title: String,
  priceFormatted: String,
  thumb: String,
  url: String
});

const propertySchema = new mongoose.Schema({
  title: String,
  location: {
    city: String,
    area: String
  },
  saleType: String,
  priceFormatted: String,
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  parking: Number,
  area: Number,
  descriptionParagraph: String,
  features: [String],
  amenities: [String],
  images: [
    {
      src: String
    }
  ],
  units: [unitSchema],
  related: [relatedSchema]
});

module.exports = mongoose.model('Property', propertySchema);
