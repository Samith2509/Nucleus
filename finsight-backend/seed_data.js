require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Feature = require('./src/models/Feature');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // 1. Get or create a Tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      console.log('No tenant found. Creating one...');
      tenant = await Tenant.create({ name: 'Acme Corp Seed', deploymentType: 'CLOUD' });
    }

    // 2. Add some features
    let features = await Feature.find({ isActive: true });
    if (features.length < 5) {
      console.log('Creating more features...');
      const newFeatures = [
        { code: 'DASHBOARD_VIEW', name: 'Dashboard View', module: 'Core', description: 'User viewed the dashboard', isActive: true },
        { code: 'REPORT_EXPORT', name: 'Report Export', module: 'Analytics', description: 'User exported a report', isActive: true },
        { code: 'SETTINGS_UPDATE', name: 'Settings Update', module: 'Admin', description: 'User updated settings', isActive: true },
        { code: 'PROFILE_EDIT', name: 'Profile Edit', module: 'Core', description: 'User edited their profile', isActive: true },
        { code: 'INVITE_USER', name: 'Invite User', module: 'Admin', description: 'User invited a team member', isActive: true }
      ];
      
      // Filter out existing ones
      const existingCodes = features.map(f => f.code);
      const toInsert = newFeatures.filter(f => !existingCodes.includes(f.code));
      
      if (toInsert.length > 0) {
        await Feature.insertMany(toInsert);
      }
      features = await Feature.find({ isActive: true });
    }

    // 3. Create diverse users
    let users = await User.find({ tenantId: tenant._id });
    if (users.length < 15) {
      console.log('Creating mock users...');
      const newUsers = [];
      for (let i = users.length; i < 20; i++) {
        newUsers.push({
          tenantId: tenant._id,
          email: `demo_user_${i}_${Date.now()}@example.com`,
          password: 'password123', // Doesn't matter because we just bypass auth for events here
          role: 'VIEWER'
        });
      }
      users = await User.insertMany(newUsers);
    }

    // 4. Generate diverse events
    console.log('Generating events...');
    const channels = ['WEB', 'WEB', 'WEB', 'MOBILE', 'MOBILE', 'API', 'BATCH']; 
    // Weighted to simulate realistic distribution (WEB is most common, then MOBILE, etc.)

    const eventsToInsert = [];
    const now = new Date();

    for (let i = 0; i < 600; i++) { // Generate 600 random events
      const randomFeature = features[Math.floor(Math.random() * features.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      
      // Spread events across the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      eventsToInsert.push({
        tenantId: tenant._id,
        userId: randomUser._id,
        feature: randomFeature.code,
        channel: randomChannel,
        eventType: 'TRIGGER',
        timestamp: timestamp
      });
    }

    await Event.insertMany(eventsToInsert);
    console.log(`Successfully inserted 600 events across diverse channels and ${users.length} users!`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedData();
