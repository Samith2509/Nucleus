import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatNum = (n) => {
  if (n == null) return '-';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
};

// ── Chart Helpers ──
const VBarChart = ({ data, maxVal }) => {
  return (
    <div className="relative h-full w-full flex items-end justify-between px-2 pt-6">
      {/* Grid lines */}
      <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-[28px] pt-6 z-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-dashed border-gray-200 w-full flex items-center relative">
            <span className="absolute -left-10 text-[11px] text-gray-400">
              {formatNum(Math.round(maxVal - (i * maxVal / 4)))}
            </span>
          </div>
        ))}
      </div>
      
      {/* Bars */}
      <div className="relative z-10 w-full h-[calc(100%-28px)] flex items-end justify-around pl-4">
        {data.map((d, i) => {
          const heightPct = maxVal > 0 ? (d.usage / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex flex-col items-center justify-end w-16 group h-full">
              <div 
                className="w-full bg-[#1e3a8a] rounded-t-sm transition-all duration-500 ease-in-out group-hover:bg-[#00829B]" 
                style={{ height: `${Math.max(heightPct, 1)}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity -mt-6 text-[11px] font-bold text-center text-[#1e3a8a]">
                  {formatNum(d.usage)}
                </div>
              </div>
              <span className="mt-2 text-[11px] font-medium text-gray-500 truncate w-full text-center px-1">
                {d.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LineChart = ({ trendData }) => {
  if (!trendData || trendData.length === 0) return <div className="text-gray-400 text-sm p-4">No data</div>;
  
  const keys = Object.keys(trendData[0]).filter(k => k !== 'name');
  if (keys.length === 0) return <div className="text-gray-400 text-sm p-4">Not enough data</div>;
  
  // Find global max to scale chart
  let max = 0;
  trendData.forEach(d => {
    keys.forEach(k => { if (d[k] > max) max = d[k]; });
  });
  // Min scale
  max = Math.max(max, 10);
  // Add 10% padding
  max = Math.ceil(max * 1.1);

  const getPoints = (key) => {
    return trendData.map((d, i) => {
      const x = (i / (trendData.length - 1)) * 100 || 50;
      const y = 100 - ((d[key] || 0) / max) * 100;
      return { x, y };
    });
  };

  const buildPath = (points) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const colors = ['#1e3a8a', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="relative flex-1 ml-6 mt-4 mb-8">
        {/* Y Axis Grid */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((pct, i) => (
            <div key={i} className={`w-full border-t ${pct === 0 ? 'border-gray-300' : 'border-dashed border-gray-200'} relative`}>
              <span className="absolute -left-8 -top-2 text-[10px] text-gray-400 w-6 text-right">
                {Math.round((pct / 100) * max)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Lines */}
        <svg className="absolute inset-0 h-full w-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
          {keys.map((key, kIndex) => {
            const points = getPoints(key);
            const color = colors[kIndex % colors.length];
            return (
              <React.Fragment key={key}>
                <path d={buildPath(points)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {points.map((p, i) => <circle key={`${key}-${i}`} cx={p.x} cy={p.y} r="3" fill={color} stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
              </React.Fragment>
            );
          })}
        </svg>

        {/* X Axis Labels */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[11px] text-gray-500 font-medium">
          {trendData.map((d, i) => <span key={i} style={{ transform: 'translateX(-50%)' }}>{d.name}</span>)}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center flex-wrap gap-4 mt-auto select-none">
        {keys.map((key, i) => (
          <div key={key} className="flex items-center text-[12px] font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }}></span>
            {key.split(' ')[0]} {/* Shorthand name */}
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomerDetailModal = ({ tenantId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/v1/analytics/customers/${tenantId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) setDetail(json.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchDetail();
  }, [tenantId]);

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-[100] p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
           <div>
             <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
             <p className="text-sm text-gray-500 mt-1">Deep dive into specific feature and user activity</p>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
             <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a] mb-4"></div>
               <p className="text-sm text-gray-500 font-medium">Loading deep analytics...</p>
             </div>
          ) : detail ? (
             <div className="space-y-8 animate-fade-in">
                {/* Header Stats */}
                <div className="grid grid-cols-3 gap-4">
                   <div className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
                     <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Company</p>
                     <p className="font-extrabold text-[#0f172a] text-lg">{detail.tenant.name}</p>
                   </div>
                   <div className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
                     <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Subscription Plan</p>
                     <p className="font-extrabold text-[#0f172a] text-lg">{detail.tenant.plan || <span className="text-gray-400 font-medium text-base italic">Not Set</span>}</p>
                   </div>
                   <div className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
                     <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Deployment</p>
                     <p className="font-extrabold text-[#0f172a] text-lg">{detail.tenant.deploymentType}</p>
                   </div>
                </div>
                
                {/* Feature Usage */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Top Features Used</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {detail.features && detail.features.length > 0 ? detail.features.map(f => (
                      <div key={f.name} className="flex justify-between items-center px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                          <span className="text-[14px] font-semibold text-gray-700">{f.name}</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#0f172a] bg-gray-100 px-2.5 py-1 rounded-md">{f.usage.toLocaleString()} pings</span>
                      </div>
                    )) : <div className="px-5 py-4 text-sm text-gray-500 text-center">No feature engagements yet</div>}
                  </div>
                </div>

                {/* Users List */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                    <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Top Users By Activity</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {detail.topUsers && detail.topUsers.length > 0 ? detail.topUsers.map(u => (
                      <div key={u.email} className="flex justify-between items-center px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-7 h-7 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[11px] font-bold text-gray-600">
                             {u.email.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-[14px] font-medium text-gray-700">{u.email}</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#64748B]">{u.usageCount.toLocaleString()} events</span>
                      </div>
                    )) : <div className="px-5 py-4 text-sm text-gray-500 text-center">No active users</div>}
                  </div>
                </div>
             </div>
          ) : (
             <p className="text-center text-gray-500 py-10">Failed to load details. The tenant may have been deleted.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerAnalyticsPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({ customers: [], trendData: [] });
  const [loading, setLoading] = useState(true);
  const [errorMSG, setErrorMSG] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [deployFilter, setDeployFilter] = useState('All');

  // Trigger effect to fetch
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setErrorMSG('');
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const query = new URLSearchParams();
        if (regionFilter && regionFilter !== 'All Regions') query.append('region', regionFilter);
        if (planFilter && planFilter !== 'All Plans') query.append('plan', planFilter);
        if (deployFilter && deployFilter !== 'All') query.append('deploymentType', deployFilter);

        const res = await fetch(`/api/v1/analytics/customers?${query.toString()}`, {
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
          setErrorMSG(json.message || 'Error fetching data');
        }
      } catch (err) {
        setErrorMSG('Network error unable to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [fetchTrigger, navigate]);

  const handleApplyFilters = () => {
    setFetchTrigger(prev => prev + 1);
  };

  const { customers, trendData } = data;
  const topBarData = customers.slice(0, 5);
  const barMax = topBarData.length > 0 ? Math.max(...topBarData.map(c => c.usage)) * 1.1 : 100;

  return (
    <div className="flex bg-[#F4F7FB] font-sans text-gray-900 overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
      
      {/* ──────── Sidebar ──────── */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 h-full">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 font-bold bg-[#00829B] rounded-[0.4rem] flex items-center justify-center shadow-sm">
                <span className="text-white text-[15px]">F</span>
              </div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight leading-none">FinSight</span>
            </div>
          </div>

          <div className="py-5 px-3 space-y-0.5 overflow-y-auto">
            {[
              { name: 'Dashboard', active: false, href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
              { name: 'Feature Analytics', active: false, href: '/feature-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
              { name: 'Journey Analytics', active: false, href: '/journey-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
              { name: 'Customers / Segments', active: true, href: '/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { name: 'License Insights', active: false, href: '/license-insights', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
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
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
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
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Customer & Segment Analytics</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Analyze customer behavior and segment performance</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#0f172a] text-white rounded-lg text-[14px] font-medium hover:bg-black transition-colors shadow-sm">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Report</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6 flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Region</label>
              <select 
                value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                className="w-full bg-[#f8fafc] border-none rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:ring-1 focus:ring-gray-300 outline-none"
              >
                <option value="All Regions">All Regions</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia Pacific">Asia Pacific</option>
                <option value="Latin America">Latin America</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Plan</label>
              <select 
                value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="w-full bg-[#f8fafc] border-none rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:ring-1 focus:ring-gray-300 outline-none"
              >
                <option value="All Plans">All Plans</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Professional">Professional</option>
                <option value="Starter">Starter</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Deployment</label>
              <select 
                value={deployFilter} onChange={e => setDeployFilter(e.target.value)}
                className="w-full bg-[#f8fafc] border-none rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:ring-1 focus:ring-gray-300 outline-none"
              >
                <option value="All">All</option>
                <option value="CLOUD">Cloud</option>
                <option value="ON_PREM">On-Prem</option>
              </select>
            </div>
            <div className="mt-5">
              <button 
                onClick={handleApplyFilters}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                <span>Apply Filters</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div></div>
          ) : errorMSG ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">{errorMSG}</div>
          ) : (
            <>
              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-[320px]">
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Usage Comparison</h3>
                  <div className="flex-1 min-h-0">
                    <VBarChart data={topBarData} maxVal={barMax} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-[320px]">
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Adoption Trend (Top Customers)</h3>
                  <div className="flex-1 min-h-0">
                    <LineChart trendData={trendData} />
                  </div>
                </div>
              </div>

              {/* Table Row */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-[15px] font-semibold text-gray-900">All Customers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-[12px] text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-4">Customer Name</th>
                        <th className="px-6 py-4">Region</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Deployment</th>
                        <th className="px-6 py-4 text-right">Usage</th>
                        <th className="px-6 py-4 text-right">Adoption %</th>
                        <th className="px-6 py-4">Health Score</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customers.map((c, i) => (
                        <tr key={c._id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900 text-[14px]">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-gray-700">{c.region}</td>
                          <td className="px-6 py-4 text-[14px]">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[12px] font-medium border border-gray-200">{c.plan}</span>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-gray-700">{c.deploymentType}</td>
                          <td className="px-6 py-4 text-[14px] text-gray-900 font-medium text-right">{c.usage.toLocaleString()}</td>
                          <td className="px-6 py-4 text-[14px] text-gray-900 font-medium text-right">{c.adoptionPercent}%</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wide
                              ${c.healthScore === 'Score: A' ? 'bg-[#059669] text-white' : ''}
                              ${c.healthScore === 'Score: B' ? 'bg-[#2563eb] text-white' : ''}
                              ${c.healthScore === 'Score: C' ? 'bg-[#d97706] text-white' : ''}
                            `}>
                              {c.healthScore}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setSelectedTenantId(c._id)} className="text-[13px] font-medium text-gray-500 hover:text-[#0052cc] transition-colors outline-none focus:ring-2 focus:ring-[#0052cc] focus:ring-offset-1 rounded-sm px-1 py-0.5">View Details</button>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-gray-400 text-sm">No customers found matching these filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 shadow-sm">
                  <h4 className="text-[15px] font-bold text-[#166534] mb-1">High Performers</h4>
                  <p className="text-[13px] text-[#15803d] leading-relaxed">
                    {customers.filter(c => c.healthScore === 'Score: A').length} customers with A-grade health scores showing excellent feature adoption and engagement.
                  </p>
                </div>
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 shadow-sm">
                  <h4 className="text-[15px] font-bold text-[#b45309] mb-1">At Risk</h4>
                  <p className="text-[13px] text-[#b45309] leading-relaxed">
                    {customers.filter(c => c.healthScore === 'Score: C').length} customers with declining usage trends. Consider proactive engagement.
                  </p>
                </div>
                <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-5 shadow-sm">
                  <h4 className="text-[15px] font-bold text-[#1e40af] mb-1">Growth Opportunity</h4>
                  <p className="text-[13px] text-[#1d4ed8] leading-relaxed">
                    On-premise customers showing 15% higher adoption than cloud deployments.
                  </p>
                </div>
              </div>

            </>
          )}

        </div>
      </main>

      {selectedTenantId && (
        <CustomerDetailModal 
          tenantId={selectedTenantId} 
          onClose={() => setSelectedTenantId(null)} 
        />
      )}
    </div>
  );
};

export default CustomerAnalyticsPage;
