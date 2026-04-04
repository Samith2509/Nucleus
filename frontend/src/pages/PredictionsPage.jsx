import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

// ── SVG Line Chart (Actual vs Predicted) ──────────────────────────────────────
const UsagePredictionChart = ({ trendData }) => {
  const [tooltip, setTooltip] = useState(null);
  if (!trendData || trendData.length === 0) return null;

  const W = 600, H = 220, PL = 55, PR = 20, PT = 20, PB = 40;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const allVals = trendData.flatMap(d => [d.actual, d.predicted].filter(v => v != null));
  const maxV = Math.max(...allVals, 1);
  const minV = 0;

  const toX = (i) => PL + (i / (trendData.length - 1)) * chartW;
  const toY = (v) => PT + chartH - ((v - minV) / (maxV - minV)) * chartH;

  const actualPoints = trendData.filter(d => d.actual != null);
  const predictedPoints = trendData.filter(d => d.predicted != null);
  // Connector: last actual → first predicted
  const lastActual = actualPoints[actualPoints.length - 1];
  const firstPredicted = predictedPoints[0];
  const lastActualIdx = trendData.indexOf(lastActual);
  const firstPredictedIdx = trendData.indexOf(firstPredicted);

  const buildPath = (pts, keyFn) =>
    pts.map((d, i) => {
      const idx = trendData.indexOf(d);
      return `${i === 0 ? 'M' : 'L'} ${toX(idx).toFixed(1)} ${toY(keyFn(d)).toFixed(1)}`;
    }).join(' ');

  const yGridLines = 5;
  const yStep = maxV / yGridLines;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: '400px' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {[...Array(yGridLines + 1)].map((_, i) => {
          const val = Math.round(yStep * i);
          const y = toY(val);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,3" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {trendData.map((d, i) => (
          <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">
            {d.month}
          </text>
        ))}

        {/* Connector line (dashed bridge) */}
        {lastActual && firstPredicted && (
          <line
            x1={toX(lastActualIdx)} y1={toY(lastActual.actual)}
            x2={toX(firstPredictedIdx)} y2={toY(firstPredicted.predicted)}
            stroke="#14b8a6" strokeWidth="2" strokeDasharray="6,4"
          />
        )}

        {/* Actual line */}
        {actualPoints.length > 1 && (
          <path d={buildPath(actualPoints, d => d.actual)} fill="none" stroke="#1e3a8a" strokeWidth="2.5" />
        )}

        {/* Predicted line (dashed) */}
        {predictedPoints.length > 1 && (
          <path d={buildPath(predictedPoints, d => d.predicted)} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeDasharray="8,4" />
        )}

        {/* Actual dots */}
        {actualPoints.map((d, idx) => {
          const i = trendData.indexOf(d);
          const cx = toX(i), cy = toY(d.actual);
          return (
            <circle
              key={`a-${idx}`} cx={cx} cy={cy} r="5"
              fill="#1e3a8a" stroke="#fff" strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: cx, y: cy, label: d.month, value: d.actual, type: 'Actual Usage' })}
            />
          );
        })}

        {/* Predicted dots */}
        {predictedPoints.map((d, idx) => {
          const i = trendData.indexOf(d);
          const cx = toX(i), cy = toY(d.predicted);
          return (
            <circle
              key={`p-${idx}`} cx={cx} cy={cy} r="5"
              fill="#14b8a6" stroke="#fff" strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: cx, y: cy, label: d.month, value: d.predicted, type: 'Predicted Usage' })}
            />
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tw = 160, th = 46, tx = Math.min(tooltip.x + 8, W - tw - 4), ty = Math.max(tooltip.y - th - 8, PT);
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
              <text x={tx + 10} y={ty + 16} fontSize="11" fontWeight="600" fill="#374151">{tooltip.label}</text>
              <text x={tx + 10} y={ty + 32} fontSize="11" fill="#6b7280">{tooltip.type}: {tooltip.value?.toLocaleString()}</text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center space-x-6 mt-2 justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-0.5 bg-[#1e3a8a]"></div>
          <span className="text-[12px] text-gray-500 font-medium">Actual Usage</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-0.5 bg-[#14b8a6] border-t-2 border-dashed border-[#14b8a6]" style={{ borderTop: '2px dashed #14b8a6', height: 0 }}></div>
          <span className="text-[12px] text-gray-500 font-medium">Predicted Usage</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PredictionsPage = () => {
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
        const res = await fetch('/api/v1/analytics/predictions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.message || 'Failed to fetch predictions');
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const riskColor = (risk) => {
    if (risk === 'High Risk') return { bg: 'bg-red-500', text: 'text-white' };
    if (risk === 'Medium Risk') return { bg: 'bg-amber-500', text: 'text-white' };
    return { bg: 'bg-green-500', text: 'text-white' };
  };

  const insightColor = (color) => {
    if (color === 'green') return { icon: '📈', border: 'border-green-100', bg: 'bg-green-50', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
    if (color === 'red')   return { icon: '⚠️', border: 'border-red-100',   bg: 'bg-red-50',   dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700' };
    return                        { icon: '🔄', border: 'border-blue-100',  bg: 'bg-blue-50',  dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700' };
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { name: 'Feature Analytics', href: '/feature-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { name: 'Journey Analytics', href: '/journey-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
    { name: 'Customers / Segments', href: '/customers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'License Insights', href: '/license-insights', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Predictions', href: '/predictions', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
    { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
    { name: 'Journey Builder', href: '/journey-builder', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { name: 'Privacy & Compliance', href: '/privacy-compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { name: 'Audit Logs', href: '/audit-logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { name: 'Settings', href: '/settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ];

  return (
    <div className="flex bg-[#F4F7FB] font-sans text-gray-900" style={{ height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#00829B] rounded-[0.4rem] flex items-center justify-center shadow-sm">
              <span className="text-white text-[15px] font-bold">F</span>
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">FinSight</span>
          </div>
        </div>
        <div className="py-5 px-3 space-y-0.5 overflow-y-auto flex-1">
          {sidebarItems.map((item, idx) => (
            <a key={idx} href={item.href || '#'}
              onClick={item.href ? (e) => { e.preventDefault(); navigate(item.href); } : undefined}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${item.active ? 'bg-[#F0F5FF] text-[#0052cc]' : 'text-[#475569] hover:bg-gray-50 hover:text-gray-900'}`}>
              <span className={item.active ? 'text-[#0052cc]' : 'text-[#64748B]'}>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center space-x-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 shadow-sm">
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">{localStorage.getItem('tenantName')?.substring(0, 2).toUpperCase() || 'AC'}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate">{localStorage.getItem('tenantName') || 'Acme Corp'}</span>
              <span className="text-[12px] text-[#64748B]">{localStorage.getItem('tenantPlan') || 'Enterprise'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Navbar */}
        <TopHeader />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">

          <div className="mb-6">
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Predictions & Insights</h1>
            <p className="text-[15px] mt-1 text-[#64748B]">AI-powered predictions and strategic recommendations</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div>
                <p className="text-sm text-gray-500">Generating predictions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">{error}</div>
          ) : data ? (
            <>
              {/* ── KPI Cards ── */}
              <div className="grid grid-cols-3 gap-5 mb-6">
                {/* Growth Trend */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Growth Trend</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      data.kpis.growthLevel === 'High' ? 'bg-green-100 text-green-700' : 
                      data.kpis.growthLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                      data.kpis.growthLevel === 'Declining' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {data.kpis.growthLevel}
                    </span>
                  </div>
                  <p className={`text-[36px] font-extrabold leading-none mb-1 ${data.kpis.growthPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.kpis.growthPct >= 0 ? '+' : ''}{data.kpis.growthPct}%
                  </p>
                  <p className="text-[13px] text-gray-400">Predicted growth over next quarter</p>
                </div>

                {/* Churn Risk */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Churn Risk</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${data.kpis.churnLevel === 'High' ? 'bg-red-100 text-red-700' : data.kpis.churnLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {data.kpis.churnLevel}
                    </span>
                  </div>
                  <p className="text-[36px] font-extrabold leading-none mb-1 text-amber-500">
                    {data.kpis.churnRisk}%
                  </p>
                  <p className="text-[13px] text-gray-400">Customers at risk of churning</p>
                </div>

                {/* Revenue Impact */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Revenue Impact</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${data.kpis.revenueLevel === 'Positive' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                      {data.kpis.revenueLevel}
                    </span>
                  </div>
                  <p className="text-[36px] font-extrabold leading-none mb-1 text-[#0f172a]">
                    ${(data.kpis.revenueImpact / 1000).toFixed(0)}K
                  </p>
                  <p className="text-[13px] text-gray-400">Projected additional revenue</p>
                </div>
              </div>

              {/* ── Usage Prediction Model ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-[15px] font-bold text-gray-900 mb-4">Usage Prediction Model</h2>
                <UsagePredictionChart trendData={data.usageTrend} />
              </div>

              {/* ── AI Powered Insights ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 bg-amber-100 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                      <path d="M9 18h6"/>
                      <path d="M10 22h4"/>
                    </svg>
                  </span>
                  <h2 className="text-[15px] font-bold text-gray-900">AI Powered Insights</h2>
                </div>
                <div className="space-y-3">
                  {data.insights.map((ins, i) => {
                    const c = insightColor(ins.color);
                    return (
                      <div key={i} className={`flex items-start justify-between p-4 rounded-xl border ${c.border} ${c.bg}`}>
                        <div className="flex items-start space-x-3">
                          <span className="text-[18px] mt-0.5">{c.icon}</span>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{ins.title}</p>
                            <p className="text-[13px] text-gray-500 mt-0.5">{ins.desc}</p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-4 ${c.badge}`}>{ins.type}</span>
                      </div>
                    );
                  })}
                  {data.insights.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No insights available yet. More data is needed.</p>
                  )}
                </div>
              </div>

              {/* ── Feature Adoption Forecast + Customer Health ── */}
              <div className="grid grid-cols-2 gap-6 mb-6">

                {/* Feature Adoption Forecast */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-[15px] font-bold text-gray-900 mb-4">Feature Adoption Forecast</h2>
                  <div className="space-y-4">
                    {data.featureForecast.map((f, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-semibold text-gray-700">{f.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[12px] font-bold ${f.trendPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {f.trendPct >= 0 ? '+' : ''}{f.trendPct}%
                            </span>
                            <span className="text-[12px] text-gray-400">{f.adoptionPct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${f.adoptionPct}%`,
                              background: f.trendPct < 0 ? '#f59e0b' : '#3b82f6'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {data.featureForecast.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No feature data available yet.</p>
                    )}
                  </div>
                </div>

                {/* Customer Health Predictions */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-[15px] font-bold text-gray-900 mb-4">Customer Health Predictions</h2>
                  <div className="space-y-3">
                    {data.customerHealth.map((c, i) => {
                      const rc = riskColor(c.risk);
                      const initials = c.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                      const avatarColors = ['#0f766e', '#1e3a8a', '#9333ea', '#dc2626', '#d97706'];
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0"
                              style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                              <p className="text-[12px] text-gray-400">{c.desc}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${rc.bg} ${rc.text}`}>
                            {c.risk}
                          </span>
                        </div>
                      );
                    })}
                    {data.customerHealth.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No customer data available yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Recommended Actions ── */}
              {data.recommendedActions && data.recommendedActions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-[18px]">🎯</span>
                    <h2 className="text-[15px] font-bold text-gray-900">Recommended Actions</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {data.recommendedActions.map((action, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] shrink-0 mt-2"></span>
                        <span className="text-[14px] text-gray-600 leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default PredictionsPage;
