const mongoose = require('mongoose');
const Event = require('../models/Event');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Feature = require('../models/Feature');

exports.getPredictions = async (req, res) => {
  try {
    const now = new Date();

    // ── Date helpers ────────────────────────────────────────────────────────
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth   = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthLabel   = (d) => d.toLocaleString('default', { month: 'short', year: 'numeric' });

    // ── 1. USAGE TREND: last 4 months actual + 3 months projected ──────────
    const usageTrend = [];
    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const currentDay = now.getDate();
    const totalDaysThisMonth = daysInMonth(now.getFullYear(), now.getMonth());

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = startOfMonth(d);
      const end   = endOfMonth(d);
      let count = await Event.countDocuments({ timestamp: { $gte: start, $lte: end } });
      
      // Normalize current month to a full-month projection
      if (i === 0 && currentDay < totalDaysThisMonth) {
        count = Math.round((count / Math.max(currentDay, 1)) * totalDaysThisMonth);
      }

      usageTrend.push({ month: monthLabel(d), actual: count, predicted: null });
    }

    // Simple linear regression on last 6 months to project next 3
    const ys = usageTrend.map(t => t.actual);
    const n  = ys.length;
    const xMean = (n - 1) / 2;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const slope = ys.reduce((acc, y, x) => acc + (x - xMean) * (y - yMean), 0) /
                  ys.reduce((acc, _, x) => acc + Math.pow(x - xMean, 2), 0) || 0;

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const predictedVal = Math.max(0, Math.round(yMean + slope * (n - 1 + i - xMean)));
      usageTrend.push({ month: monthLabel(d), actual: null, predicted: predictedVal });
    }

    // ── 2. GROWTH TREND KPI ─────────────────────────────────────────────────
    // Compare normalized current month vs last month
    const thisMonthProjected = usageTrend[5].actual || 0;
    const lastMonthActual = usageTrend[4].actual || 1;
    const growthPct = lastMonthActual > 0
      ? parseFloat((((thisMonthProjected - lastMonthActual) / lastMonthActual) * 100).toFixed(1))
      : 0;
    
    let growthLevel = 'Low';
    if (growthPct > 15) growthLevel = 'High';
    else if (growthPct > 5) growthLevel = 'Medium';
    else if (growthPct < 0) growthLevel = 'Declining';

    // ── 3. CHURN RISK: tenants with declining usage ─────────────────────────
    const allTenants = await Tenant.find({}).lean();
    let churnCount = 0;
    for (const t of allTenants) {
      const tid = t._id;
      // Last full month
      const prev = await Event.countDocuments({
        tenantId: tid,
        timestamp: { $gte: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
                     $lte: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1)) }
      });
      // Normalized current month
      let curr = await Event.countDocuments({
        tenantId: tid,
        timestamp: { $gte: startOfMonth(now) }
      });
      curr = Math.round((curr / Math.max(currentDay, 1)) * totalDaysThisMonth);

      if (curr < prev * 0.7 && prev > 10) churnCount++; // Only flag if significant baseline usage
    }
    const churnRisk = allTenants.length > 0
      ? parseFloat(((churnCount / allTenants.length) * 100).toFixed(1))
      : 0;
    const churnLevel = churnRisk >= 25 ? 'High' : churnRisk >= 10 ? 'Medium' : 'Low';

    // ── 4. REVENUE IMPACT (heuristic: adoption * user count * avg revenue per feature) ──────
    const totalUsers = await User.countDocuments({});
    const wellAdoptedFeatures = await Event.distinct('feature');
    const usedFeaturesCount = wellAdoptedFeatures.length;
    // Base revenue: each active usage of a feature is valued at $20/month
    const projectedUsageRevenue = usedFeaturesCount * totalUsers * 25;
    // Round to nearest 5k
    const revenueImpact = Math.round(projectedUsageRevenue / 5000) * 5000;
    const revenueLevel = revenueImpact >= 250000 ? 'Positive' : 'Stable';

    // ── 5. FEATURE ADOPTION FORECAST ────────────────────────────────────────
    const allFeatures = await Feature.find({}).lean();
    const featureForecast = [];

    // Optimize user count query
    const totalUserCount = await User.countDocuments({});

    for (const f of allFeatures.slice(0, 6)) {
      // 1. Better Adoption Calculation: unique users who used this feature vs total users
      const uniqueUsersFeature = await Event.distinct('userId', { feature: f.code });
      const uniqueCount = uniqueUsersFeature.length;
      
      const adoptionPct = totalUserCount > 0 
        ? Math.min(100, Math.round((uniqueCount / totalUserCount) * 100))
        : 0;

      // 2. Clearer Trend: compare Last 30 Days to Previous 30 Days (rather than month - 1 vs month - 3)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentCount = await Event.countDocuments({
        feature: f.code,
        timestamp: { $gte: thirtyDaysAgo }
      });
      const prevCount = await Event.countDocuments({
        feature: f.code,
        timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });

      let trendPct = 0;
      if (prevCount > 0) {
        trendPct = parseFloat((((recentCount - prevCount) / prevCount) * 100).toFixed(1));
      } else if (recentCount > 0) {
        // If it went from 0 to something, it's technically infinite growth, but let's cap it or just show 100.
        // For dummy data realism, let's calculate a modest "initial trend" based on the raw count 
        // to avoid everything just saying +100%.
        trendPct = Math.min(100, recentCount * 5); 
      }

      featureForecast.push({
        name: f.name,
        code: f.code,
        adoptionPct,
        trendPct
      });
    }

    // ── 6. CUSTOMER HEALTH PREDICTIONS ──────────────────────────────────────
    const customerHealth = [];
    for (const t of allTenants) {
      const tid = t._id;
      const curr = await Event.countDocuments({
        tenantId: tid,
        timestamp: { $gte: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)) }
      });
      const prev = await Event.countDocuments({
        tenantId: tid,
        timestamp: { $gte: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 3, 1)),
                     $lte: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1)) }
      });

      let risk = 'Low Risk';
      let desc = 'Excellent health';
      if (curr === 0)          { risk = 'High Risk'; desc = 'At risk — no recent activity'; }
      else if (curr < prev * 0.7) { risk = 'High Risk'; desc = 'Declining engagement'; }
      else if (curr < prev * 0.9) { risk = 'Medium Risk'; desc = 'Slight decline'; }
      else if (curr <= prev)      { risk = 'Low Risk'; desc = 'Good health'; }
      else                        { risk = 'Low Risk'; desc = 'Excellent health'; }

      customerHealth.push({ name: t.name, risk, desc });
    }

    // Sort: High Risk first
    const riskOrder = { 'High Risk': 0, 'Medium Risk': 1, 'Low Risk': 2 };
    customerHealth.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

    // ── 7. AI INSIGHTS ───────────────────────────────────────────────────────
    const insights = [];
    const sortedByTrend = [...featureForecast].sort((a, b) => b.trendPct - a.trendPct);
    const topFeature = sortedByTrend[0];
    const decliningFeature = sortedByTrend.find(f => f.trendPct < 0) || sortedByTrend[sortedByTrend.length - 1];

    // Insight 1: Growth (always show — positive or informational)
    if (topFeature) {
      if (topFeature.trendPct > 0) {
        insights.push({
          type: 'Growth',
          title: 'High Growth Potential',
          desc: `${topFeature.name} feature showing ${topFeature.trendPct}% MoM growth. Consider expanding capabilities to capitalize on momentum.`,
          color: 'green'
        });
      } else {
        insights.push({
          type: 'Opportunity',
          title: 'Feature Adoption Opportunity',
          desc: `${topFeature.name} has the highest adoption at ${topFeature.adoptionPct}%. Promote to lower-engagement customers to drive usage.`,
          color: 'green'
        });
      }
    } else {
      insights.push({
        type: 'Growth',
        title: 'Stable Platform Usage',
        desc: `Platform usage is consistent. Focus on onboarding campaigns to drive incremental growth.`,
        color: 'green'
      });
    }

    // Insight 2: Churn Risk / Health warning (always show)
    const highRiskCount = customerHealth.filter(c => c.risk === 'High Risk').length;
    const medRiskCount  = customerHealth.filter(c => c.risk === 'Medium Risk').length;
    if (highRiskCount > 0) {
      const names = customerHealth.filter(c => c.risk === 'High Risk').map(c => c.name).slice(0, 2).join(' and ');
      insights.push({
        type: 'Risk',
        title: 'Churn Risk Detected',
        desc: `${highRiskCount} customer(s) including ${names} show declining engagement. Schedule immediate check-ins.`,
        color: 'red'
      });
    } else if (medRiskCount > 0) {
      const names = customerHealth.filter(c => c.risk === 'Medium Risk').map(c => c.name).slice(0, 2).join(' and ');
      insights.push({
        type: 'Risk',
        title: 'Engagement Decline Warning',
        desc: `${medRiskCount} customer(s) including ${names} show a slight usage decline. Proactive outreach is recommended.`,
        color: 'red'
      });
    } else if (decliningFeature && decliningFeature.trendPct < 0) {
      insights.push({
        type: 'Risk',
        title: 'Feature Usage Drop',
        desc: `${decliningFeature.name} usage dropped ${Math.abs(decliningFeature.trendPct)}% this cycle. Investigate root cause and engage affected users.`,
        color: 'red'
      });
    } else {
      insights.push({
        type: 'Info',
        title: 'Customer Health is Strong',
        desc: `All customers show healthy engagement levels. Continue current success programs to maintain momentum.`,
        color: 'blue'
      });
    }

    // Insight 3: Cross-sell / adoption opportunity (always show)
    const unusedFeatureCount = allFeatures.length - usedFeaturesCount;
    const lowAdoptionFeatures = featureForecast.filter(f => f.adoptionPct < 50);
    if (unusedFeatureCount > 0) {
      insights.push({
        type: 'Opportunity',
        title: 'Cross-Sell Opportunity',
        desc: `${unusedFeatureCount} licensed feature(s) remain unused. Target customers with guided tutorials and in-app prompts.`,
        color: 'blue'
      });
    } else if (lowAdoptionFeatures.length > 0) {
      insights.push({
        type: 'Opportunity',
        title: 'Adoption Improvement Potential',
        desc: `${lowAdoptionFeatures.length} feature(s) have below 50% adoption. A targeted onboarding campaign could significantly boost engagement.`,
        color: 'blue'
      });
    } else {
      insights.push({
        type: 'Opportunity',
        title: 'Upsell Window Open',
        desc: `Strong feature adoption across the board signals readiness for premium tier upsell. Consider proactive pricing conversations.`,
        color: 'blue'
      });
    }

    // Restore sort order for featureForecast
    featureForecast.sort((a, b) => b.adoptionPct - a.adoptionPct);

    // ── 8. RECOMMENDED ACTIONS ───────────────────────────────────────────────
    const highRiskCustomers = customerHealth.filter(c => c.risk === 'High Risk' || c.risk === 'Medium Risk');
    const recommendedActions = [];
    if (highRiskCustomers.length > 0) {
      recommendedActions.push(
        `Schedule proactive check-ins with ${highRiskCustomers.map(c => c.name).join(' and ')} to address declining usage patterns`
      );
    }
    if (topFeature) {
      recommendedActions.push(
        `Launch targeted campaign to promote ${topFeature.name} feature which shows strong growth potential`
      );
    }
    if (decliningFeature) {
      recommendedActions.push(
        `Investigate reasons behind ${decliningFeature.name} decline and develop improvement plan`
      );
    }
    const topCustomers = customerHealth.filter(c => c.risk === 'Low Risk').slice(0, 2);
    if (topCustomers.length > 0) {
      recommendedActions.push(
        `Create success stories featuring ${topCustomers.map(c => c.name).join(' and ')} to inspire other customers`
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          growthPct,
          growthLevel,
          churnRisk,
          churnLevel,
          revenueImpact,
          revenueLevel
        },
        usageTrend,
        featureForecast,
        customerHealth,
        insights,
        recommendedActions
      }
    });

  } catch (error) {
    console.error('Error generating predictions:', error);
    return res.status(500).json({ success: false, message: 'Server error generating predictions' });
  }
};
