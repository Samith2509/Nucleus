const mongoose = require('mongoose');
const Event = require('./src/models/Event');
require('dotenv').config();

const deploymentTypes = ['CLOUD', 'ON_PREM'];
const regions = ['US East (N. Virginia)', 'EU West (Ireland)', 'US West (Oregon)', 'Asia Pacific'];

async function updateEvents() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');
  
  const events = await Event.find({});
  console.log(`Found ${events.length} events to update.`);
  
  let count = 0;
  for (const ev of events) {
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.deploymentType = deploymentTypes[Math.floor(Math.random() * deploymentTypes.length)];
    ev.metadata.region = regions[Math.floor(Math.random() * regions.length)];
    
    // We use markModified because metadata is Mixed type in Mongoose
    ev.markModified('metadata');
    await ev.save();
    count++;
    if (count % 100 === 0) console.log(`Updated ${count} events...`);
  }
  
  console.log(`Finished updating ${count} events.`);
  await mongoose.disconnect();
}

updateEvents().catch(console.error);
