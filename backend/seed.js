const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const categories = [
  // Main Categories
  { name: 'Electronics', description: 'Electronic devices and gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Fashion', description: 'Clothing, shoes, and accessories', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400' },
  { name: 'Home & Living', description: 'Home decor and household items', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Beauty & Personal Care', description: 'Cosmetics and personal care products', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
  { name: 'Supermarket / Groceries', description: 'Groceries and household essentials', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
  { name: 'Appliances', description: 'Home and kitchen appliances', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
  { name: 'Computing & Office', description: 'Computers and office supplies', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
  { name: 'Automotive', description: 'Car and motorcycle accessories', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400' },
  { name: 'Toys, Kids & Baby', description: 'Toys and baby products', image: 'https://images.unsplash.com/photo-1558877385-1199c1af4e2f?w=400' },
  { name: 'Health & Medical', description: 'Health and medical supplies', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400' },
  { name: 'Books, Stationery & Art', description: 'Books and art supplies', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400' },
  { name: 'Garden & Tools', description: 'Gardening and home improvement tools', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' },
  { name: 'Pet Supplies', description: 'Pet food and accessories', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400' },
  { name: 'Deals & Promotions', description: 'Special deals and promotions', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400' },

  // Electronics Subcategories
  { name: 'Mobile Phones', parent: 'Electronics' },
  { name: 'Laptops & Computers', parent: 'Electronics' },
  { name: 'Televisions & Home Audio', parent: 'Electronics' },
  { name: 'Cameras & Accessories', parent: 'Electronics' },
  { name: 'Smart Watches & Fitness Bands', parent: 'Electronics' },
  { name: 'Phone Accessories', parent: 'Electronics' },
  { name: 'Computer Accessories', parent: 'Electronics' },

  // Fashion Subcategories
  { name: 'Men\'s Clothing', parent: 'Fashion' },
  { name: 'Women\'s Clothing', parent: 'Fashion' },
  { name: 'Kids\' Fashion', parent: 'Fashion' },
  { name: 'Shoes', parent: 'Fashion' },
  { name: 'Bags & Wallets', parent: 'Fashion' },
  { name: 'Watches & Jewelry', parent: 'Fashion' },
  { name: 'Sunglasses & Accessories', parent: 'Fashion' },

  // Home & Living Subcategories
  { name: 'Furniture', parent: 'Home & Living' },
  { name: 'Kitchenware', parent: 'Home & Living' },
  { name: 'Bedding & Mattresses', parent: 'Home & Living' },
  { name: 'Home Décor', parent: 'Home & Living' },
  { name: 'Cleaning & Storage', parent: 'Home & Living' },
  { name: 'Lighting', parent: 'Home & Living' },

  // Beauty & Personal Care Subcategories
  { name: 'Skincare', parent: 'Beauty & Personal Care' },
  { name: 'Haircare', parent: 'Beauty & Personal Care' },
  { name: 'Fragrances', parent: 'Beauty & Personal Care' },
  { name: 'Makeup', parent: 'Beauty & Personal Care' },
  { name: 'Health & Wellness', parent: 'Beauty & Personal Care' },
  { name: 'Shaving & Grooming', parent: 'Beauty & Personal Care' },

  // Supermarket / Groceries Subcategories
  { name: 'Beverages', parent: 'Supermarket / Groceries' },
  { name: 'Snacks', parent: 'Supermarket / Groceries' },
  { name: 'Cleaning Supplies', parent: 'Supermarket / Groceries' },
  { name: 'Baby & Kids Products', parent: 'Supermarket / Groceries' },
  { name: 'Personal Hygiene', parent: 'Supermarket / Groceries' },
  { name: 'Household Essentials', parent: 'Supermarket / Groceries' },

  // Appliances Subcategories
  { name: 'Refrigerators', parent: 'Appliances' },
  { name: 'Microwaves', parent: 'Appliances' },
  { name: 'Blenders & Juicers', parent: 'Appliances' },
  { name: 'Irons & Steamers', parent: 'Appliances' },
  { name: 'Fans & Air Conditioners', parent: 'Appliances' },

  // Computing & Office Subcategories
  { name: 'Desktops', parent: 'Computing & Office' },
  { name: 'Printers & Scanners', parent: 'Computing & Office' },
  { name: 'Networking Devices', parent: 'Computing & Office' },
  { name: 'Office Supplies', parent: 'Computing & Office' },

  // Sports & Outdoors Subcategories
  { name: 'Exercise Equipment', parent: 'Sports & Outdoors' },
  { name: 'Bicycles & Accessories', parent: 'Sports & Outdoors' },
  { name: 'Outdoor Gear', parent: 'Sports & Outdoors' },
  { name: 'Sportswear', parent: 'Sports & Outdoors' },
  { name: 'Camping & Hiking Equipment', parent: 'Sports & Outdoors' },

  // Automotive Subcategories
  { name: 'Car Accessories', parent: 'Automotive' },
  { name: 'Motorcycle Accessories', parent: 'Automotive' },
  { name: 'Oils & Fluids', parent: 'Automotive' },
  { name: 'Tools & Maintenance Equipment', parent: 'Automotive' },

  // Toys, Kids & Baby Subcategories
  { name: 'Toys & Games', parent: 'Toys, Kids & Baby' },
  { name: 'Baby Clothing', parent: 'Toys, Kids & Baby' },
  { name: 'Feeding & Nursing', parent: 'Toys, Kids & Baby' },
  { name: 'Strollers & Car Seats', parent: 'Toys, Kids & Baby' },

  // Health & Medical Subcategories
  { name: 'Supplements', parent: 'Health & Medical' },
  { name: 'Medical Equipment', parent: 'Health & Medical' },
  { name: 'Masks & Sanitizers', parent: 'Health & Medical' },
  { name: 'First Aid Kits', parent: 'Health & Medical' },

  // Books, Stationery & Art Subcategories
  { name: 'Books & Novels', parent: 'Books, Stationery & Art' },
  { name: 'Educational Supplies', parent: 'Books, Stationery & Art' },
  { name: 'Art & Craft Materials', parent: 'Books, Stationery & Art' },
  { name: 'Office Stationery', parent: 'Books, Stationery & Art' },

  // Garden & Tools Subcategories
  { name: 'Gardening Tools', parent: 'Garden & Tools' },
  { name: 'Home Improvement', parent: 'Garden & Tools' },
  { name: 'Power Tools', parent: 'Garden & Tools' },
  { name: 'Safety Gear', parent: 'Garden & Tools' },

  // Pet Supplies Subcategories
  { name: 'Pet Food', parent: 'Pet Supplies' },
  { name: 'Pet Toys', parent: 'Pet Supplies' },
  { name: 'Grooming Products', parent: 'Pet Supplies' },
  { name: 'Beds & Carriers', parent: 'Pet Supplies' },

  // Deals & Promotions Subcategories
  { name: 'Flash Sales', parent: 'Deals & Promotions' },
  { name: 'Hot Deals', parent: 'Deals & Promotions' },
  { name: 'Trending Products', parent: 'Deals & Promotions' },
];

const products = [
  // Electronics
  {
    name: "Samsung Galaxy A54 5G Smartphone",
    description: "Latest Samsung smartphone with 5G connectivity, excellent camera, and long battery life.",
    price: 45000,
    originalPrice: 55000,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"],
    stock: 25,
    brand: "Samsung",
    rating: 4.5,
    numReviews: 120,
    tags: ["smartphone", "5G", "Android"],
  },
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Premium noise-canceling wireless headphones with exceptional sound quality.",
    price: 35000,
    originalPrice: 42000,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
    stock: 15,
    brand: "Sony",
    rating: 4.8,
    numReviews: 85,
    tags: ["headphones", "wireless", "noise-canceling"],
  },
  {
    name: "Apple MacBook Air M2",
    description: "Powerful and lightweight laptop with M2 chip for professional work and creativity.",
    price: 145000,
    originalPrice: 165000,
    category: "Laptops & Computers",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"],
    stock: 8,
    brand: "Apple",
    rating: 4.9,
    numReviews: 200,
    tags: ["laptop", "MacBook", "M2"],
  },
  {
    name: "Canon EOS R6 Digital Camera",
    description: "Professional digital camera with 4K video recording and advanced autofocus.",
    price: 285000,
    originalPrice: 320000,
    category: "Cameras & Accessories",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"],
    stock: 5,
    brand: "Canon",
    rating: 4.7,
    numReviews: 45,
    tags: ["camera", "4K", "photography"],
  },
  {
    name: "LG 55\" 4K Smart TV",
    description: "Large screen smart TV with 4K resolution and smart features.",
    price: 65000,
    originalPrice: 78000,
    category: "Televisions & Home Audio",
    images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"],
    stock: 12,
    brand: "LG",
    rating: 4.6,
    numReviews: 78,
    tags: ["TV", "4K", "smart"],
  },
  {
    name: "iPad Pro 11-inch M2",
    description: "Powerful tablet with M2 chip, perfect for creativity and productivity.",
    price: 98000,
    originalPrice: 115000,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"],
    stock: 10,
    brand: "Apple",
    rating: 4.8,
    numReviews: 95,
    tags: ["tablet", "iPad", "M2"],
  },
  {
    name: "JBL Flip 6 Bluetooth Speaker",
    description: "Portable Bluetooth speaker with waterproof design and powerful sound.",
    price: 8500,
    originalPrice: 11000,
    category: "Televisions & Home Audio",
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"],
    stock: 30,
    brand: "JBL",
    rating: 4.5,
    numReviews: 150,
    tags: ["speaker", "Bluetooth", "portable"],
  },
  {
    name: "Apple Watch Series 9",
    description: "Advanced smartwatch with health monitoring and fitness features.",
    price: 52000,
    originalPrice: 62000,
    category: "Smart Watches & Fitness Bands",
    images: ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400"],
    stock: 18,
    brand: "Apple",
    rating: 4.7,
    numReviews: 110,
    tags: ["smartwatch", "fitness", "health"],
  },
  // Fashion
  {
    name: "Nike Air Max 270 Running Shoes",
    description: "Comfortable running shoes with Air Max technology for cushioning.",
    price: 12000,
    originalPrice: 15000,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"],
    stock: 40,
    brand: "Nike",
    rating: 4.6,
    numReviews: 180,
    tags: ["shoes", "running", "Air Max"],
  },
  {
    name: "Adidas Ultraboost 22 Sneakers",
    description: "High-performance sneakers with Boost technology for energy return.",
    price: 14500,
    originalPrice: 18000,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400"],
    stock: 35,
    brand: "Adidas",
    rating: 4.5,
    numReviews: 160,
    tags: ["sneakers", "running", "Boost"],
  },
  {
    name: "Levi's 501 Original Fit Jeans",
    description: "Classic straight fit jeans made from premium denim.",
    price: 6500,
    originalPrice: 8500,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"],
    stock: 50,
    brand: "Levi's",
    rating: 4.4,
    numReviews: 220,
    tags: ["jeans", "denim", "classic"],
  },
  {
    name: "Calvin Klein Cotton T-Shirt Pack",
    description: "Pack of comfortable cotton t-shirts in various colors.",
    price: 3200,
    originalPrice: 4200,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
    stock: 60,
    brand: "Calvin Klein",
    rating: 4.3,
    numReviews: 140,
    tags: ["t-shirt", "cotton", "pack"],
  },
  {
    name: "Tommy Hilfiger Classic Polo",
    description: "Classic polo shirt with signature logo and comfortable fit.",
    price: 4500,
    originalPrice: 5800,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400"],
    stock: 45,
    brand: "Tommy Hilfiger",
    rating: 4.6,
    numReviews: 130,
    tags: ["polo", "classic", "logo"],
  },
  {
    name: "Puma Training Tracksuit",
    description: "Comfortable tracksuit for training and casual wear.",
    price: 7800,
    originalPrice: 9500,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400"],
    stock: 28,
    brand: "Puma",
    rating: 4.5,
    numReviews: 95,
    tags: ["tracksuit", "training", "comfortable"],
  },
  {
    name: "Ray-Ban Aviator Sunglasses",
    description: "Classic aviator sunglasses with UV protection.",
    price: 12500,
    originalPrice: 16000,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400"],
    stock: 20,
    brand: "Ray-Ban",
    rating: 4.7,
    numReviews: 170,
    tags: ["sunglasses", "aviator", "UV"],
  },
  {
    name: "Zara Elegant Summer Dress",
    description: "Elegant summer dress perfect for casual outings.",
    price: 5500,
    originalPrice: 7200,
    category: "Fashion",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"],
    stock: 25,
    brand: "Zara",
    rating: 4.4,
    numReviews: 85,
    tags: ["dress", "summer", "elegant"],
  },
  // Beauty
  {
    name: "Maybelline SuperStay Matte Ink",
    description: "Long-lasting matte lip color with intense pigmentation.",
    price: 1200,
    originalPrice: 1500,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400"],
    stock: 80,
    brand: "Maybelline",
    rating: 4.6,
    numReviews: 300,
    tags: ["lipstick", "matte", "long-lasting"],
  },
  {
    name: "L'Oreal Paris Revitalift Serum",
    description: "Anti-aging serum with hyaluronic acid for youthful skin.",
    price: 2800,
    originalPrice: 3500,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400"],
    stock: 55,
    brand: "L'Oreal",
    rating: 4.5,
    numReviews: 250,
    tags: ["serum", "anti-aging", "hyaluronic"],
  },
  {
    name: "Nivea Soft Light Moisturizer",
    description: "Lightweight moisturizer for daily use, non-greasy formula.",
    price: 850,
    originalPrice: 1100,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"],
    stock: 90,
    brand: "Nivea",
    rating: 4.4,
    numReviews: 400,
    tags: ["moisturizer", "lightweight", "daily"],
  },
  {
    name: "Garnier Fructis Shampoo & Conditioner",
    description: "Nourishing shampoo and conditioner duo for healthy hair.",
    price: 1450,
    originalPrice: 1900,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400"],
    stock: 70,
    brand: "Garnier",
    rating: 4.3,
    numReviews: 280,
    tags: ["shampoo", "conditioner", "nourishing"],
  },
  {
    name: "MAC Studio Fix Foundation",
    description: "Professional foundation with full coverage and matte finish.",
    price: 4200,
    originalPrice: 5200,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400"],
    stock: 40,
    brand: "MAC",
    rating: 4.7,
    numReviews: 190,
    tags: ["foundation", "matte", "coverage"],
  },
  {
    name: "Urban Decay Naked Palette",
    description: "Eyeshadow palette with neutral shades for everyday makeup.",
    price: 6500,
    originalPrice: 8200,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400"],
    stock: 35,
    brand: "Urban Decay",
    rating: 4.8,
    numReviews: 220,
    tags: ["eyeshadow", "palette", "neutral"],
  },
  {
    name: "Clinique Moisture Surge 72hr",
    description: "Intensive moisturizer that lasts up to 72 hours.",
    price: 3800,
    originalPrice: 4800,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400"],
    stock: 50,
    brand: "Clinique",
    rating: 4.6,
    numReviews: 160,
    tags: ["moisturizer", "intensive", "72hr"],
  },
  {
    name: "Dove Body Wash Variety Pack",
    description: "Variety pack of gentle body washes for all skin types.",
    price: 1850,
    originalPrice: 2400,
    category: "Beauty & Personal Care",
    images: ["https://images.unsplash.com/photo-1628015796818-87c94e8bdd42?w=400"],
    stock: 65,
    brand: "Dove",
    rating: 4.5,
    numReviews: 320,
    tags: ["body wash", "variety", "gentle"],
  },
  // Home & Living
  {
    name: "Cotton Bedding Set - Queen Size",
    description: "Comfortable cotton bedding set including sheets and pillowcases.",
    price: 8500,
    originalPrice: 11000,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400"],
    stock: 20,
    brand: "Generic",
    rating: 4.5,
    numReviews: 90,
    tags: ["bedding", "cotton", "queen"],
  },
  {
    name: "Decorative Throw Pillows Set of 4",
    description: "Set of 4 decorative throw pillows to enhance your living space.",
    price: 3200,
    originalPrice: 4200,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400"],
    stock: 45,
    brand: "Generic",
    rating: 4.4,
    numReviews: 120,
    tags: ["pillows", "decorative", "set"],
  },
  {
    name: "Modern Area Rug 6x9 ft",
    description: "Modern area rug to add style and comfort to your room.",
    price: 12500,
    originalPrice: 16000,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1600166898405-da9535204843?w=400"],
    stock: 15,
    brand: "Generic",
    rating: 4.6,
    numReviews: 75,
    tags: ["rug", "modern", "area"],
  },
  {
    name: "Kitchen Knife Set 15-Piece",
    description: "Complete set of kitchen knives for all your cooking needs.",
    price: 5800,
    originalPrice: 7500,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400"],
    stock: 25,
    brand: "Generic",
    rating: 4.7,
    numReviews: 140,
    tags: ["knives", "kitchen", "set"],
  },
  {
    name: "Non-Stick Cookware Set",
    description: "Non-stick cookware set for easy and healthy cooking.",
    price: 9800,
    originalPrice: 12500,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400"],
    stock: 18,
    brand: "Generic",
    rating: 4.5,
    numReviews: 110,
    tags: ["cookware", "non-stick", "set"],
  },
  {
    name: "LED Desk Lamp with USB Port",
    description: "Modern LED desk lamp with adjustable brightness and USB port.",
    price: 2800,
    originalPrice: 3600,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"],
    stock: 40,
    brand: "Generic",
    rating: 4.4,
    numReviews: 180,
    tags: ["lamp", "LED", "desk"],
  },
  {
    name: "Wall Clock Modern Design",
    description: "Modern wall clock to complement your home decor.",
    price: 1850,
    originalPrice: 2500,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400"],
    stock: 30,
    brand: "Generic",
    rating: 4.3,
    numReviews: 95,
    tags: ["clock", "wall", "modern"],
  },
  {
    name: "Vacuum Cleaner 2000W",
    description: "Powerful vacuum cleaner for efficient cleaning.",
    price: 15500,
    originalPrice: 19000,
    category: "Home & Living",
    images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400"],
    stock: 12,
    brand: "Generic",
    rating: 4.6,
    numReviews: 85,
    tags: ["vacuum", "cleaner", "powerful"],
  },
  // Sports
  {
    name: "Yoga Mat Premium Non-Slip",
    description: "Premium non-slip yoga mat for comfortable workouts.",
    price: 2500,
    originalPrice: 3200,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"],
    stock: 50,
    brand: "Generic",
    rating: 4.5,
    numReviews: 200,
    tags: ["yoga", "mat", "non-slip"],
  },
  {
    name: "Adjustable Dumbbell Set 20kg",
    description: "Adjustable dumbbell set for strength training.",
    price: 8500,
    originalPrice: 11000,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400"],
    stock: 22,
    brand: "Generic",
    rating: 4.6,
    numReviews: 130,
    tags: ["dumbbells", "adjustable", "strength"],
  },
  {
    name: "Wilson Basketball Official Size",
    description: "Official size basketball for indoor and outdoor play.",
    price: 3200,
    originalPrice: 4000,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400"],
    stock: 35,
    brand: "Wilson",
    rating: 4.4,
    numReviews: 160,
    tags: ["basketball", "official", "size"],
  },
  {
    name: "Fitness Resistance Bands Set",
    description: "Set of resistance bands for full-body workouts.",
    price: 1850,
    originalPrice: 2500,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400"],
    stock: 60,
    brand: "Generic",
    rating: 4.3,
    numReviews: 180,
    tags: ["resistance", "bands", "fitness"],
  },
  {
    name: "Nike Dri-FIT Training Shorts",
    description: "Moisture-wicking training shorts for intense workouts.",
    price: 2800,
    originalPrice: 3500,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400"],
    stock: 45,
    brand: "Nike",
    rating: 4.5,
    numReviews: 140,
    tags: ["shorts", "training", "Dri-FIT"],
  },
  {
    name: "Under Armour Gym Bag",
    description: "Durable gym bag with multiple compartments.",
    price: 4200,
    originalPrice: 5500,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"],
    stock: 28,
    brand: "Under Armour",
    rating: 4.4,
    numReviews: 110,
    tags: ["bag", "gym", "durable"],
  },
  {
    name: "Jump Rope Speed Training",
    description: "Speed jump rope for cardiovascular training.",
    price: 850,
    originalPrice: 1200,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400"],
    stock: 70,
    brand: "Generic",
    rating: 4.2,
    numReviews: 220,
    tags: ["jump rope", "speed", "training"],
  },
  {
    name: "Adidas Soccer Ball FIFA Approved",
    description: "FIFA approved soccer ball for professional play.",
    price: 4500,
    originalPrice: 5800,
    category: "Sports & Outdoors",
    images: ["https://images.unsplash.com/photo-1614632537239-d265ff6b5e98?w=400"],
    stock: 25,
    brand: "Adidas",
    rating: 4.7,
    numReviews: 190,
    tags: ["soccer", "ball", "FIFA"],
  },
];

const importData = async () => {
  try {
    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();

    // Insert categories in order: parents first, then children
    const parentCategories = categories.filter(cat => !cat.parent);
    const childCategories = categories.filter(cat => cat.parent);

    const createdParentCategories = await Category.insertMany(parentCategories);
    console.log('Parent categories imported');

    // Create category map for parents
    const categoryMap = {};
    createdParentCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Insert child categories with parent references
    const childCategoriesWithParentIds = childCategories.map(cat => ({
      ...cat,
      parent: categoryMap[cat.parent]
    }));

    const createdChildCategories = await Category.insertMany(childCategoriesWithParentIds);
    console.log('Child categories imported');

    // Add child categories to the map
    createdChildCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Insert products with category references
    const productsWithCategoryIds = products.map(product => {
      let categoryId = categoryMap[product.category];
      if (!categoryId) {
        // Try to find by case-insensitive match
        const categoryKey = Object.keys(categoryMap).find(key =>
          key.toLowerCase() === product.category.toLowerCase()
        );
        if (categoryKey) {
          categoryId = categoryMap[categoryKey];
        }
      }
      if (!categoryId) {
        console.error(`Category not found for product: ${product.name}, category: ${product.category}`);
        console.log('Available categories:', Object.keys(categoryMap));
        console.log('Looking for category:', product.category);
        return null;
      }
      return {
        ...product,
        category: categoryId,
      };
    }).filter(product => product !== null);

    if (productsWithCategoryIds.length > 0) {
      await Product.insertMany(productsWithCategoryIds);
      console.log('Products imported');
    } else {
      console.log('No products to import - all categories not found');
    }
    console.log('Products imported');

    // Seed admin user if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Data Import Success!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  connectDB();
  importData();
}
