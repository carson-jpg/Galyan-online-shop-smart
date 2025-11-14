const express = require('express');
const { processVoiceCommand, getVoiceSuggestions } = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Voice routes require authentication
router.use(protect);

// Process voice commands
router.post('/process-command', processVoiceCommand);

// Get voice command suggestions
router.get('/suggestions', getVoiceSuggestions);

module.exports = router;