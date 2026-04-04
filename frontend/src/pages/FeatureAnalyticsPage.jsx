import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──
const formatNum = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
};

const PIE_COLORS = ['#1e3a8a', '#14b8a6', '#818cf8', '#f59e0b', '#ef4444', '#64748b'];

const FeatureAnalyticsPage = () => {
  const navigate = useNavigate();
  const [features, setFeatures] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [availableFilters, setAvailableFilters] = useState({ deploymentTypes: ['CLOUD', 'ON_PREM'], regions: ['US East', 'Europe'] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail panel state
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters state
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [deploymentType, setDeploymentType] = useState('All');
  const [region, setRegion] = useState('All Regions');
  const detailPanelRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Reusable detail fetcher ──
  const fetchDetail = async (featureCode) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const queryParams = new URLSearchParams({ feature: featureCode, dateRange, deploymentType, region }).toString();
      const res = await fetch(`https://nucleus-by-sheeroo.onrender.com/api/v1/analytics/feature-detail?${queryParams}`, { headers });
      const json = await res.json();
      if (json.success) {
        setDetail(json.data);
      }
    } catch (e) {
      console.error('Feature detail fetch error', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Fetch feature table ──
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchTable = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ dateRange, deploymentType, region }).toString();
        const res = await fetch(`https://nucleus-by-sheeroo.onrender.com/api/v1/analytics/feature-analytics?${queryParams}`, { headers });
        if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
        const json = await res.json();
        if (json.success) {
          setFeatures(json.data.features);
          setTotalUsers(json.data.totalUsers);
          if (json.data.availableFilters) {
            setAvailableFilters(json.data.availableFilters);
          }
          // Auto-load detail for the first feature
          if (json.data.features.length > 0) {
            const first = json.data.features[0];
            setSelectedFeature(first);
            fetchDetail(first.code);
          }
        } else {
          setError(json.message);
        }
      } catch (e) {
        setError('Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchTable();
  }, [navigate, dateRange, deploymentType, region]);

  // ── Click handler for View Details ──
  const handleViewDetails = (featureCode) => {
    const feat = features.find(f => f.code === featureCode);
    setSelectedFeature(feat);
    fetchDetail(featureCode);
    setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── Derive SVG chart data ──
  const trendPoints = detail?.dailyTrend || [];
  const trendMax = Math.max(...trendPoints.map(t => t.count), 1);
  const pts = trendPoints.map((t, i) => ({
    x: trendPoints.length > 1 ? (i / (trendPoints.length - 1)) * 100 : 50,
    y: 100 - (t.count / trendMax) * 85,
    label: new Date(t.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    count: t.count,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const xLabels = (() => {
    if (pts.length <= 5) return pts;
    const step = Math.floor((pts.length - 1) / 4);
    return [0, step, step * 2, step * 3, pts.length - 1].map(i => pts[i]);
  })();
  const yLabels = [trendMax, Math.round(trendMax * 0.75), Math.round(trendMax * 0.5), Math.round(trendMax * 0.25), 0];

  // Pie chart arcs
  const channels = detail?.channelBreakdown || [];
  const buildPieArcs = () => {
    const total = channels.reduce((s, c) => s + c.count, 0);
    if (total === 0) return [];

    // Special case: only 1 channel = full circle (360° arc is degenerate in SVG)
    if (channels.length === 1) {
      const c = channels[0];
      return [{
        type: 'circle',
        color: PIE_COLORS[0],
        label: `${c.channel}: ${c.percent}%`,
        lx: 100, ly: 10,
        channel: c.channel, percent: c.percent
      }];
    }

    let cumAngle = -90;
    return channels.map((c, i) => {
      const angle = (c.count / total) * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const r = 80;
      const x1 = 100 + r * Math.cos(startRad);
      const y1 = 100 + r * Math.sin(startRad);
      const x2 = 100 + r * Math.cos(endRad);
      const y2 = 100 + r * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
      const lx = 100 + (r + 25) * Math.cos(midRad);
      const ly = 100 + (r + 25) * Math.sin(midRad);
      return {
        type: 'arc',
        path: `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: PIE_COLORS[i % PIE_COLORS.length],
        label: `${c.channel}: ${c.percent}%`,
        lx, ly, channel: c.channel, percent: c.percent
      };
    });
  };
  const arcs = buildPieArcs();

  const adoptionBadge = (rate) => {
    if (rate >= 80) return { text: 'High Adoption', bg: 'bg-emerald-500' };
    if (rate >= 50) return { text: 'Medium Adoption', bg: 'bg-amber-500' };
    return { text: 'Low Adoption', bg: 'bg-red-500' };
  };

  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans text-gray-900 overflow-hidden">

      {/* ──── Sidebar ──── */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 font-bold bg-[#00829B] rounded-[0.4rem] flex items-center justify-center shadow-sm"><span className="text-white text-[15px]">F</span></div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight leading-none">FinSight</span>
            </div>
          </div>
          <div className="py-5 px-3 space-y-0.5">
            {[
              { name: 'Dashboard', active: false, href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
              { name: 'Feature Analytics', active: true, href: '/feature-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
              { name: 'Journey Analytics', active: false, href: '/journey-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
              { name: 'Customers / Segments', active: false, href: '/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { name: 'License Insights', active: false, href: '/license-insights', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
              { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
              { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
              { name: 'Journey Builder', active: false, href: '/journey-builder', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              { name: 'Privacy & Compliance', href: '/privacy-compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { name: 'Audit Logs', href: '/audit-logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              { name: 'Settings', href: '/settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
            ].map((item, idx) => (
              <a key={idx} href={item.href || '#'} onClick={item.href ? (e) => { e.preventDefault(); navigate(item.href); } : undefined} className={`flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${item.active ? 'bg-[#F0F5FF] text-[#0052cc]' : 'text-[#475569] hover:bg-gray-50 hover:text-gray-900'}`}>
                <span className={item.active ? 'text-[#0052cc]' : 'text-[#64748B]'}>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">{localStorage.getItem('tenantName')?.substring(0, 2).toUpperCase() || 'AC'}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate tracking-tight">{localStorage.getItem('tenantName') || 'Acme Corp'}</span>
              <span className="text-[12px] text-[#64748B] tracking-tight">{localStorage.getItem('tenantPlan') || 'Enterprise'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ──── Main ──── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Navbar */}
        <TopHeader />

        {/* ──── Page Content ──── */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* Header row */}
          <div className="mb-6">
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Feature Analytics</h1>
            <p className="text-[15px] mt-1 text-[#64748B]">Track and analyze feature usage across your platform</p>
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 grid grid-cols-3 gap-6">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date Range</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00829B]">
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 90 days">Last 90 days</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Deployment Type</label>
              <select 
                value={deploymentType}
                onChange={(e) => setDeploymentType(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00829B]">
                <option value="All">All</option>
                {availableFilters.deploymentTypes.map(d => (
                  <option key={d} value={d}>{d === 'CLOUD' ? 'Cloud' : (d === 'ON_PREM' ? 'On-Premise' : d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Region</label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00829B]">
                <option value="All Regions">All Regions</option>
                {availableFilters.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00829B]"></div></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
          ) : (
            <>
              {/* ──── Features Table ──── */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-[16px] font-semibold text-gray-900">All Features</h2>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[12px] text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Feature Name</th>
                      <th className="px-6 py-3 font-semibold">Code</th>
                      <th className="px-6 py-3 font-semibold">Usage Count</th>
                      <th className="px-6 py-3 font-semibold">Unique Users</th>
                      <th className="px-6 py-3 font-semibold">Adoption %</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400 text-sm">No features registered yet.</td></tr>
                    ) : features.map((f, idx) => (
                      <tr key={f.code} className={`border-b border-gray-50 hover:bg-[#f8fafc] transition-colors ${selectedFeature?.code === f.code ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-3.5 text-[14px] font-semibold text-gray-900">{f.name}</td>
                        <td className="px-6 py-3.5"><span className="text-[12px] font-mono bg-gray-100 text-gray-600 rounded px-2 py-0.5">{f.code}</span></td>
                        <td className="px-6 py-3.5 text-[14px] text-gray-700 font-medium">{formatNum(f.usageCount)}</td>
                        <td className="px-6 py-3.5 text-[14px] text-gray-700 font-medium">{formatNum(f.uniqueUsers)}</td>
                        <td className="px-6 py-3.5 text-[14px] text-gray-700 font-medium">
                          <span className="inline-flex items-center">
                            {f.adoptionPercent}%
                            {f.adoptionPercent >= 50 ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" className="ml-1"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" className="ml-1"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {f.isActive ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <button onClick={() => handleViewDetails(f.code)} className="text-[13px] text-[#0052cc] font-medium hover:underline">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ──── Feature Detail Panel ──── */}
              {selectedFeature && (
                <div ref={detailPanelRef} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <select 
                        value={selectedFeature.code} 
                        onChange={(e) => handleViewDetails(e.target.value)}
                        className="text-[18px] font-bold text-gray-900 bg-transparent border-0 border-b border-gray-200 outline-none pb-1 mb-1 cursor-pointer hover:border-gray-300 focus:ring-0"
                      >
                        {features.map((f) => (
                          <option key={f.code} value={f.code}>{f.name}</option>
                        ))}
                      </select>
                      <span className="text-[13px] font-mono text-gray-500">{selectedFeature.code}</span>
                    </div>
                    <span className={`text-[12px] font-semibold text-white px-3 py-1 rounded-full ${adoptionBadge(detail?.adoptionRate ?? selectedFeature.adoptionPercent).bg}`}>
                      {adoptionBadge(detail?.adoptionRate ?? selectedFeature.adoptionPercent).text}
                    </span>
                  </div>

                  {detailLoading ? (
                    <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00829B]"></div></div>
                  ) : detail ? (
                    <>
                      {/* Charts Row */}
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Usage Trend Line Chart */}
                        <div>
                          <h3 className="text-[14px] font-semibold text-[#0052cc] mb-4">Usage Trend</h3>
                          {pts.length === 0 ? (
                            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No trend data.</div>
                          ) : (
                            <>
                              <div className="relative h-[220px] w-full">
                                <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between text-[10px] text-gray-400 text-right pr-2 select-none">
                                  {yLabels.map((v, i) => <span key={i}>{formatNum(v)}</span>)}
                                </div>
                                <div className="relative flex-1 ml-[48px] h-full">
                                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {yLabels.map((_, i) => <div key={i} className={`w-full border-t ${i === yLabels.length - 1 ? 'border-gray-300' : 'border-dashed border-gray-200'}`}></div>)}
                                  </div>
                                  <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    {pts.length > 1 && (
                                      <path d={linePath} fill="none" stroke="#1e40af" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                    )}
                                    {pts.length === 1 && pts.map((p, i) => (
                                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1e40af" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                    ))}
                                  </svg>
                                </div>
                              </div>
                              <div className="flex justify-between ml-[48px] mt-1 text-[10px] text-gray-500 select-none">
                                {xLabels.map((p, i) => <span key={i}>{p?.label}</span>)}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Pie Chart: Usage by Channel */}
                        <div>
                          <h3 className="text-[14px] font-semibold text-[#0052cc] mb-4">Usage by Channel</h3>
                          {channels.length === 0 ? (
                            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No channel data.</div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <svg viewBox="0 0 250 220" className="w-[280px] h-[220px]">
                                {arcs.map((a, i) => (
                                  <g key={i}>
                                    {a.type === 'circle' ? (
                                      <circle cx="125" cy="110" r="80" fill={a.color} stroke="#fff" strokeWidth="1.5" />
                                    ) : (
                                      <path d={a.path} fill={a.color} stroke="#fff" strokeWidth="1.5" />
                                    )}
                                    <text x={a.type === 'circle' ? 125 : a.lx} y={a.type === 'circle' ? 20 : a.ly} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="600">{a.label}</text>
                                  </g>
                                ))}
                              </svg>
                              <div className="flex items-center space-x-4 mt-3">
                                {channels.map((c, i) => (
                                  <div key={i} className="flex items-center text-[12px] text-gray-600">
                                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                    {c.channel}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary Stats */}
                      <div className="grid grid-cols-4 gap-6 border-t border-gray-100 pt-6">
                        <div>
                          <p className="text-[12px] text-gray-500 font-medium mb-1">Total Usage</p>
                          <p className="text-[24px] font-bold text-gray-900">{formatNum(detail.usageCount)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-gray-500 font-medium mb-1">Unique Users</p>
                          <p className="text-[24px] font-bold text-gray-900">{formatNum(detail.uniqueUsers)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-gray-500 font-medium mb-1">Adoption Rate</p>
                          <p className="text-[24px] font-bold text-gray-900">{detail.adoptionRate}%</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-gray-500 font-medium mb-1">ROI Category</p>
                          <span className={`inline-block text-[12px] font-semibold text-white px-3 py-1 rounded ${detail.adoptionRate >= 60 ? 'bg-[#1e3a8a]' : 'bg-gray-500'}`}>
                            {detail.adoptionRate >= 60 ? 'High ROI' : 'Low ROI'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#1e293b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors focus:outline-none z-50">
          <span className="font-semibold text-lg">?</span>
        </button>
      </main>
    </div>
  );
};

export default FeatureAnalyticsPage;
