const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateJWT = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');

router.post('/upload-video', authenticateJWT, isAdmin, adminController.uploadVideo);
router.post('/grant-access', authenticateJWT, isAdmin, adminController.grantAccess);

module.exports = router;
