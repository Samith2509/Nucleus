import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // KPIs
  const [kpis, setKpis] = useState({ todayActions: 0, configChanges: 0, activeUsers: 0, criticalEvents: 0 });

  // Filters
  const [actionType, setActionType] = useState('');
  const [userId, setUserId] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [dateRange, setDateRange] = useState('Last 7 days');
  
  const [filterOptions, setFilterOptions] = useState({ actions: [], users: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      // Filters
      const params = new URLSearchParams();
      if (actionType && actionType !== 'All Actions') params.append('actionType', actionType);
      if (userId && userId !== 'All Users') params.append('userId', userId);
      if (dateRange && dateRange !== 'All Time') params.append('dateRange', dateRange);

      const [logsRes, filtersRes, kpisRes] = await Promise.all([
        fetch(`https://nucleus-by-sheeroo.onrender.com/api/v1/audit?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://nucleus-by-sheeroo.onrender.com/api/v1/audit/filters', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://nucleus-by-sheeroo.onrender.com/api/v1/audit/kpis', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (logsRes.status === 401) { navigate('/login'); return; }

      const [logsData, filtersData, kpisData] = await Promise.all([
        logsRes.json(), filtersRes.json(), kpisRes.json()
      ]);

      if (logsData.success) setLogs(logsData.data);
      if (filtersData.success) setFilterOptions(filtersData.data);
      if (kpisData.success) setKpis(kpisData.data);

    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, userId, dateRange, navigate]);

  const handleExport = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Action', 'User', 'Details'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.action,
      l.performedBy ? l.performedBy.email : 'System',
      formatLogDetails(l).replace(/"/g, '""')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionTypeBadge = (action) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (act.includes('FEATURE') || act.includes('CONFIG')) return 'bg-gray-100 text-gray-700 border-gray-200';
    if (act.includes('JOURNEY')) return 'bg-[#00829B] text-white border-transparent';
    if (act.includes('COMPLIANCE')) return 'bg-green-600 text-white border-transparent';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getActionTypeLabel = (action) => {
    const act = action.toUpperCase();
    if (act.includes('FEATURE') || act.includes('CONFIG')) return 'Configuration';
    if (act.includes('JOURNEY')) return 'Journey';
    if (act.includes('COMPLIANCE')) return 'Compliance';
    if (act.includes('USER') || act.includes('ROLE')) return 'Access';
    return 'System';
  };

  const formatActionName = (action) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const formatLogDetails = (log) => {
    if (!log.metadata) return 'No details provided';
    if (typeof log.metadata === 'string') return log.metadata;
    
    const m = log.metadata;
    const action = log.action.toUpperCase();

    if (action.includes('USER_ROLE')) return m.email ? `Updated user permissions for ${m.email}` : 'Updated user permissions';
    if (action.includes('CREATE_JOURNEY')) return m.name ? `Created new ${m.name} journey` : 'Created new journey';
    if (action.includes('ADD_JOURNEY_STEP')) return m.stepName || m.stepId ? `Added step to journey` : `Added structure to journey`;
    if (action.includes('COMPLIANCE')) return 'Updated PII masking configuration';
    if (action.includes('CREATE_FEATURE')) return m.name || m.code ? `Created new feature: ${m.name || m.code}` : 'Created new feature flag configuration';
    if (action.includes('UPDATE_FEATURE') || action.includes('FEATURE_CONFIG')) return m.code ? `Modified ${m.code} settings` : 'Modified system settings';
    if (action.includes('SET_CONSENT')) return m.tenant ? `Updated global consent for tenant` : 'Updated global consent settings';

    const keys = Object.keys(m);
    if (keys.length > 0) {
      if (m.name || m.title || m.code || m.id || m.journeyId) {
         return `Modified record: ${m.name || m.title || m.code || m.id || m.journeyId}`;
      }
      return `Updated fields: ${keys.join(', ')}`;
    }
    return 'System metadata logged';
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { name: 'Feature Analytics', href: '/feature-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { name: 'Journey Analytics', href: '/journey-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
    { name: 'Customers / Segments', href: '/customers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'License Insights', href: '/license-insights', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
    { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    { name: 'Feature Configuration', href: '/feature-configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Audit Logs</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Track and monitor all system activities</p>
            </div>
            <button onClick={handleExport} className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-[14px] font-medium flex items-center space-x-2 shadow hover:bg-gray-800 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Logs</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex space-x-4 shadow-sm items-center">
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Action Type</label>
              <div className="relative">
                <select value={actionType} onChange={e => setActionType(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B]">
                  <option value="All Actions">All Actions</option>
                  {filterOptions.actions.map(a => <option key={a} value={a}>{formatActionName(a)}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Date Range</label>
              <div className="relative">
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B]">
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">User</label>
              <div className="relative">
                <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B]">
                  <option value="All Users">All Users</option>
                  {filterOptions.users.map(u => <option key={u._id} value={u._id}>{u.email}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 text-[14px] font-medium mb-6">
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-full shadow-sm transition ${viewMode === 'table' ? 'bg-white text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Table View</button>
            <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-full shadow-sm transition ${viewMode === 'timeline' ? 'bg-white text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Timeline View</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-[15px] font-bold text-gray-900">Audit Log Entries {logs.length > 0 ? `(${logs.length})` : ''}</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div></div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : logs.length === 0 ? (
              <div className="flex justify-center text-gray-500 py-16 text-[14px]">No logs found in this system.</div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-200 text-[13px] text-gray-700">
                      <th className="font-semibold py-4 px-6">Timestamp</th>
                      <th className="font-semibold py-4 px-6">Action</th>
                      <th className="font-semibold py-4 px-6">User</th>
                      <th className="font-semibold py-4 px-6">Details</th>
                      <th className="font-semibold py-4 px-6 text-right pr-8">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors bg-white">
                        <td className="py-4 px-6 text-[13px] text-gray-600 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).getFullYear() + '-' +
                            String(new Date(log.timestamp).getMonth() + 1).padStart(2,'0') + '-' +
                            String(new Date(log.timestamp).getDate()).padStart(2,'0') + ' ' +
                            String(new Date(log.timestamp).getHours()).padStart(2,'0') + ':' +
                            String(new Date(log.timestamp).getMinutes()).padStart(2,'0') + ':' +
                            String(new Date(log.timestamp).getSeconds()).padStart(2,'0')
                          }
                        </td>
                        <td className="py-4 px-6 text-[14px] text-gray-900 font-medium">
                          {formatActionName(log.action)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                             <div className="w-6 h-6 rounded-full bg-[#00829B] text-white text-[11px] font-bold flex items-center justify-center shrink-0 uppercase">
                               {(log.performedBy ? log.performedBy.name || log.performedBy.email : 'S')[0]}
                             </div>
                             <span className="text-[13px] text-gray-700">{log.performedBy ? log.performedBy.email : 'System'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] text-gray-600 truncate max-w-[200px]">
                          {formatLogDetails(log)}
                        </td>
                        <td className="py-4 px-6 text-right pr-8">
                           <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${getActionTypeBadge(log.action)}`}>
                             {getActionTypeLabel(log.action)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8">
                <div className="text-[15px] font-bold text-gray-900 mb-6">Activity Timeline</div>
                <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4">
                  {logs.map((log) => (
                    <div key={log._id} className="relative pl-8">
                      <div className="absolute -left-[17px] top-1 h-8 w-8 rounded-full bg-[#1e3a8a] flex items-center justify-center ring-4 ring-white shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-5 shadow-sm bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-[15px] font-bold text-gray-900">{formatActionName(log.action)}</h3>
                          <span className="text-[12px] text-gray-400 font-mono">
                            {new Date(log.timestamp).getFullYear() + '-' +
                            String(new Date(log.timestamp).getMonth() + 1).padStart(2,'0') + '-' +
                            String(new Date(log.timestamp).getDate()).padStart(2,'0') + ' ' +
                            String(new Date(log.timestamp).getHours()).padStart(2,'0') + ':' +
                            String(new Date(log.timestamp).getMinutes()).padStart(2,'0') + ':' +
                            String(new Date(log.timestamp).getSeconds()).padStart(2,'0')}
                          </span>
                        </div>
                        <p className="text-[13px] text-gray-600 mb-4">{formatLogDetails(log)}</p>
                        <div className="flex items-center space-x-3">
                           <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 inline-flex">
                             <div className="w-5 h-5 rounded-full bg-[#00829B] text-white text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                               {(log.performedBy ? log.performedBy.name || log.performedBy.email : 'S')[0]}
                             </div>
                             <span className="text-[12px] text-gray-700 pr-1 truncate font-medium">{log.performedBy ? log.performedBy.email : 'System'}</span>
                           </div>
                           <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border inline-flex items-center ${getActionTypeBadge(log.action)}`}>
                             {getActionTypeLabel(log.action)}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[13px] font-medium text-gray-500">Today's Actions</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.todayActions}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[13px] font-medium text-gray-500">Config Changes</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.configChanges}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[13px] font-medium text-gray-500">Active Users</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.activeUsers}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[13px] font-medium text-gray-500">Critical Events</h3>
              <p className={`text-3xl font-bold mt-2 ${kpis.criticalEvents > 0 ? 'text-red-600' : 'text-red-500'}`}>{kpis.criticalEvents}</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AuditLogsPage;
