const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  floor: Number,
  bedrooms: Number,
  bathrooms: Number,
  parking: Number,
  zone: String,
  terrace: Boolean,
  priceFormatted: String,
  price: Number
});

const RelatedSchema = new mongoose.Schema({
  title: String,
  priceFormatted: String,
  thumb: String,
  url: String
});

const ImageSchema = new mongoose.Schema({
  src: String
});

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
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
  images: [ImageSchema],
  units: [UnitSchema],
  related: [RelatedSchema]
});

module.exports = mongoose.model('Property', PropertySchema);
