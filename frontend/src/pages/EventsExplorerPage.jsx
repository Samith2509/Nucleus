import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const EventsExplorerPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [featureFilter, setFeatureFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); 
  const [filterOptions, setFilterOptions] = useState({ features: [], channels: [], eventTypes: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('https://nucleus-by-sheeroo.onrender.com/api/v1/events/filters', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setFilterOptions(json.data);
      } catch (err) {}
    };
    fetchSelectOptions();
  }, []);

  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = ['Timestamp', 'Feature', 'User ID', 'Channel', 'Event Type', 'Session ID', 'Metadata'];
    const rows = events.map(e => [
      formatDate(e.timestamp),
      e.feature || '',
      e.userId || '',
      e.channel || 'Unknown',
      e.eventType || 'UNKNOWN',
      e.sessionId || '',
      e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `events_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      // Build query string
      const params = new URLSearchParams();
      if (featureFilter) params.append('feature', featureFilter);
      if (channelFilter) params.append('channel', channelFilter);
      if (typeFilter) params.append('eventType', typeFilter);
      
      // Handle simple date filters
      if (dateFilter) {
         const now = new Date();
         let startDate;
         if (dateFilter === 'Today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
         } else if (dateFilter === 'Last 7 Days') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
         } else if (dateFilter === 'Last 30 Days') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
         }
         if (startDate) {
            params.append('startDate', startDate.toISOString());
         }
      }

      // API call to eventController -> router.get('/') which maps to /api/v1/events
      const res = await fetch(`https://nucleus-by-sheeroo.onrender.com/api/v1/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
      
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      } else {
        setError(json.message || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureFilter, channelFilter, typeFilter, dateFilter, navigate]);

  const getEventTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('error')) return 'bg-rose-100 text-rose-700';
    if (t.includes('viewed') || t === 'page_view') return 'bg-gray-100 text-gray-700';
    return 'bg-[#0f172a] text-white';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.getFullYear() + '-' + 
      String(d.getMonth() + 1).padStart(2, '0') + '-' + 
      String(d.getDate()).padStart(2, '0') + ' ' + 
      String(d.getHours()).padStart(2, '0') + ':' + 
      String(d.getMinutes()).padStart(2, '0') + ':' + 
      String(d.getSeconds()).padStart(2, '0');
  };

  const formatFeatureName = (code) => {
    if (!code) return '';
    return code.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { name: 'Feature Analytics', href: '/feature-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { name: 'Journey Analytics', href: '/journey-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
    { name: 'Customers / Segments', href: '/customers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'License Insights', href: '/license-insights', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
    { name: 'Events Explorer', href: '/events-explorer', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
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
          {/* Page Headers */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Events Explorer</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Explore and analyze raw event data</p>
            </div>
            <button onClick={handleExportCSV} className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-[14px] font-medium flex items-center space-x-2 shadow hover:bg-gray-800 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Events</span>
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 text-sm">{error}</div>}

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Feature</label>
                <div className="relative">
                  <select 
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-2 focus:ring-[#00829B] focus:outline-none pl-3 pr-10 py-2.5 cursor-pointer">
                    <option value="">All Features</option>
                    {filterOptions.features.map(f => (
                      <option key={f} value={f}>{formatFeatureName(f)}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Channel</label>
                <div className="relative">
                  <select 
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-2 focus:ring-[#00829B] focus:outline-none pl-3 pr-10 py-2.5 cursor-pointer">
                    <option value="">All Channels</option>
                    {filterOptions.channels.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Event Type</label>
                <div className="relative">
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-2 focus:ring-[#00829B] focus:outline-none pl-3 pr-10 py-2.5 cursor-pointer">
                    <option value="">All Types</option>
                    {filterOptions.eventTypes.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').toLowerCase()}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Date Range</label>
                <div className="relative">
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-2 focus:ring-[#00829B] focus:outline-none pl-3 pr-10 py-2.5 cursor-pointer">
                    <option value="">All Time</option>
                    <option value="Today">Today</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">Recent Events {events.length > 0 ? `(${events.length})` : ''}</h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[12px] font-semibold flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>Live</span>
              </span>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex justify-center text-gray-500 py-16 text-[14px]">
                No events found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-[13px] text-gray-600">
                      <th className="font-semibold py-4 px-6 whitespace-nowrap">Timestamp</th>
                      <th className="font-semibold py-4 px-6 whitespace-nowrap">Feature</th>
                      <th className="font-semibold py-4 px-6 whitespace-nowrap">User ID</th>
                      <th className="font-semibold py-4 px-6 whitespace-nowrap">Channel</th>
                      <th className="font-semibold py-4 px-6 whitespace-nowrap">Event Type</th>
                      <th className="font-semibold py-4 px-6 pr-8 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((ev, i) => (
                      <tr key={ev._id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-[13px] text-gray-900 font-mono whitespace-nowrap">
                          {formatDate(ev.timestamp)}
                        </td>
                        <td className="py-4 px-6 text-[14px] text-gray-800 font-medium">
                          {formatFeatureName(ev.feature)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[12px] font-mono">
                            {ev.userId}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {ev.channel ? (
                            <span className="border border-gray-200 text-gray-600 px-2.5 py-1 rounded text-[12px] font-semibold bg-white">
                              {ev.channel.charAt(0).toUpperCase() + ev.channel.slice(1).toLowerCase()}
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-400 px-2.5 py-1 rounded text-[12px] font-semibold">Unknown</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded text-[12px] font-semibold capitalize ${getEventTypeBadge(ev.eventType)}`}>
                            {(ev.eventType || 'unknown').replace('_', ' ').toLowerCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 pr-8 text-right">
                          <button onClick={() => setSelectedEvent(ev)} className="text-gray-500 hover:text-gray-900 text-[13px] font-medium flex items-center space-x-1.5 ml-auto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900">Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-[13px] font-mono overflow-x-auto">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsExplorerPage;
