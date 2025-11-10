const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');

// Import logger
const logger = require('../utils/logger');

// Helper function to parse attributes string
const parseAttributesString = (str) => {
  const attributes = [];
  const parts = str.split(';').map(p => p.trim()).filter(p => p);

  for (const part of parts) {
    const [name, valuesStr] = part.split(':').map(p => p.trim());
    if (name && valuesStr) {
      const values = valuesStr.split(',').map(v => v.trim()).filter(v => v);
      if (values.length > 0) {
        attributes.push({ name, values });
      }
    }
  }

  return attributes;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;
    let categoryFilter = {};

    if (req.query.category) {
      try {
        let categoryName = req.query.category;

        // Handle hierarchical category names like "Parent > Child"
        if (categoryName.includes(' > ')) {
          const parts = categoryName.split(' > ');
          categoryName = parts[parts.length - 1]; // Get the last part (child category)
        }

        // First try to find by exact name match (case insensitive)
        let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });

        if (!category) {
          // If not found, try to find parent category and get all its subcategories
          const parentCategory = await Category.findOne({
            name: new RegExp(`^${categoryName}$`, 'i'),
            parent: null
          });

          if (parentCategory) {
            // Get all subcategories of this parent
            const subcategories = await Category.find({ parent: parentCategory._id });
            const categoryIds = [parentCategory._id, ...subcategories.map(cat => cat._id)];
            categoryFilter = { category: { $in: categoryIds } };
          } else {
            // If category not found, return empty results
            return res.json({
              products: [],
              page: 1,
              pages: 0,
              total: 0,
            });
          }
        } else {
          // If exact category found, include it and its subcategories if it's a parent
          const subcategories = await Category.find({ parent: category._id });
          const categoryIds = [category._id, ...subcategories.map(cat => cat._id)];
          categoryFilter = { category: { $in: categoryIds } };
        }
      } catch (categoryError) {
        console.error('Category lookup error:', categoryError);
        return res.status(500).json({ message: 'Error processing category filter' });
      }
    }

    const keyword = req.query.keyword
      ? {
          $text: { $search: req.query.keyword },
        }
      : {};

    // Filter by seller if seller query parameter is provided
    let sellerFilter = {};
    if (req.query.seller === 'true' && req.user && req.user.role === 'seller') {
      try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (seller) {
          sellerFilter = { seller: seller._id };
        } else {
          // If no seller profile found, return empty results
          return res.json({
            products: [],
            page: 1,
            pages: 0,
            total: 0,
          });
        }
      } catch (sellerError) {
        console.error('Seller lookup error:', sellerError);
        return res.status(500).json({ message: 'Error processing seller filter' });
      }
    }

    const count = await Product.countDocuments({ ...keyword, ...categoryFilter, ...sellerFilter });
    const products = await Product.find({ ...keyword, ...categoryFilter, ...sellerFilter })
      .populate('category', 'name')
      .populate('seller', 'businessName')
      .populate({
        path: 'flashSale',
        match: { status: 'active', endTime: { $gt: new Date() } }
      })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    res.json({
      products: products || [],
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate({
        path: 'flashSale',
        match: { status: 'active', endTime: { $gt: new Date() } }
      });

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
    }).populate('category', 'name');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin or Private/Seller
