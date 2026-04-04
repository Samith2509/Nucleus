import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──
const formatNum = (n) => {
  if (n == null) return '-';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
};

const JourneyAnalyticsPage = () => {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState('');
  const [funnelData, setFunnelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch Journeys ──
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchJourneys = async () => {
      try {
        const res = await fetch('/api/v1/journeys', { headers });
        if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setJourneys(json.data);
          setSelectedJourneyId(json.data[0]._id);
        } else {
          setError('No journeys found. Please create one first.');
          setLoading(false);
        }
      } catch (e) {
        setError('Unable to fetch journeys.');
        setLoading(false);
      }
    };
    fetchJourneys();
  }, [navigate]);

  // ── Fetch Funnel Data ──
  useEffect(() => {
    if (!selectedJourneyId) return;
    const fetchFunnel = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/analytics/funnel?journeyId=${selectedJourneyId}`, { headers });
        const json = await res.json();
        if (json.success) {
          setFunnelData(json.data);
          setError('');
        } else {
          setError(json.message);
        }
      } catch (e) {
        setError('Unable to load funnel data.');
      } finally {
        setLoading(false);
      }
    };
    fetchFunnel();
  }, [selectedJourneyId]);

  // ── Computed Metrics ──
  const getMetrics = () => {
    if (!funnelData || funnelData.length === 0) return { start: 0, end: 0, conv: 0, enriched: [] };
    
    // Sort by stepOrder explicitly to be safe
    const sorted = [...funnelData].sort((a, b) => a.stepOrder - b.stepOrder);
    const start = sorted[0].uniqueUsers;
    const end = sorted[sorted.length - 1].uniqueUsers;
    const conv = start > 0 ? ((end / start) * 100).toFixed(1) : 0;

    const enriched = sorted.map((step, i) => {
      const usersEntering = step.uniqueUsers;
      const nextUsers = i < sorted.length - 1 ? sorted[i + 1].uniqueUsers : null;
      const usersExiting = nextUsers !== null ? usersEntering - nextUsers : 0;
      
      const dropOffRate = usersEntering > 0 ? (usersExiting / usersEntering) * 100 : 0;
      const stepConversion = 100 - dropOffRate;
      
      const overallPercent = start > 0 ? (usersEntering / start) * 100 : 0;

      let perf = 'Excellent';
      let perfBg = 'bg-emerald-100 text-emerald-700';
      if (i < sorted.length - 1) {
        if (stepConversion >= 90) {
          perf = 'Good';
          perfBg = 'bg-orange-100 text-orange-700'; // Match the yellow-orange
        } else {
          perf = 'Needs Attention';
          perfBg = 'bg-red-100 text-red-700';
        }
      }

      return {
        ...step,
        usersEntering,
        usersExiting: i === sorted.length - 1 ? null : usersExiting,
        dropOffRate,
        stepConversion,
        overallPercent,
        perf,
        perfBg,
        isLast: i === sorted.length - 1
      };
    });

    return { start, end, conv, enriched };
  };

  const { start, end, conv, enriched } = getMetrics();

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
              { name: 'Feature Analytics', active: false, href: '/feature-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
              { name: 'Journey Analytics', active: true, href: '/journey-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
              { name: 'Customers / Segments', active: false, href: '/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { name: 'License Insights', active: false, href: '/license-insights', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
              { name: 'Events Explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
              { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
              { name: 'Journey Builder', active: false, href: '/journey-builder', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              { name: 'Privacy & Compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { name: 'Audit Logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
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

      {/* ──── Main ──── */}
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
            <div className="relative cursor-pointer text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="absolute top-0 right-0 block h-[7px] w-[7px] rounded-full bg-red-500 ring-2 ring-white translate-x-0.5 -translate-y-0.5"></span>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer ml-2">
              <div className="w-8 h-8 rounded-full bg-[#00829B] flex items-center justify-center text-white font-semibold text-[13px]">JS</div>
            </div>
          </div>
        </header>

        {/* ──── Page Content ──── */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Journey Analytics</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Visualize and analyze user journeys and conversion funnels</p>
            </div>
            {journeys.length > 0 && (
              <div className="flex flex-col">
                <select 
                  value={selectedJourneyId} 
                  onChange={(e) => setSelectedJourneyId(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-[14px] text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#00829B] shadow-sm cursor-pointer"
                >
                  {journeys.map((j) => (
                    <option key={j._id} value={j._id}>{j.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00829B]"></div></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
          ) : funnelData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              No steps defined for this journey. Please construct the journey using the Journey Builder.
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <p className="text-[13px] text-gray-500 font-medium mb-2 uppercase tracking-wide">Starting Users</p>
                  <p className="text-[32px] font-extrabold text-gray-900">{formatNum(start)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <p className="text-[13px] text-gray-500 font-medium mb-2 uppercase tracking-wide">Completed Journey</p>
                  <p className="text-[32px] font-extrabold text-gray-900">{formatNum(end)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <p className="text-[13px] text-gray-500 font-medium mb-2 uppercase tracking-wide">Overall Conversion</p>
                  <p className="text-[32px] font-extrabold text-emerald-600">{conv}%</p>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-8">Conversion Funnel</h2>
                <div className="space-y-8">
                  {enriched.map((step, idx) => (
                    <div key={step.stepOrder} className="relative">
                      <div className="flex justify-between text-[14px] mb-2 font-medium">
                        <span className="text-gray-900" style={{ paddingLeft: '50px' }}>{step.stepName}</span>
                        <div className="flex space-x-4 items-center">
                          <span className="text-gray-500">{formatNum(step.usersEntering)} users</span>
                          {step.dropOffRate > 0 && !step.isLast && (
                            <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-100">
                              {step.dropOffRate.toFixed(0)}% drop-off
                            </span>
                          )}
                          {step.isLast && step.usersExiting === null && (
                            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100">
                              {step.dropOffRate.toFixed(0)}% drop-off
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white font-bold text-[14px] shadow-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div className="w-full bg-[#f1f5f9] h-10 rounded-r-lg rounded-l-sm overflow-hidden flex items-center relative">
                          <div 
                            className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#14b8a6] transition-all duration-1000 ease-in-out flex items-center justify-end pr-4"
                            style={{ width: `${step.overallPercent}%` }}
                          >
                            <span className="text-white text-[12px] font-semibold drop-shadow-sm">{step.overallPercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      {!step.isLast && (
                        <div className="absolute -bottom-6 left-12 flex justify-center w-full max-w-[calc(100%-3rem)] text-gray-400">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7"/><path d="M5 12h14"/></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-wise Analysis */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-12">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-[16px] font-semibold text-gray-900">Step-wise Analysis</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-[12px] text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold w-1/4">Step</th>
                        <th className="px-6 py-4 font-semibold text-right">Users Entering</th>
                        <th className="px-6 py-4 font-semibold text-right">Users Exiting</th>
                        <th className="px-6 py-4 font-semibold text-right">Drop-off Rate</th>
                        <th className="px-6 py-4 font-semibold text-right">Step Conversion</th>
                        <th className="px-6 py-4 font-semibold text-center">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enriched.map((step) => (
                        <tr key={step.stepOrder} className="border-b border-gray-50 hover:bg-[#f8fafc] transition-colors">
                          <td className="px-6 py-4 text-[14px] font-semibold text-gray-900">{step.stepName}</td>
                          <td className="px-6 py-4 text-[14px] text-gray-700 font-medium text-right">{formatNum(step.usersEntering)}</td>
                          <td className="px-6 py-4 text-[14px] text-gray-700 font-medium text-right">{formatNum(step.usersExiting)}</td>
                          <td className="px-6 py-4 text-[14px] text-gray-700 font-medium text-right">{step.dropOffRate.toFixed(0)}%</td>
                          <td className="px-6 py-4 text-[14px] text-gray-700 font-medium text-right">{step.stepConversion.toFixed(0)}%</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${step.perfBg}`}>
                              {step.perf}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default JourneyAnalyticsPage;
