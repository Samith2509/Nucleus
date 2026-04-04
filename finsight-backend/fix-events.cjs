const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const User = require('./src/models/User');
const Feature = require('./src/models/Feature');
require('dotenv').config();

const deploymentTypes = ['CLOUD', 'ON_PREM'];
const regions = ['US East (N. Virginia)', 'EU West (Ireland)', 'US West (Oregon)', 'Asia Pacific', 'North America', 'Europe', 'Latin America'];

async function fixEvents() {
  console.log('Connecting...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Load all users and assign them deterministic properties
  const users = await User.find({});
  const userMap = {};
  users.forEach((u, i) => {
    userMap[u._id.toString()] = {
      deploymentType: deploymentTypes[i % deploymentTypes.length],
      // Give them a fixed region based on index
      region: regions[i % 4]
    };
  });

  // Load all features and give them an adoption probability based on index
  const features = await Feature.find({});
  const featureAdoption = {};
  features.forEach((f, i) => {
    // some features 100%, others vary down to 20%
    if (i < 2) featureAdoption[f.code] = 1.0; // 100%
    else if (i < 5) featureAdoption[f.code] = 0.8; // 80%
    else if (i < 8) featureAdoption[f.code] = 0.5; // 50%
    else featureAdoption[f.code] = 0.25; // 25%
  });

  console.log('Fixing events...');
  const events = await Event.find({});
  let deletedCount = 0;
  let updatedCount = 0;

  for (const ev of events) {
    const userIdStr = ev.userId ? ev.userId.toString() : 'unknown';
    const fCode = ev.feature;
    
    // Check if this user is "allowed" to use this feature (simple string hash)
    let charSum = 0;
    for(let i=0; i<Math.max(userIdStr.length, fCode.length); i++) {
        charSum += (userIdStr.charCodeAt(i) || 0) + (fCode.charCodeAt(i) || 0);
    }
    const prob = featureAdoption[fCode] || 1.0;
    
    // Hash check out of 100
    if ((charSum % 100) / 100.0 >= prob) {
       // Delete this event from DB because this user shouldn't use this feature
       await Event.deleteOne({ _id: ev._id });
       deletedCount++;
       continue;
    }

    // Set fixed region and deploymentType
    const userFixed = userMap[userIdStr];
    if (userFixed) {
       if (!ev.metadata) ev.metadata = {};
       ev.metadata.deploymentType = userFixed.deploymentType;
       ev.metadata.region = userFixed.region;
       ev.markModified('metadata');
       await ev.save();
       updatedCount++;
    }
  }

  console.log(`Finished: updated ${updatedCount}, deleted ${deletedCount} to enforce adoption ratios.`);
  await mongoose.disconnect();
}

fixEvents().catch(console.error);
