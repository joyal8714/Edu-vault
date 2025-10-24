const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authenticateJWT = require('../middleware/authMiddleware');

router.get('/my-videos', authenticateJWT, videoController.getVideosByUser);

module.exports = router;
