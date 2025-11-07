const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  googleAuth,
  googleAuthCallback,
  googleAuthSuccess,
  registerSeller,
  getSellerProfile,
  updateSellerProfile,
  getSellerProfileById,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const passport = require('passport');
const { uploadProfile } = require('../config/cloudinary');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone').notEmpty().withMessage('Phone number is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const sellerRegisterValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('businessPhone').notEmpty().withMessage('Business phone is required'),
  body('businessEmail').isEmail().withMessage('Please provide a valid business email'),
  body('kraPin').notEmpty().withMessage('KRA PIN is required'),
];

// Routes
router.post('/register', registerValidation, registerUser);
router.post('/register-seller', sellerRegisterValidation, registerSeller);
router.post('/login', loginValidation, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/seller-profile', protect, getSellerProfile);
router.put('/seller-profile', protect, updateSellerProfile);
router.get('/seller-profile/:sellerId', getSellerProfileById);
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback, googleAuthSuccess);

module.exports = router;