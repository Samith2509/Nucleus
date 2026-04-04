const express = require('express');
const router = express.Router();
const { registerUser, loginUser, signupUser } = require('../controllers/authController');

// POST /register - Register a new user (internally by admin)
router.post('/register', registerUser);

// POST /signup - Register a new tenant admin (public signup)
router.post('/signup', signupUser);

// POST /login - Authenticate a user and get token
router.post('/login', loginUser);

module.exports = router;
