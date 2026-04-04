import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──
const formatNumber = (num) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
};

const HEATMAP_COLORS = ['#f1f5f9', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'];
const getHeatColor = (count, maxCount) => {
  if (maxCount === 0 || count === 0) return '#f8fafc';
  const idx = Math.min(Math.floor((count / maxCount) * HEATMAP_COLORS.length), HEATMAP_COLORS.length - 1);
  return HEATMAP_COLORS[idx];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DashboardPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const res = await fetch('/api/v1/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          navigate('/login');
          return;
        }

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load dashboard');
        }
      } catch (e) {
        console.error('Dashboard fetch error', e);
        setError('Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  // ── Derive chart data ──
  const totalEvents   = data?.totalEvents ?? 0;
  const activeUsers   = data?.activeUsers ?? 0;
  const adoptionRate  = data?.adoptionRate ?? 0;
  const dropOffRate   = data?.dropOffRate ?? 0;
  const eventsChange  = data?.eventsChange ?? 0;
  const usersChange   = data?.usersChange ?? 0;
  const adoptionChange = data?.adoptionChange ?? 0;
  const dropOffChange = data?.dropOffChange ?? 0;
  const weeklyTrends  = data?.weeklyTrends ?? [];
  const heatmap       = data?.heatmap ?? [];

  // Compute SVG path + labels for usage trends
  const trendMax = Math.max(...weeklyTrends.map(t => t.events), 1);
  const trendPoints = weeklyTrends.map((t, i) => ({
    x: weeklyTrends.length > 1 ? (i / (weeklyTrends.length - 1)) * 100 : 50,
    yEvents: 100 - (t.events / trendMax) * 90,
    yUsers: 100 - (t.users / trendMax) * 90,
    label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    events: t.events,
    users: t.users,
  }));
  const buildPath = (points, key) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p[key]}`).join(' ');
  };

  // Y-axis labels for trend chart
  const yLabels = [trendMax, Math.round(trendMax * 0.75), Math.round(trendMax * 0.5), Math.round(trendMax * 0.25), 0];

  // Heatmap max for color scaling
  const heatmapMax = Math.max(...heatmap.flatMap(h => h.counts), 1);

  // X-axis labels: pick ~5 evenly spaced
  const xLabels = (() => {
    if (trendPoints.length <= 5) return trendPoints;
    const step = Math.floor((trendPoints.length - 1) / 4);
    const indices = [0, step, step * 2, step * 3, trendPoints.length - 1];
    return indices.map(i => trendPoints[i]);
  })();

  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans text-gray-900 overflow-hidden">
      
      {/* ──────── Sidebar ──────── */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 font-bold bg-[#00829B] rounded-[0.4rem] flex items-center justify-center shadow-sm">
                <span className="text-white text-[15px]">F</span>
              </div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight leading-none">FinSight</span>
            </div>
          </div>

          <div className="py-5 px-3 space-y-0.5">
            {[
              { name: 'Dashboard', active: true, href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
              { name: 'Feature Analytics', active: false, href: '/feature-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
              { name: 'Journey Analytics', active: false, href: '/journey-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
              { name: 'Customers / Segments', active: false, href: '/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { name: 'License Insights', active: false, href: '/license-insights', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { name: 'Predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
              { name: 'Events Explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
              { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
              { name: 'Journey Builder', active: false, href: '/journey-builder', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { name: 'Privacy & Compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { name: 'Audit Logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { name: 'Settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
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
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">AC</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate tracking-tight">Acme Corp</span>
              <span className="text-[12px] text-[#64748B] tracking-tight">Enterprise</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ──────── Main Content ──────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50">
              <span className="text-[14px] font-medium text-gray-800">Acme Corp</span>
              <div className="flex items-center pl-2 ml-2 border-l border-gray-200 space-x-2">
                <span className="text-[13px] text-gray-600">Production</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div className="max-w-[400px] w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3"/></svg>
              </div>
              <input type="text" className="w-full bg-[#f1f5f9] border border-transparent text-gray-900 text-[14px] rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#00829B] focus:bg-white placeholder:text-gray-400" placeholder="Search features, customers, events..." />
            </div>
          </div>
          <div className="flex items-center space-x-5">
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
            <div className="relative cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="absolute top-0 right-0 block h-[7px] w-[7px] rounded-full bg-red-500 ring-2 ring-white translate-x-0.5 -translate-y-0.5"></span>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer ml-2">
              <div className="w-8 h-8 rounded-full bg-[#00829B] flex items-center justify-center text-white font-semibold text-[13px]">JS</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        {/* ──────── Dashboard Body ──────── */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          <div className="mb-6">
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-[15px] mt-1 text-[#64748B]">Overview of your feature intelligence platform</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-60">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00829B]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
          ) : (
            <>
              {/* ── KPI Cards ── */}
              <div className="grid grid-cols-4 gap-5 mb-6">
                {[
                  { title: 'Total Events', value: formatNumber(totalEvents), change: eventsChange, iconBg: 'bg-[#F0F5FF]', iconColor: 'text-[#0052cc]', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8M4 12V4M12 12v8M12 12V4M20 12v8M20 12V4M8 16l4-4 4 4M8 8l4 4 4-4"/></svg> },
                  { title: 'Active Users', value: formatNumber(activeUsers), change: usersChange, iconBg: 'bg-[#F0F5FF]', iconColor: 'text-[#0052cc]', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                  { title: 'Feature Adoption Rate', value: `${adoptionRate}`, suffix: '%', change: adoptionChange, iconBg: 'bg-[#F0F5FF]', iconColor: 'text-[#0052cc]', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
                  { title: 'Drop-off Rate', value: `${dropOffRate}`, suffix: '%', change: dropOffChange, iconBg: 'bg-[#F8FAFC]', iconColor: 'text-[#475569]', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg> },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[14px] text-gray-500 font-medium leading-[1.2]">{card.title}</span>
                      <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>{card.icon}</div>
                    </div>
                    <div className="mb-3">
                      <h2 className="text-[32px] font-bold text-gray-900 leading-none">
                        {card.value}{card.suffix && <span className="text-[20px]">{card.suffix}</span>}
                      </h2>
                      <div className="flex items-center mt-3 text-[13px]">
                        <span className={`font-semibold flex items-center ${card.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {card.change >= 0 ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>
                          )}
                          {card.change >= 0 ? '+' : ''}{card.change}%
                        </span>
                        <span className="text-gray-400 ml-1.5">vs last period</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Charts Row ── */}
              <div className="grid grid-cols-2 gap-5 mb-16">
                
                {/* Usage Trends */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-6">Usage Trends</h3>

                  {weeklyTrends.length === 0 ? (
                    <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No trend data available yet.</div>
                  ) : (
                    <>
                      <div className="relative h-[280px] w-full flex items-end">
                        <div className="absolute left-0 inset-y-0 w-14 flex flex-col justify-between text-[11px] text-gray-400 text-right pr-2 select-none -translate-y-2">
                          {yLabels.map((v, i) => <span key={i}>{formatNumber(v)}</span>)}
                        </div>
                        <div className="relative flex-1 ml-[54px] h-[256px]">
                          <div className="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none">
                            {yLabels.map((_, i) => <div key={i} className={`w-full border-t ${i === yLabels.length - 1 ? 'border-gray-300' : 'border-dashed border-gray-200'}`}></div>)}
                          </div>
                          <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                            {/* Events line */}
                            <path d={buildPath(trendPoints, 'yEvents')} fill="none" stroke="#1e40af" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            {trendPoints.map((p, i) => <circle key={`e${i}`} cx={p.x} cy={p.yEvents} r="3" fill="#1e40af" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
                            {/* Users line */}
                            <path d={buildPath(trendPoints, 'yUsers')} fill="none" stroke="#14b8a6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            {trendPoints.map((p, i) => <circle key={`u${i}`} cx={p.x} cy={p.yUsers} r="3" fill="#14b8a6" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
                          </svg>
                        </div>
                      </div>
                      <div className="flex justify-between ml-[54px] mt-1 text-[11px] text-gray-500 select-none">
                        {xLabels.map((p, i) => <span key={i}>{p?.label}</span>)}
                      </div>
                    </>
                  )}

                  <div className="flex justify-center items-center space-x-6 mt-6">
                    <div className="flex items-center text-[13px] text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-[#1e40af] mr-2"></span> Events</div>
                    <div className="flex items-center text-[13px] text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] mr-2"></span> Users</div>
                  </div>
                </div>

                {/* Feature Usage Heatmap */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-6">Feature Usage Heatmap</h3>

                  <div className="flex items-center mb-6 text-[12px] text-gray-500">
                    <span className="mr-2">Less</span>
                    {HEATMAP_COLORS.map((c, i) => <span key={i} className="w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: c }}></span>)}
                    <span>More</span>
                  </div>

                  {heatmap.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No heatmap data available yet.</div>
                  ) : (
                    <div className="flex w-full mt-2">
                      <div className="flex flex-col justify-end gap-3.5 mr-4 text-[13px] font-medium text-gray-800 w-[80px]">
                        {heatmap.map((h, i) => <div key={i} className="h-7 flex items-center truncate">{h.feature}</div>)}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex gap-2 mb-3 text-[12px] text-gray-500 select-none">
                          {DAYS.map((d, i) => <div key={i} className={`flex-1 text-center font-medium ${i >= 5 ? 'text-gray-400' : ''}`}>{d}</div>)}
                        </div>
                        {heatmap.map((row, ri) => (
                          <div key={ri} className="flex gap-2 mb-2">
                            {row.counts.map((c, ci) => (
                              <div key={ci} className="flex-1 rounded-[4px] h-7 transition-colors" style={{ backgroundColor: getHeatColor(c, heatmapMax) }}></div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

export default DashboardPage;
