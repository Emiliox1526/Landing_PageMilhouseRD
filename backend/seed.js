require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/property');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await Property.deleteMany({});

    const property = await Property.create({
      title: 'Sample Property',
      location: { city: 'Sample City', area: 'Downtown' },
      saleType: 'Sale',
      priceFormatted: '$100,000',
      price: 100000,
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
      area: 120,
      descriptionParagraph: 'A lovely sample property.',
      features: ['Balcony', 'Garden'],
      amenities: ['Pool', 'Gym'],
      images: [{ src: 'https://example.com/image.jpg' }],
      units: [
        {
          name: 'Unit A',
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          parking: 1,
          zone: 'A',
          terrace: false,
          priceFormatted: '$100,000',
          price: 100000
        }
      ],
      related: [
        {
          title: 'Another Property',
          priceFormatted: '$90,000',
          thumb: 'https://example.com/thumb.jpg',
          url: 'https://example.com/property'
        }
      ]
    });

    console.log('Seed data inserted:', property._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
