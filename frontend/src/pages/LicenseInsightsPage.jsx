import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
const HBarChart = ({ usedCount, unusedCount, total }) => {
  const usedPct = total > 0 ? (usedCount / total) * 100 : 0;
  const unusedPct = total > 0 ? (unusedCount / total) * 100 : 0;
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount }, (_, i) => Math.round((i / (gridCount - 1)) * total));

  return (
    <div className="pt-2 pb-6">
      {/* Bars area */}
      <div className="relative pl-16 pr-4 space-y-5">

        {/* Used bar */}
        <div className="relative flex items-center">
          <span className="absolute -left-16 w-16 text-right text-[12px] font-semibold text-gray-500 pr-3">Used</span>
          <div className="flex-1 bg-gray-100 rounded-sm h-12 relative overflow-visible">
            <div
              className="h-full bg-[#1e3a8a] rounded-sm transition-all duration-700 flex items-center group relative"
              style={{ width: `${Math.max(usedPct, 2)}%` }}
            >
              {/* Inline count label at end of bar */}
              <span className="absolute -right-1 translate-x-full pl-2 text-[13px] font-bold text-gray-700 whitespace-nowrap">
                {usedCount}
              </span>
              {/* Hover tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Used · count : {usedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Unused bar */}
        <div className="relative flex items-center">
          <span className="absolute -left-16 w-16 text-right text-[12px] font-semibold text-gray-500 pr-3">Unused</span>
          <div className="flex-1 bg-gray-100 rounded-sm h-12 relative overflow-visible">
            <div
              className="h-full bg-[#dc2626] rounded-sm transition-all duration-700 flex items-center group relative"
              style={{ width: `${Math.max(unusedPct, 2)}%` }}
            >
              {/* Inline count label at end of bar */}
              <span className="absolute -right-1 translate-x-full pl-2 text-[13px] font-bold text-gray-700 whitespace-nowrap">
                {unusedCount}
              </span>
              {/* Hover tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Unused · count : {unusedCount}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* X-Axis */}
      <div className="relative pl-16 pr-4 mt-2">
        <div className="flex justify-between">
          {gridLines.map((v, i) => (
            <span key={i} className="text-[11px] text-gray-400">{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const LicenseInsightsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const res = await fetch('/api/v1/analytics/license-insights', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) { navigate('/login'); return; }

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleExport = () => {
    if (!data) return;
    const now = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    const rows = [];

    // Summary section
    rows.push(['=== License vs Usage Insights Report ===']);
    rows.push([`Generated: ${new Date().toLocaleString()}`]);
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Licensed Features', data.totalFeatures]);
    rows.push(['Used Features', data.usedCount]);
    rows.push(['Unused Features', data.unusedCount]);
    rows.push(['Underutilized Features', data.underutilizedCount]);
    rows.push(['Overall Utilization Rate', `${data.utilizationRate}%`]);
    rows.push([]);

    // Unused features
    rows.push(['UNUSED FEATURES']);
    rows.push(['Feature Name', 'Code', 'Status', 'Recommendation']);
    if (data.unusedFeatures.length === 0) {
      rows.push(['No unused features', '', '', '']);
    } else {
      data.unusedFeatures.forEach(f => {
        rows.push([f.name, f.code, 'Unused', f.recommendation]);
      });
    }
    rows.push([]);

    // Underutilized features
    rows.push(['UNDERUTILIZED FEATURES']);
    rows.push(['Feature Name', 'Code', 'Usage Count', 'Adoption %', 'Status', 'Recommendation']);
    if (data.underutilizedFeatures.length === 0) {
      rows.push(['No underutilized features', '', '', '', '', '']);
    } else {
      data.underutilizedFeatures.forEach(f => {
        rows.push([f.name, f.code, f.usageCount, `${f.adoptionPct}%`, 'Underutilized', f.recommendation]);
      });
    }
    rows.push([]);

    // Well-utilized features
    rows.push(['WELL-UTILIZED FEATURES']);
    rows.push(['Feature Name', 'Code', 'Usage Count', 'Adoption %', 'Status']);
    if (data.wellUtilizedFeatures.length === 0) {
      rows.push(['No well-utilized features', '', '', '', '']);
    } else {
      data.wellUtilizedFeatures.forEach(f => {
        rows.push([f.name, f.code, f.usageCount, `${f.adoptionPct}%`, 'Healthy']);
      });
    }

    // Convert rows to CSV string
    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `license-insights-report-${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { name: 'Feature Analytics', href: '/feature-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { name: 'Journey Analytics', href: '/journey-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
    { name: 'Customers / Segments', href: '/customers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'License Insights', href: '/license-insights', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
    { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
    { name: 'Journey Builder', href: '/journey-builder', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { name: 'Privacy & Compliance', href: '/privacy-compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { name: 'Audit Logs', href: '/audit-logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { name: 'Settings', href: '/settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ];

  return (
    <div className="flex bg-[#F4F7FB] font-sans text-gray-900" style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 h-full">
        <div className="overflow-hidden flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#00829B] rounded-[0.4rem] flex items-center justify-center shadow-sm">
                <span className="text-white text-[15px] font-bold">F</span>
              </div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight">FinSight</span>
            </div>
          </div>
          <div className="py-5 px-3 space-y-0.5 overflow-y-auto flex-1">
            {sidebarItems.map((item, idx) => (
              <a
                key={idx}
                href={item.href || '#'}
                onClick={item.href ? (e) => { e.preventDefault(); navigate(item.href); } : undefined}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${item.active ? 'bg-[#F0F5FF] text-[#0052cc]' : 'text-[#475569] hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className={item.active ? 'text-[#0052cc]' : 'text-[#64748B]'}>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 shadow-sm">
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">{localStorage.getItem('tenantName')?.substring(0, 2).toUpperCase() || 'AC'}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate">{localStorage.getItem('tenantName') || 'Acme Corp'}</span>
              <span className="text-[12px] text-[#64748B]">{localStorage.getItem('tenantPlan') || 'Enterprise'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Navbar */}
        <TopHeader />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">License vs Usage Insights</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Monitor feature license utilization and identify optimization opportunities</p>
            </div>
            <button
              onClick={handleExport}
              disabled={!data}
              className="flex items-center space-x-2 px-4 py-2 bg-[#0f172a] text-white rounded-lg text-[14px] font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Report</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">{error}</div>
          ) : data ? (
            <>
              {/* ── 4 Stat Cards ── */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Licensed Features</p>
                      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{data.totalFeatures}</p>
                      <p className="text-[12px] text-gray-400 mt-1">Total available features</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Used Features</p>
                      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{data.usedCount}</p>
                      <p className="text-[12px] text-gray-400 mt-1">{data.utilizationRate}% utilization</p>
                    </div>
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Unused Features</p>
                      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{data.unusedCount}</p>
                      <p className="text-[12px] text-gray-400 mt-1">Potential cost savings</p>
                    </div>
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Underutilized</p>
                      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{data.underutilizedCount}</p>
                      <p className="text-[12px] text-gray-400 mt-1">&lt;50% adoption rate</p>
                    </div>
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top row: chart + recommendations */}
              <div className="grid grid-cols-2 gap-6 mb-6">

                {/* License Utilization chart */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-[15px] font-bold text-gray-900 mb-5">License Utilization</h2>
                  <HBarChart
                    usedCount={data.usedCount}
                    unusedCount={data.unusedCount}
                    total={data.totalFeatures}
                  />
                  {/* Utilization bar */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[13px] text-gray-600 font-medium">Overall Utilization</span>
                      <span className="text-[14px] font-bold text-gray-900">{data.utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${data.utilizationRate}%`,
                          background: data.utilizationRate >= 70 ? '#059669' : data.utilizationRate >= 40 ? '#f59e0b' : '#dc2626'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-[15px] font-bold text-gray-900 mb-4">Recommendations</h2>
                  <div className="space-y-3">
                    {data.unusedCount > 0 && (
                      <div className="flex items-start space-x-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                        <svg className="text-red-500 mt-0.5 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                        <div>
                          <p className="text-[13px] font-bold text-red-700">High Unused License Count</p>
                          <p className="text-[12px] text-red-600 mt-0.5">{data.unusedCount} licensed feature{data.unusedCount > 1 ? 's are' : ' is'} completely unused. Consider reviewing license allocation or promoting these features to customers.</p>
                        </div>
                      </div>
                    )}
                    {data.underutilizedCount > 0 && (
                      <div className="flex items-start space-x-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <svg className="text-amber-500 mt-0.5 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                        <div>
                          <p className="text-[13px] font-bold text-amber-700">Underutilized Features</p>
                          <p className="text-[12px] text-amber-600 mt-0.5">{data.underutilizedCount} feature{data.underutilizedCount > 1 ? 's have' : ' has'} adoption rates below 50%. Create educational content or training materials to boost usage.</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3 p-3.5 bg-green-50 border border-green-100 rounded-xl">
                      <svg className="text-green-500 mt-0.5 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <div>
                        <p className="text-[13px] font-bold text-green-700">Optimization Opportunity</p>
                        <p className="text-[12px] text-green-600 mt-0.5">Current utilization rate of {data.utilizationRate}% is {data.utilizationRate >= 70 ? 'good' : 'low'}. Focus on increasing adoption of underutilized features for maximum ROI.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                      <svg className="text-blue-500 mt-0.5 shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                      <div>
                        <p className="text-[13px] font-bold text-blue-700">Cross-Sell Potential</p>
                        <p className="text-[12px] text-blue-600 mt-0.5">Customers using high-adoption features may benefit from related unused features. Target them with personalized campaigns.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unused Features Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-gray-900">
                    Unused Features <span className="text-gray-400 font-medium">({data.unusedFeatures.length})</span>
                  </h2>
                  {data.unusedFeatures.length > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">Action Required</span>
                  )}
                </div>
                {data.unusedFeatures.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">
                    <svg className="w-10 h-10 mx-auto mb-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    All features are in use.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3">Feature Name</th>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Last Usage</th>
                        <th className="px-6 py-3">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.unusedFeatures.map(f => (
                        <tr key={f.code} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-6 py-4 text-[14px] font-semibold text-gray-900">{f.name}</td>
                          <td className="px-6 py-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[12px] font-mono border border-gray-200">{f.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-red-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">Unused</span>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-gray-500">Never used</td>
                          <td className="px-6 py-4 text-[13px] text-gray-500">{f.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Underutilized Features Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-gray-900">
                    Underutilized Features <span className="text-gray-400 font-medium">({data.underutilizedFeatures.length})</span>
                  </h2>
                  {data.underutilizedFeatures.length > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">Needs Attention</span>
                  )}
                </div>
                {data.underutilizedFeatures.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">
                    <svg className="w-10 h-10 mx-auto mb-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    No underutilized features.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3">Feature Name</th>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3 text-right">Usage</th>
                        <th className="px-6 py-3 text-right">Adoption</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.underutilizedFeatures.map(f => (
                        <tr key={f.code} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-6 py-4 text-[14px] font-semibold text-gray-900">{f.name}</td>
                          <td className="px-6 py-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[12px] font-mono border border-gray-200">{f.code}</span>
                          </td>
                          <td className="px-6 py-4 text-[14px] font-medium text-gray-900 text-right">{f.usageCount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-[14px] font-medium text-amber-600 text-right">{f.adoptionPct}%</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">Underutilized</span>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-gray-500">{f.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Well-utilized Features */}
              {data.wellUtilizedFeatures.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[15px] font-bold text-gray-900">
                      Well-Utilized Features <span className="text-gray-400 font-medium">({data.wellUtilizedFeatures.length})</span>
                    </h2>
                    <span className="bg-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">Healthy</span>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3">Feature Name</th>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3 text-right">Usage</th>
                        <th className="px-6 py-3 text-right">Adoption</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.wellUtilizedFeatures.map(f => (
                        <tr key={f.code} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-6 py-4 text-[14px] font-semibold text-gray-900">{f.name}</td>
                          <td className="px-6 py-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[12px] font-mono border border-gray-200">{f.code}</span>
                          </td>
                          <td className="px-6 py-4 text-[14px] font-medium text-gray-900 text-right">{f.usageCount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-[14px] font-medium text-green-600 text-right">{f.adoptionPct}%</td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">Healthy</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default LicenseInsightsPage;
