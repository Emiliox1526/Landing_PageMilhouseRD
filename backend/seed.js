const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Property = require('./models/Property');

dotenv.config();

const sampleProperty = {
  title: 'Sample Property',
  location: { city: 'City', area: 'Area' },
  saleType: 'Sale',
  priceFormatted: '$100,000',
  price: 100000,
  bedrooms: 3,
  bathrooms: 2,
  parking: 1,
  area: 120,
  descriptionParagraph: 'A lovely sample property.',
  features: ['Feature1', 'Feature2'],
  amenities: ['Amenity1', 'Amenity2'],
  images: [{ src: 'http://example.com/image.jpg' }],
  units: [{
    name: 'Unit A',
    floor: 1,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    zone: 'A',
    terrace: false,
    priceFormatted: '$50,000',
    price: 50000
  }],
  related: [{
    title: 'Related Property',
    priceFormatted: '$80,000',
    thumb: 'http://example.com/thumb.jpg',
    url: 'http://example.com'
  }]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/realestate');
    await Property.deleteMany();
    await Property.create(sampleProperty);
    console.log('Database seeded');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
