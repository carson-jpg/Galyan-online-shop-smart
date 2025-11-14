const voiceService = require('../utils/voiceService');
const multer = require('multer');

// Configure multer for audio file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// @desc    Process voice command
// @route   POST /api/voice/command
// @access  Private
const processVoiceCommand = async (req, res) => {
  try {
    const audioFile = req.file;
    const userContext = {
      userId: req.user._id,
      userName: req.user.name,
      cartItems: req.body.cartItems || 0
    };

    if (!audioFile) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Process the voice command
    const result = await voiceService.processVoiceCommand(audioFile.buffer, userContext);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      success: true,
      transcription: result.transcription,
      command: result.command,
      result: result.result,
      voiceResponse: result.voiceResponse
    });

  } catch (error) {
    console.error('Process voice command error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get voice command suggestions
// @route   GET /api/voice/suggestions
// @access  Private
const getVoiceSuggestions = async (req, res) => {
  try {
    const context = {
      userId: req.user._id,
      cartItems: req.query.cartItems || 0
    };

    const suggestions = voiceService.getVoiceSuggestions(context);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get voice suggestions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test voice processing (for development)
// @route   POST /api/voice/test
// @access  Private
const testVoiceProcessing = async (req, res) => {
  try {
    const { text, userContext } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text input is required for testing' });
    }

    // Mock voice command processing with text input
    const command = await voiceService.parseVoiceCommand(text, userContext || {});
    const result = await voiceService.executeVoiceCommand(command, userContext || {});
    const voiceResponse = await voiceService.generateVoiceResponse(result);

    res.json({
      success: true,
      input: text,
      command,
      result,
      voiceResponse
    });

  } catch (error) {
    console.error('Test voice processing error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  processVoiceCommand,
  getVoiceSuggestions,
  testVoiceProcessing,
  upload
};