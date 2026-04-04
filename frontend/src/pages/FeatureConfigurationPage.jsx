import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const FeatureConfigurationPage = () => {
  const navigate = useNavigate();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentFeature, setCurrentFeature] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [module, setModule] = useState('');

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      
      const res = await fetch('/api/v1/features?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
      
      const json = await res.json();
      if (json.success) {
        setFeatures(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/features/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        setFeatures(prev => prev.map(f => f._id === id ? { ...f, isActive: !currentStatus } : f));
      } else {
        alert(json.message || 'Error updating status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/features/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setFeatures(prev => prev.filter(f => f._id !== id));
      } else {
        alert(json.message || 'Error deleting feature');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setCode('');
    setModule('');
    setCurrentFeature(null);
    setIsModalOpen(true);
  };

  const openEditModal = (f) => {
    setModalMode('edit');
    setName(f.name);
    setCode(f.code);
    setModule(f.module || '');
    setCurrentFeature(f);
    setIsModalOpen(true);
  };

  const saveFeature = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' ? '/api/v1/features' : `/api/v1/features/${currentFeature._id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, code, module })
      });
      const json = await res.json();
      
      if (json.success) {
        setIsModalOpen(false);
        fetchFeatures(); // Reload list to get usage counts etc
      } else {
        alert(json.message || 'Error saving feature');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { name: 'Feature Analytics', href: '/feature-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { name: 'Journey Analytics', href: '/journey-analytics', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
    { name: 'Customers / Segments', href: '/customers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'License Insights', href: '/license-insights', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
    { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
    { name: 'Feature Configuration', href: '/feature-configuration', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Feature Configuration</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Manage and configure platform features</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-[#0f172a] hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-[14px] font-medium flex items-center space-x-2 shadow transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Create Feature</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-white">
              <h2 className="text-[15px] font-bold text-gray-900">All Features</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[13px] text-gray-700 bg-white">
                      <th className="font-semibold py-4 px-6">Feature Name</th>
                      <th className="font-semibold py-4 px-6">Code</th>
                      <th className="font-semibold py-4 px-6">Module</th>
                      <th className="font-semibold py-4 px-6">Usage</th>
                      <th className="font-semibold py-4 px-6">Status</th>
                      <th className="font-semibold py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {features.map((feature, idx) => (
                       <tr key={feature._id || idx} className="hover:bg-gray-50 transition-colors bg-white">
                         <td className="py-4 px-6 text-[14px] text-gray-900 font-medium">
                           {feature.name}
                         </td>
                         <td className="py-4 px-6">
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[12px] font-mono border border-gray-200">
                             {feature.code}
                           </span>
                         </td>
                         <td className="py-4 px-6">
                           {feature.module ? (
                             <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[12px] font-semibold">
                               {feature.module}
                             </span>
                           ) : <span className="text-gray-400">-</span>}
                         </td>
                         <td className="py-4 px-6 text-[14px] text-gray-700">
                           {feature.usage ? feature.usage.toLocaleString() : '0'}
                         </td>
                         <td className="py-4 px-6">
                           <button 
                             onClick={() => handleToggleStatus(feature._id, feature.isActive)}
                             className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#00829B] focus:ring-offset-2 ${feature.isActive ? 'bg-gray-900' : 'bg-gray-300'}`}
                             role="switch"
                             aria-checked={feature.isActive}
                           >
                             <span className="sr-only">Toggle status</span>
                             <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${feature.isActive ? 'translate-x-2' : '-translate-x-2'}`} />
                           </button>
                         </td>
                         <td className="py-4 px-6">
                           <div className="flex items-center space-x-3 justify-end pr-2">
                             <button onClick={() => openEditModal(feature)} className="text-gray-500 hover:text-gray-800 transition p-1">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                             </button>
                             <button onClick={() => handleDelete(feature._id)} className="text-red-400 hover:text-red-600 transition p-1">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                             </button>
                           </div>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-[17px] font-bold text-gray-900">{modalMode === 'create' ? 'Create Feature' : 'Edit Feature'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={saveFeature} className="p-6 flex-1 bg-white">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Feature Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 text-[14px] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B]" placeholder="e.g. User Authentication" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Code</label>
                  <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full border border-gray-200 text-[14px] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B] font-mono" placeholder="e.g. AUTH_001" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Module</label>
                  <input type="text" value={module} onChange={e => setModule(e.target.value)} className="w-full border border-gray-200 text-[14px] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00829B]" placeholder="e.g. AUTH" />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-[14px] font-medium shadow hover:bg-gray-800 transition">
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureConfigurationPage;
