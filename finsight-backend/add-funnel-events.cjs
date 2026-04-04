'use strict';
const mongoose    = require('mongoose');
require('dotenv').config();

const Event       = require('./src/models/Event');
const User        = require('./src/models/User');
const Journey     = require('./src/models/Journey');
const JourneyStep = require('./src/models/JourneyStep');
const Tenant      = require('./src/models/Tenant');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  // Clear ALL old funnel-tagged events across all tenants
  const del = await Event.deleteMany({ 'metadata.stepOrder': { $exists: true } });
  console.log(`Deleted ${del.deletedCount} old funnel events\n`);

  const rand     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(rand(7,22), rand(0,59)); return d; };
  const channels = ['WEB', 'MOBILE', 'API'];
  const etypes   = ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT'];

  const allTenants = await Tenant.find({});
  const newEvents  = [];

  for (const tenant of allTenants) {
    const users    = await User.find({ tenantId: tenant._id });
    const journeys = await Journey.find({ tenantId: tenant._id });

    if (!users.length || !journeys.length) {
      console.log(`⚠️  Skipping tenant "${tenant.name}" — no users or journeys`);
      continue;
    }

    console.log(`\n🏢 Tenant: ${tenant.name} (${users.length} users, ${journeys.length} journeys)`);

    for (const journey of journeys) {
      const steps = await JourneyStep.find({ journeyId: journey._id }).sort({ stepOrder: 1 });
      if (!steps.length) continue;

      console.log(`  📍 Journey: "${journey.name}" (${steps.length} steps)`);

      // Start with all users for this tenant, progressively drop
      let pool = [...users];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`     Step ${i + 1}: "${step.stepName}" (${step.featureCode}) — ${pool.length} users`);

        // Each user in pool generates events for this step
        for (const user of pool) {
          const count = rand(2, 5);
          for (let e = 0; e < count; e++) {
            newEvents.push({
              tenantId:  tenant._id,
              userId:    user._id,
              sessionId: `j_${journey._id}_u_${user._id}_s${i}_e${e}`,
              channel:   channels[rand(0, channels.length - 1)],
              feature:   step.featureCode,
              eventType: etypes[rand(0, etypes.length - 1)],
              timestamp: daysAgo(rand(1, 28)),
              metadata: {
                journey:   journey.name,
                step:      step.stepName,
                stepOrder: i + 1   // ← key field that marks this as a funnel event
              }
            });
          }
        }

        // Drop 1 user after every step except the last
        // Smaller tenants drop fewer (always at least 1 if possible)
        if (i < steps.length - 1 && pool.length > 1) {
          const maxDrop  = Math.max(1, Math.floor(pool.length * 0.25)); // drop up to 25%
          const dropCount = rand(1, maxDrop);
          pool = pool.slice(0, pool.length - dropCount);
        }
      }
    }
  }

  // Batch insert
  const chunkSize = 300;
  for (let i = 0; i < newEvents.length; i += chunkSize) {
    await Event.insertMany(newEvents.slice(i, i + chunkSize));
  }

  console.log(`\n✅  Inserted ${newEvents.length} journey funnel events across all tenants`);
  await mongoose.disconnect();
  console.log('Done!\n');
}

run().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