const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body values:', JSON.stringify(req.body, null, 2));
    console.log('Request files type:', typeof req.files);
    console.log('Request files keys:', req.files ? Object.keys(req.files) : 'null');
    console.log('Request files stringified:', req.files ? JSON.stringify(req.files, (key, value) => {
      if (key === 'buffer') return '[Buffer]';
      return value;
    }, 2) : 'null');

    // Let's also log individual file details
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach((file, index) => {
          console.log(`File ${index}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
          });
        });
      } else {
        Object.keys(req.files).forEach(key => {
          console.log(`Files under key '${key}':`);
          if (Array.isArray(req.files[key])) {
            req.files[key].forEach((file, index) => {
              console.log(`  File ${index}:`, {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path
              });
            });
          }
        });
      }
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        console.log('Files details (array):', req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })));
      } else {
        console.log('Files details (object):', Object.keys(req.files));
        if (req.files.images) {
          console.log('Images array:', req.files.images.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })));
        }
      }
    }

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      stock,
      brand,
      tags,
      attributes,
      fulfillmentType,
      shippingOrigin,
      deliveryDays,
    } = req.body;

    // Validate required fields
    console.log('Validating required fields...');
    if (!name || typeof name !== 'string' || !name.trim()) {
      console.log('Name validation failed:', { name, type: typeof name });
      return res.status(400).json({ message: 'Product name is required and must be a non-empty string' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      console.log('Description validation failed:', { description, type: typeof description });
      return res.status(400).json({ message: 'Product description is required and must be a non-empty string' });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      console.log('Price validation failed:', { price, type: typeof price, parsed: Number(price) });
      return res.status(400).json({ message: 'Valid price greater than 0 is required' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      console.log('Category validation failed:', { category, type: typeof category });
      return res.status(400).json({ message: 'Category is required and must be a non-empty string' });
    }
    if (stock === undefined || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
      console.log('Stock validation failed:', { stock, type: typeof stock, parsed: Number(stock) });
      return res.status(400).json({ message: 'Valid stock quantity (0 or greater) is required' });
    }
    console.log('All validations passed');

    // Get uploaded image URLs from Cloudinary
    let images = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        images = req.files.map(file => file.path);
      } else if (req.files.images && Array.isArray(req.files.images)) {
        images = req.files.images.map(file => file.path);
      }
    }
    console.log('Images to upload:', images.length);

    // Find category by name if category is provided as string
    let categoryId = category;
    if (typeof category === 'string' && category.trim().length > 0) {
      try {
        let categoryName = category.trim();

        // Handle hierarchical category names like "Parent > Child"
        if (categoryName.includes(' > ')) {
          const parts = categoryName.split(' > ');
          categoryName = parts[parts.length - 1]; // Get the last part (child category)
        }

        const categoryDoc = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
        if (categoryDoc) {
          categoryId = categoryDoc._id;
          console.log('Found existing category:', categoryDoc.name);
        } else {
          // Create category if it doesn't exist
          console.log('Creating new category:', categoryName);
          const newCategory = new Category({ name: categoryName });
          const savedCategory = await newCategory.save();
          categoryId = savedCategory._id;
          console.log('Created new category:', savedCategory.name);
        }
      } catch (categoryError) {
        console.error('Category error:', categoryError);
        return res.status(400).json({ message: `Category error: ${categoryError.message}` });
      }
    } else {
      return res.status(400).json({ message: 'Category is required' });
    }

    console.log('Creating product with data:', {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category: categoryId,
      imagesCount: images.length,
      stock: Number(stock),
    });

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: categoryId,
      images: images.length > 0 ? images : [],
      stock: Number(stock),
      brand: brand ? brand.trim() : undefined,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      attributes: attributes ? parseAttributesString(attributes) : [],
      fulfillmentType: fulfillmentType || 'galyan',
      shippingInfo: {
        origin: shippingOrigin ? shippingOrigin.trim() : undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
      },
    };

    // Add seller information for sellers
    if (req.user && req.user.role === 'seller') {
      try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (seller && seller.isActive) {
          productData.seller = seller._id;
        } else {
          return res.status(403).json({ message: 'Seller account not approved or not found' });
        }
      } catch (sellerError) {
        console.error('Seller lookup error:', sellerError);
        return res.status(500).json({ message: 'Error processing seller information' });
      }
    }

    console.log('Product data to save:', {
      ...productData,
      attributes: productData.attributes ? JSON.stringify(productData.attributes, null, 2) : '[]'
    });

    const product = new Product(productData);

    console.log('Saving product to database...');
    const createdProduct = await product.save();
    console.log('Product saved with ID:', createdProduct._id);
    console.log('Populating category and seller...');
    await createdProduct.populate('category', 'name');
    await createdProduct.populate('seller', 'businessName');

    console.log('Product created successfully:', createdProduct._id);
    console.log('Final product data:', JSON.stringify({
      id: createdProduct._id,
      name: createdProduct.name,
      category: createdProduct.category,
      images: createdProduct.images.length
    }, null, 2));

    logger.info(`Request received: ${req.method} ${req.path}`);

    res.status(201).json({
      success: true,
      product: createdProduct
    });
  } catch (error) {
    console.error('=== CREATE PRODUCT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid data format',
        error: error.message
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate entry',
        error: 'A product with this name already exists'
      });
    }

    res.status(500).json({
      message: 'Failed to create product',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin or Private/Seller
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      images,
      stock,
      brand,
      tags,
      isActive,
      attributes,
      fulfillmentType,
      shippingOrigin,
      deliveryDays,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Check if user is authorized to update this product
      if (req.user && req.user.role === 'seller') {
        try {
          const seller = await Seller.findOne({ user: req.user._id });
          if (!seller || !seller.isActive || product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
          }
        } catch (sellerError) {
          console.error('Seller authorization error:', sellerError);
          return res.status(500).json({ message: 'Error checking seller authorization' });
        }
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.originalPrice = originalPrice || product.originalPrice;
      product.category = category || product.category;
      product.images = images || product.images;
      product.stock = stock !== undefined ? stock : product.stock;
      product.brand = brand || product.brand;
      product.tags = tags || product.tags;
      product.isActive = isActive !== undefined ? isActive : product.isActive;
      product.attributes = attributes ? parseAttributesString(attributes) : product.attributes;
      product.fulfillmentType = fulfillmentType || product.fulfillmentType;
      if (shippingOrigin !== undefined || deliveryDays !== undefined) {
        product.shippingInfo = {
          origin: shippingOrigin !== undefined ? shippingOrigin : product.shippingInfo?.origin,
          deliveryDays: deliveryDays !== undefined ? Number(deliveryDays) : product.shippingInfo?.deliveryDays,
        };
      }

      const updatedProduct = await product.save();
      await updatedProduct.populate('category', 'name');
      await updatedProduct.populate('seller', 'businessName');

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin or Private/Seller
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Check if user is authorized to delete this product
      if (req.user && req.user.role === 'seller') {
        try {
          const seller = await Seller.findOne({ user: req.user._id });
          if (!seller || !seller.isActive || product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
          }
        } catch (sellerError) {
          console.error('Seller authorization error:', sellerError);
          return res.status(500).json({ message: 'Error checking seller authorization' });
        }
      }

      await product.remove();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(8)
      .populate('category', 'name');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
};