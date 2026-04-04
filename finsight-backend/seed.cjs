'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ─── Models ───────────────────────────────────────────────────────────────────
const Tenant          = require('./src/models/Tenant');
const User            = require('./src/models/User');
const Feature         = require('./src/models/Feature');
const Journey         = require('./src/models/Journey');
const JourneyStep     = require('./src/models/JourneyStep');
const Event           = require('./src/models/Event');
const AuditLog        = require('./src/models/AuditLog');
const AggregatedMetric = require('./src/models/AggregatedMetric');
const Consent         = require('./src/models/Consent');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

// ─── Seed Data Definitions ────────────────────────────────────────────────────

const TENANTS_DATA = [
  {
    name: 'Acme Corp',
    deploymentType: 'CLOUD',
    region: 'US East (N. Virginia)',
    plan: 'Enterprise',
    industry: 'Financial Services',
    timezone: 'America/New_York',
    website: 'https://www.acmecorp.com',
    notifications: { email: true, slack: true, highUsageAlerts: true, licenseThreshold: true, churnRisk: true, weeklySummary: true },
    integrations: { slackConnected: true, jiraConnected: true, datadogConnected: false }
  },
  {
    name: 'Globex Industries',
    deploymentType: 'CLOUD',
    region: 'EU West (Ireland)',
    plan: 'Professional',
    industry: 'Manufacturing',
    timezone: 'Europe/London',
    website: 'https://www.globex.io',
    notifications: { email: true, slack: false, highUsageAlerts: true, licenseThreshold: false, churnRisk: false, weeklySummary: true },
    integrations: { slackConnected: false, jiraConnected: true, datadogConnected: true }
  },
  {
    name: 'Initech Solutions',
    deploymentType: 'ON_PREM',
    region: 'US West (Oregon)',
    plan: 'Starter',
    industry: 'Technology',
    timezone: 'America/Los_Angeles',
    website: 'https://www.initech.dev',
    notifications: { email: true, slack: false, highUsageAlerts: false, licenseThreshold: true, churnRisk: true, weeklySummary: false },
    integrations: { slackConnected: false, jiraConnected: false, datadogConnected: false }
  }
];

const FEATURES_DATA = [
  { name: 'Authentication',      code: 'AUTH_001',      module: 'Security',   description: 'User login, logout, and session management' },
  { name: 'Payments',            code: 'PAY_001',       module: 'Finance',    description: 'Payment processing and transaction management' },
  { name: 'Dashboard',           code: 'DASHBOARD',     module: 'Analytics',  description: 'Main analytics dashboard and KPI overview' },
  { name: 'Reports',             code: 'REP_001',       module: 'Analytics',  description: 'Generate and export business reports' },
  { name: 'API Integration',     code: 'API_001',       module: 'Platform',   description: 'REST and WebSocket API integrations' },
  { name: 'Notifications',       code: 'NOT_001',       module: 'Platform',   description: 'Email, Slack, and in-app notification management' },
  { name: 'File Manager',        code: 'FILE_001',      module: 'Storage',    description: 'Upload, browse, and manage files' },
  { name: 'User Management',     code: 'USER_001',      module: 'Admin',      description: 'Invite, manage, and deactivate team members' },
  { name: 'Audit Trail',         code: 'AUDIT_001',     module: 'Compliance', description: 'Track all user actions and system changes' },
  { name: 'Journey Builder',     code: 'JOURNEY_001',   module: 'Analytics',  description: 'Design and track user journey funnels' },
  { name: 'License Management',  code: 'LIC_001',       module: 'Admin',      description: 'Manage software license tiers and limits' },
  { name: 'Predictions Engine',  code: 'PRED_001',      module: 'Analytics', description: 'AI-powered feature adoption and churn predictions' },
];

const CHANNELS = ['WEB', 'MOBILE', 'API', 'BATCH'];
const EVENT_TYPES = ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'API_CALL', 'EXPORT', 'LOGIN', 'LOGOUT', 'SEARCH', 'FILTER', 'DOWNLOAD'];

