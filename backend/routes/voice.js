const express = require('express');
const {
  processVoiceCommand,
  getVoiceSuggestions,
  testVoiceProcessing,
  upload
} = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All voice routes require authentication
router.use(protect);

// Voice command processing
router.post('/command', upload.single('audio'), processVoiceCommand);

// Voice suggestions
router.get('/suggestions', getVoiceSuggestions);

// Test endpoint (development only)
router.post('/test', testVoiceProcessing);

module.exports = router;