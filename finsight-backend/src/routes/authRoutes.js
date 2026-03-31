const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// POST /register - Register a new user
router.post('/register', registerUser);

// POST /login - Authenticate a user and get token
router.post('/login', loginUser);

module.exports = router;