const AUDIT_ACTIONS = [
  { action: 'USER_LOGIN',           metadata: { method: 'email', status: 'success' } },
  { action: 'FEATURE_CREATED',      metadata: { featureName: 'Payments', code: 'PAY_001' } },
  { action: 'FEATURE_UPDATED',      metadata: { featureCode: 'DASHBOARD', changes: { isActive: true } } },
  { action: 'JOURNEY_CREATED',      metadata: { journeyName: 'User Onboarding', type: 'Onboarding' } },
  { action: 'JOURNEY_UPDATED',      metadata: { journeyId: 'step added', step: 'Profile Setup' } },
  { action: 'SET_CONSENT',          metadata: { telemetryEnabled: true, gdprMode: true } },
  { action: 'UPDATE_SETTINGS',      metadata: { field: 'timezone', oldValue: 'UTC', newValue: 'America/New_York' } },
  { action: 'USER_INVITED',         metadata: { invitedEmail: 'analyst@acmecorp.com', role: 'ANALYST' } },
  { action: 'INTEGRATION_TOGGLED',  metadata: { integration: 'slack', connected: true } },
  { action: 'REPORT_EXPORTED',      metadata: { reportType: 'feature_analytics', format: 'CSV' } },
  { action: 'USER_ROLE_CHANGED',    metadata: { targetUser: 'viewer@acmecorp.com', newRole: 'ANALYST' } },
  { action: 'COMPLIANCE_UPDATED',   metadata: { piiMasking: { email: true, phone: true }, gdprComplianceMode: true } },
  { action: 'LICENSE_REVIEWED',     metadata: { plan: 'Enterprise', usersUsed: 12, usersLimit: 50 } },
  { action: 'BATCH_EVENTS_INGESTED',metadata: { count: 500, source: 'api' } },
  { action: 'PREDICTION_RUN',       metadata: { type: 'churn', confidence: 0.82 } },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  FinSight Data Seeder');
  console.log('━'.repeat(50));

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB Atlas\n');

  // ── Step 1: Clear all collections ──────────────────────────────────────────
  console.log('🗑️   Clearing existing data...');
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Feature.deleteMany({}),
    Journey.deleteMany({}),
    JourneyStep.deleteMany({}),
    Event.deleteMany({}),
    AuditLog.deleteMany({}),
    AggregatedMetric.deleteMany({}),
    Consent.deleteMany({})
  ]);
  console.log('✅  All collections cleared\n');

  // ── Step 2: Create Tenants ──────────────────────────────────────────────────
  console.log('🏢  Creating tenants...');
  const tenants = await Tenant.insertMany(TENANTS_DATA);
  console.log(`✅  Created ${tenants.length} tenants: ${tenants.map(t => t.name).join(', ')}\n`);

  // Primary tenant for most data
  const primaryTenant  = tenants[0]; // Acme Corp
  const secondTenant   = tenants[1]; // Globex
  const thirdTenant    = tenants[2]; // Initech

  // ── Step 3: Create Users ────────────────────────────────────────────────────
  console.log('👤  Creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    // Acme Corp users
    { tenantId: primaryTenant._id, email: 'admin@acmecorp.com',    password: passwordHash, role: 'ADMIN',   createdAt: daysAgo(180) },
    { tenantId: primaryTenant._id, email: 'john.smith@acmecorp.com', password: passwordHash, role: 'ADMIN', createdAt: daysAgo(160) },
    { tenantId: primaryTenant._id, email: 'analyst1@acmecorp.com', password: passwordHash, role: 'ANALYST', createdAt: daysAgo(120) },
    { tenantId: primaryTenant._id, email: 'analyst2@acmecorp.com', password: passwordHash, role: 'ANALYST', createdAt: daysAgo(90) },
    { tenantId: primaryTenant._id, email: 'viewer1@acmecorp.com',  password: passwordHash, role: 'VIEWER',  createdAt: daysAgo(60) },
    { tenantId: primaryTenant._id, email: 'viewer2@acmecorp.com',  password: passwordHash, role: 'VIEWER',  createdAt: daysAgo(45) },
    { tenantId: primaryTenant._id, email: 'viewer3@acmecorp.com',  password: passwordHash, role: 'VIEWER',  createdAt: daysAgo(30) },
    // Globex users
    { tenantId: secondTenant._id,  email: 'admin@globex.io',       password: passwordHash, role: 'ADMIN',   createdAt: daysAgo(150) },
    { tenantId: secondTenant._id,  email: 'analyst@globex.io',     password: passwordHash, role: 'ANALYST', createdAt: daysAgo(100) },
    { tenantId: secondTenant._id,  email: 'viewer@globex.io',      password: passwordHash, role: 'VIEWER',  createdAt: daysAgo(50) },
    // Initech users
    { tenantId: thirdTenant._id,   email: 'admin@initech.dev',     password: passwordHash, role: 'ADMIN',   createdAt: daysAgo(90) },
    { tenantId: thirdTenant._id,   email: 'dev@initech.dev',       password: passwordHash, role: 'ANALYST', createdAt: daysAgo(60) },
  ];

  const users = await User.insertMany(usersData);
  console.log(`✅  Created ${users.length} users across 3 tenants\n`);

  const acmeUsers   = users.filter(u => u.tenantId.equals(primaryTenant._id));
  const globexUsers = users.filter(u => u.tenantId.equals(secondTenant._id));
  const initechUsers= users.filter(u => u.tenantId.equals(thirdTenant._id));

  // ── Step 4: Create Features ─────────────────────────────────────────────────
  console.log('⚙️   Creating features...');
  const features = await Feature.insertMany(FEATURES_DATA);
  console.log(`✅  Created ${features.length} features\n`);

  const featureCodes = features.map(f => f.code);

  // ── Step 5: Create Journeys & Steps ────────────────────────────────────────
  console.log('🗺️   Creating journeys and steps...');

  const journeysData = [
    // Acme Corp journeys
    { tenantId: primaryTenant._id, name: 'New User Onboarding',       type: 'Onboarding',  createdAt: daysAgo(90) },
    { tenantId: primaryTenant._id, name: 'Payment Setup Flow',        type: 'Conversion',  createdAt: daysAgo(75) },
    { tenantId: primaryTenant._id, name: 'Feature Discovery Tour',    type: 'Retention',   createdAt: daysAgo(60) },
    { tenantId: primaryTenant._id, name: 'Enterprise Upgrade Path',   type: 'Conversion',  createdAt: daysAgo(45) },
    // Globex journeys
    { tenantId: secondTenant._id,  name: 'Globex Onboarding',         type: 'Onboarding',  createdAt: daysAgo(80) },
    { tenantId: secondTenant._id,  name: 'Report Generation Guide',   type: 'Retention',   createdAt: daysAgo(40) },
    // Initech journeys
    { tenantId: thirdTenant._id,   name: 'Initech Quick Start',       type: 'Onboarding',  createdAt: daysAgo(50) },
  ];

  const journeys = await Journey.insertMany(journeysData);
  console.log(`✅  Created ${journeys.length} journeys`);

  const stepsData = [];
  // Journey 1: New User Onboarding (Acme)
  const j1 = journeys[0];
  stepsData.push(
    { journeyId: j1._id, stepOrder: 1, stepName: 'Sign Up',           featureCode: 'AUTH_001' },
    { journeyId: j1._id, stepOrder: 2, stepName: 'Email Verification',featureCode: 'NOT_001' },
    { journeyId: j1._id, stepOrder: 3, stepName: 'Profile Setup',     featureCode: 'USER_001' },
    { journeyId: j1._id, stepOrder: 4, stepName: 'Dashboard Tour',    featureCode: 'DASHBOARD' },
    { journeyId: j1._id, stepOrder: 5, stepName: 'First Report',      featureCode: 'REP_001' }
  );
  // Journey 2: Payment Setup (Acme)
  const j2 = journeys[1];
  stepsData.push(
    { journeyId: j2._id, stepOrder: 1, stepName: 'Payment Method Entry',  featureCode: 'PAY_001' },
    { journeyId: j2._id, stepOrder: 2, stepName: 'Bank Verification',     featureCode: 'API_001' },
    { journeyId: j2._id, stepOrder: 3, stepName: 'First Transaction',     featureCode: 'PAY_001' },
    { journeyId: j2._id, stepOrder: 4, stepName: 'Receipt Download',      featureCode: 'FILE_001' }
  );
  // Journey 3: Feature Discovery (Acme)
  const j3 = journeys[2];
  stepsData.push(
    { journeyId: j3._id, stepOrder: 1, stepName: 'Explore Dashboard',      featureCode: 'DASHBOARD' },
    { journeyId: j3._id, stepOrder: 2, stepName: 'Try Journey Builder',     featureCode: 'JOURNEY_001' },
    { journeyId: j3._id, stepOrder: 3, stepName: 'View Predictions',        featureCode: 'PRED_001' },
    { journeyId: j3._id, stepOrder: 4, stepName: 'Set Up Notifications',    featureCode: 'NOT_001' },
    { journeyId: j3._id, stepOrder: 5, stepName: 'Review License',          featureCode: 'LIC_001' }
  );
  // Journey 4: Enterprise Upgrade (Acme)
  const j4 = journeys[3];
  stepsData.push(
    { journeyId: j4._id, stepOrder: 1, stepName: 'View License Page',       featureCode: 'LIC_001' },
    { journeyId: j4._id, stepOrder: 2, stepName: 'Compare Plans',           featureCode: 'DASHBOARD' },
    { journeyId: j4._id, stepOrder: 3, stepName: 'Contact Sales',           featureCode: 'NOT_001' },
    { journeyId: j4._id, stepOrder: 4, stepName: 'Upgrade Confirmed',       featureCode: 'PAY_001' }
  );
  // Journey 5: Globex Onboarding
  const j5 = journeys[4];
  stepsData.push(
    { journeyId: j5._id, stepOrder: 1, stepName: 'Account Creation',       featureCode: 'AUTH_001' },
    { journeyId: j5._id, stepOrder: 2, stepName: 'Team Invitation',        featureCode: 'USER_001' },
    { journeyId: j5._id, stepOrder: 3, stepName: 'API Key Setup',          featureCode: 'API_001' },
    { journeyId: j5._id, stepOrder: 4, stepName: 'First Data Import',      featureCode: 'FILE_001' }
  );
  // Journey 6: Globex Reports
  const j6 = journeys[5];
  stepsData.push(
    { journeyId: j6._id, stepOrder: 1, stepName: 'Open Reports Module',    featureCode: 'REP_001' },
    { journeyId: j6._id, stepOrder: 2, stepName: 'Select Date Range',      featureCode: 'REP_001' },
    { journeyId: j6._id, stepOrder: 3, stepName: 'Export CSV',             featureCode: 'FILE_001' }
  );
  // Journey 7: Initech Quickstart
  const j7 = journeys[6];
  stepsData.push(
    { journeyId: j7._id, stepOrder: 1, stepName: 'Install SDK',            featureCode: 'API_001' },
    { journeyId: j7._id, stepOrder: 2, stepName: 'Send First Event',       featureCode: 'AUDIT_001' },
    { journeyId: j7._id, stepOrder: 3, stepName: 'View on Dashboard',      featureCode: 'DASHBOARD' }
  );

  await JourneyStep.insertMany(stepsData);
  console.log(`✅  Created ${stepsData.length} journey steps\n`);

  // ── Step 6: Create Events (bulk – 90 days of data) ──────────────────────────
  console.log('📡  Generating events (this may take a moment)...');

  const events = [];
  const deployArr = ['CLOUD', 'ON_PREM'];
  const regArr = ['US East (N. Virginia)', 'EU West (Ireland)', 'US West (Oregon)', 'Asia Pacific', 'North America', 'Europe', 'Latin America'];
  
  const userProps = {};
  users.forEach((u, idx) => {
      const allowed = featureCodes.filter((c, cIdx) => {
          if (cIdx < 2) return true;
          if (cIdx < 5) return Math.random() > 0.3;
          if (cIdx < 8) return Math.random() > 0.6;
          return Math.random() > 0.8;
      });
      userProps[u._id.toString()] = {
          deploy: deployArr[idx % 2],
          region: regArr[idx % regArr.length],
          features: allowed.length ? allowed : [featureCodes[0]]
      };
  });

  // Acme Corp: heavy usage (500+ events spread over 90 days)
  for (let day = 90; day >= 0; day--) {
    const date = daysAgo(day);
    // vary daily volume with a trend
    const dailyCount = rand(8, 20) + Math.floor((90 - day) / 10);
    for (let i = 0; i < dailyCount; i++) {
      const user = pick(acmeUsers);
      const props = userProps[user._id.toString()];
      const featureCode = pick(props.features);
      const ts = new Date(date);
      ts.setHours(rand(7, 22), rand(0, 59), rand(0, 59));
      events.push({
        tenantId:  primaryTenant._id,
        userId:    user._id,
        sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
        channel:   pick(CHANNELS),
        feature:   featureCode,
        eventType: pick(EVENT_TYPES),
        timestamp: ts,
        metadata:  { source: pick(['browser', 'ios', 'android', 'curl']), version: '2.4.1', duration: rand(100, 4000), deploymentType: props.deploy, region: props.region }
      });
    }
  }

  // Globex: medium usage (200+ events over 60 days)
  for (let day = 60; day >= 0; day--) {
    const date = daysAgo(day);
    const dailyCount = rand(3, 10);
    for (let i = 0; i < dailyCount; i++) {
      const user = pick(globexUsers);
      const props = userProps[user._id.toString()];
      const featureCode = pick(props.features);
      const ts = new Date(date);
      ts.setHours(rand(8, 18), rand(0, 59), rand(0, 59));
      events.push({
        tenantId:  secondTenant._id,
        userId:    user._id,
        sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
        channel:   pick(['WEB', 'API']),
        feature:   featureCode,
        eventType: pick(EVENT_TYPES),
        timestamp: ts,
        metadata:  { source: pick(['browser', 'api']), version: '2.3.0', deploymentType: props.deploy, region: props.region }
      });
    }
  }

  // Initech: light usage (50+ events over 30 days)
  for (let day = 30; day >= 0; day--) {
    const date = daysAgo(day);
    const dailyCount = rand(1, 5);
    for (let i = 0; i < dailyCount; i++) {
      const user = pick(initechUsers);
      const props = userProps[user._id.toString()];
      const featureCode = pick(props.features);
      const ts = new Date(date);
      ts.setHours(rand(9, 17), rand(0, 59), rand(0, 59));
      events.push({
        tenantId:  thirdTenant._id,
        userId:    user._id,
        sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
        channel:   pick(['API', 'WEB']),
        feature:   featureCode,
        eventType: pick(EVENT_TYPES),
        timestamp: ts,
        metadata:  { source: 'api', version: '1.0.0', deploymentType: props.deploy, region: props.region }
      });
    }
  }

  // Batch insert in chunks of 500 for performance
  const chunkSize = 500;
  for (let i = 0; i < events.length; i += chunkSize) {
    await Event.insertMany(events.slice(i, i + chunkSize));
  }
  console.log(`✅  Created ${events.length} events across all tenants\n`);

  // ── Step 7: Create AggregatedMetrics ───────────────────────────────────────
  console.log('📊  Generating aggregated metrics...');
  const aggMetrics = [];
  for (let day = 60; day >= 0; day--) {
    const date = daysAgo(day);
    date.setHours(0, 0, 0, 0);
    for (const code of featureCodes) {
      // Acme
      aggMetrics.push({
        tenantId:    primaryTenant._id,
        feature:     code,
        date:        new Date(date),
        usageCount:  rand(10, 80),
        uniqueUsers: rand(2, 7)
      });
      // Globex
      aggMetrics.push({
        tenantId:    secondTenant._id,
        feature:     code,
        date:        new Date(date),
        usageCount:  rand(2, 30),
        uniqueUsers: rand(1, 3)
      });
    }
  }
  await AggregatedMetric.insertMany(aggMetrics);
  console.log(`✅  Created ${aggMetrics.length} aggregated metric records\n`);

  // ── Step 8: Create Audit Logs ──────────────────────────────────────────────
  console.log('📋  Creating audit logs...');
  const auditLogs = [];
  const allTenantUserPairs = [
    { tenantId: primaryTenant._id, users: acmeUsers },
    { tenantId: secondTenant._id,  users: globexUsers },
    { tenantId: thirdTenant._id,   users: initechUsers },
  ];

  for (const pair of allTenantUserPairs) {
    for (let i = 0; i < 25; i++) {
      const action = pick(AUDIT_ACTIONS);
      const user   = pick(pair.users);
      const ts     = daysAgo(rand(0, 60));
      tsOffset(ts, rand(0, 86400));
      auditLogs.push({
        tenantId:    pair.tenantId,
        action:      action.action,
        performedBy: user._id,
        metadata:    action.metadata,
        timestamp:   ts
      });
    }
  }

  await AuditLog.insertMany(auditLogs);
  console.log(`✅  Created ${auditLogs.length} audit log entries\n`);

  // ── Step 9: Create Consent Records ────────────────────────────────────────
  console.log('🔒  Creating consent / privacy records...');
  await Consent.insertMany([
    {
      tenantId:          primaryTenant._id,
      telemetryEnabled:  true,
      anonymizeUserData: true,
      gdprComplianceMode:true,
      piiMasking:        { email: true, phone: true, ip: false, fullName: false, physicalAddress: true },
      dataRetention:     { eventData: '90 days', aggregatedAnalytics: '2 years', auditLogs: '7 years' },
      updatedAt:         daysAgo(10)
    },
    {
      tenantId:          secondTenant._id,
      telemetryEnabled:  true,
      anonymizeUserData: true,
      gdprComplianceMode:true,
      piiMasking:        { email: true, phone: true, ip: true, fullName: true, physicalAddress: true },
      dataRetention:     { eventData: '60 days', aggregatedAnalytics: '1 year', auditLogs: '5 years' },
      updatedAt:         daysAgo(5)
    },
    {
      tenantId:          thirdTenant._id,
      telemetryEnabled:  false,
      anonymizeUserData: false,
      gdprComplianceMode:false,
      piiMasking:        { email: false, phone: false, ip: false, fullName: false, physicalAddress: false },
      dataRetention:     { eventData: '30 days', aggregatedAnalytics: '6 months', auditLogs: '3 years' },
      updatedAt:         daysAgo(2)
    },
  ]);
  console.log(`✅  Created 3 consent records\n`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('━'.repeat(50));
  console.log('🎉  Seeding Complete! Summary:');
  console.log(`   🏢  Tenants           : ${tenants.length}`);
  console.log(`   👤  Users             : ${users.length}`);
  console.log(`   ⚙️   Features          : ${features.length}`);
  console.log(`   🗺️   Journeys          : ${journeys.length}`);
  console.log(`   📍  Journey Steps     : ${stepsData.length}`);
  console.log(`   📡  Events            : ${events.length}`);
  console.log(`   📊  Aggregated Metrics: ${aggMetrics.length}`);
  console.log(`   📋  Audit Logs        : ${auditLogs.length}`);
  console.log(`   🔒  Consent Records   : 3`);
  console.log('━'.repeat(50));
  console.log('\n🔑  Login credentials (all share the same password):');
  console.log('   Password: Password123!');
  console.log('   admin@acmecorp.com   → ADMIN  (Acme Corp - Enterprise)');
  console.log('   analyst1@acmecorp.com → ANALYST (Acme Corp)');
  console.log('   admin@globex.io      → ADMIN  (Globex Industries - Professional)');
  console.log('   admin@initech.dev    → ADMIN  (Initech Solutions - Starter)\n');

  await mongoose.disconnect();
  console.log('✅  Disconnected from MongoDB. All done!\n');
}

// helper: offset a date by N seconds
function tsOffset(date, seconds) {
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

seed().catch(err => {
  console.error('\n❌  Seeding failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
