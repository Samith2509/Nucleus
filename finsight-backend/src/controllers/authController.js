const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// Register new user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, tenantId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user object
    const user = new User({
      email,
      password,
      tenantId,
      role
    });

    // Save user (password will be hashed by pre-save hook)
    await user.save();

    // Prepare response, omitting password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User registered successfully', data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT payload with requested fields
    const payload = {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role
    };

    // Sign the token using generateToken utility
    const token = generateToken(payload);

    // Return the token
    res.status(200).json({ success: true, message: 'Login successful', data: { token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
