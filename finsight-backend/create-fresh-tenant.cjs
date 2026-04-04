'use strict';
const mongoose = require('mongoose');
require('dotenv').config();

const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Feature = require('./src/models/Feature');
const Event = require('./src/models/Event');
const Journey = require('./src/models/Journey');
const JourneyStep = require('./src/models/JourneyStep');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Existing features
  const features = await Feature.find({});
  if (!features.length) {
    console.log("No features found, please make sure the DB is seeded initially.");
    process.exit(1);
  }

  const featureCodes = features.map(f => f.code);

  const pwd = 'Password123!'; // Model pre-save hook will hash this automatically

  // Clear previous runs (if any) to avoid duplicate key errors
  const oldTenant = await Tenant.findOne({ name: 'Alpha Analytics' });
  if (oldTenant) {
    await User.deleteMany({ tenantId: oldTenant._id });
    await Event.deleteMany({ tenantId: oldTenant._id });
    await Journey.deleteMany({ tenantId: oldTenant._id });
    await Tenant.deleteOne({ _id: oldTenant._id });
    console.log('Cleaned up previous Alpha Analytics data');
  }

  // Create Tenant
  const freshTenant = await Tenant.create({
    name: 'Alpha Analytics',
    plan: 'enterprise',
    status: 'active',
    deploymentType: 'CLOUD',
    region: 'North America'
  });

  // Create Admin
  const adminUser = await User.create({
    tenantId: freshTenant._id,
    name: 'Alpha Admin',
    email: 'admin@alpha-analytics.dev',
    password: pwd,
    role: 'ADMIN',
    status: 'active'
  });

  // Create other users for data variance
  const newUsers = [adminUser];
  for(let i=1; i<=4; i++) {
    newUsers.push(await User.create({
      tenantId: freshTenant._id,
      name: `Alpha User ${i}`,
      email: `user${i}@alpha-analytics.dev`,
      password: pwd,
      role: 'VIEWER',
      status: 'active'
    }));
  }

  // Create Journey
  const journey = await Journey.create({
    tenantId: freshTenant._id,
    name: 'Alpha Onboarding',
    description: 'A new user onboarding journey',
    isActive: true
  });

  const steps = [
    { journeyId: journey._id, stepOrder: 1, stepName: 'Sign Up', featureCode: featureCodes[0] || 'AUTH_001' },
    { journeyId: journey._id, stepOrder: 2, stepName: 'Profile Setup', featureCode: featureCodes[1] || 'USER_001' },
    { journeyId: journey._id, stepOrder: 3, stepName: 'Explore Dashboard', featureCode: featureCodes[2] || 'DASHBOARD' },
  ];
  await JourneyStep.insertMany(steps);

  // Generate Events
  const events = [];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  const deployTypes = ['CLOUD', 'ON_PREM'];
  const regions = ['US East (N. Virginia)', 'US West (Oregon)'];

  // regular events
  for(let day=30; day>=0; day--) {
    const dDate = daysAgo(day);
    for(let i=0; i<rand(3,8); i++) {
      const u = newUsers[rand(0, newUsers.length-1)];
      const ts = new Date(dDate); ts.setHours(rand(8,20), rand(0,59), rand(0,59));
      events.push({
        tenantId: freshTenant._id,
        userId: u._id,
        sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
        channel: 'WEB',
        feature: featureCodes[rand(0, 4)], // restrict to top 5 features
        eventType: 'CLICK',
        timestamp: ts,
        metadata: { source: 'browser', deploymentType: deployTypes[rand(0,1)], region: regions[rand(0,1)] }
      });
    }
  }

  // Funnel events
  let pool = [...newUsers];
  for(let i=0; i<steps.length; i++) {
    const step = steps[i];
    for (const user of pool) {
      const count = rand(1, 3);
      for(let e=0; e<count; e++) {
         events.push({
           tenantId: freshTenant._id,
           userId: user._id,
           sessionId: `funnel_${user._id}`,
           channel: 'WEB',
           feature: step.featureCode,
           eventType: 'PAGE_VIEW',
           timestamp: daysAgo(rand(1, 20)),
           metadata: { journey: journey.name, step: step.stepName, stepOrder: i+1 }
         });
      }
    }
    // Drop 1 or 2 users per step to reliably show funnel drop-off
    if (pool.length > 2) pool.pop();
    if (pool.length > 2 && rand(0,1)===1) pool.pop();
  }

  await Event.insertMany(events);
  
  console.log('✅ Created fresh tenant Alpha Analytics');
  console.log('✅ Inserted new users, journeys, and events!');
  console.log('👉 Email: admin@alpha-analytics.dev');
  console.log('👉 Password: Password123!');
  
  await mongoose.disconnect();
}

run().catch(e => console.error(e));
