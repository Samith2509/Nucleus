const User = require('../models/User');
const Tenant = require('../models/Tenant');
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

    // Fetch tenant details to return name/plan for the UI
    const tenant = await Tenant.findById(user.tenantId);

    // Return the token and tenant info
    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      data: { 
        token,
        tenant: {
          name: tenant ? tenant.name : 'Acme Corp',
          plan: tenant ? tenant.plan : 'Enterprise'
        }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Signup user (creates new tenant)
exports.signupUser = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Check if company name is provided
    if (!companyName || companyName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Company name is required for signup' });
    }

    // 1. Create a new Tenant
    const newTenant = new Tenant({
      name: companyName,
      deploymentType: 'CLOUD', 
      region: 'US-EAST-1',    
      plan: 'STARTER'         
    });
    await newTenant.save();

    // 2. Create the user as the first ADMIN of that Tenant
    const user = new User({
      email,
      password,
      tenantId: newTenant._id,
      role: 'ADMIN' 
    });
    await user.save();

    // 3. Auto-login after signup: Prepare JWT payload
    const payload = {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role
    };

    // Sign the token
    const token = generateToken(payload);

    res.status(201).json({ 
      success: true, 
      message: 'Signup successful, tenant created', 
      data: { 
        token, 
        user: { email: user.email, role: user.role, tenantId: user.tenantId },
        tenant: {
          name: newTenant.name,
          plan: newTenant.plan
        }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
