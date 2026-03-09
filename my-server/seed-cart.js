const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to DB
const db = require('./config/db');

// Import Cart model
const Cart = require('./models/Cart');

async function seedCart() {
  try {
    await db.connect();
    console.log('✓ Connected to MongoDB');

    // Drop existing collection
    await Cart.deleteMany({});
    console.log('✓ Cleared existing cart data');

    // Read cart.json from client assets
    const cartFilePath = path.join(__dirname, '../client/src/assets/data/cart.json');
    const cartData = JSON.parse(fs.readFileSync(cartFilePath, 'utf8'));

    // Insert data
    const result = await Cart.insertMany(cartData);
    console.log(`✓ Seeded ${result.length} cart records`);

    mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding cart:', err.message);
    process.exit(1);
  }
}

seedCart();
