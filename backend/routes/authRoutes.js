const express = require('express');
const router  = express.Router();
const { login, logout, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login',         login);
router.post('/logout',        protect, logout);
router.get('/profile',        protect, getProfile);
router.put('/profile',        protect, updateProfile);

module.exports = router;
