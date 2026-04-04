import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [general, setGeneral] = useState({});
  const [deployment, setDeployment] = useState({});
  const [team, setTeam] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [integrations, setIntegrations] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      let endpoint = '';
      if (activeTab === 'General') endpoint = 'general';
      else if (activeTab === 'Deployment') endpoint = 'deployment';
      else if (activeTab === 'Team & Access') endpoint = 'team';
      else if (activeTab === 'Notifications') endpoint = 'notifications';
      else if (activeTab === 'Integrations') endpoint = 'integrations';

      if (!endpoint) return;

      const res = await fetch(`/api/v1/settings/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { navigate('/login'); return; }
      
      const resData = await res.json();
      if (resData.success) {
        if (activeTab === 'General') setGeneral(resData.data);
        else if (activeTab === 'Deployment') setDeployment(resData.data);
        else if (activeTab === 'Team & Access') setTeam(resData.data);
        else if (activeTab === 'Notifications') setNotifications(resData.data);
        else if (activeTab === 'Integrations') setIntegrations(resData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let payload = {};

      if (activeTab === 'General') { endpoint = 'general'; payload = general; }
      else if (activeTab === 'Notifications') { endpoint = 'notifications'; payload = notifications; }
      else if (activeTab === 'Integrations') { endpoint = 'integrations'; payload = integrations; }
      else { setSaving(false); return; } // Deployment and Team saving handled differently/not needed

      const res = await fetch(`/api/v1/settings/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      await res.json();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    const confirm = window.confirm("Are you sure you want to remove this user?");
    if (!confirm) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/settings/team/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch(err) {}
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
    { name: 'Settings', href: '/settings', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
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
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">AC</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate">Acme Corp</span>
              <span className="text-[12px] text-[#64748B]">Enterprise</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <TopHeader />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F4F7FB]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Settings</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Manage your account and platform configuration</p>
            </div>
            {(activeTab !== 'Team & Access' && activeTab !== 'Deployment') && (
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-[14px] font-medium flex items-center space-x-2 shadow hover:bg-gray-800 transition disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-3 mb-8">
            {['General', 'Deployment', 'Team & Access', 'Notifications', 'Integrations'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${activeTab === tab ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div></div>
          ) : (
            <div className="max-w-[1024px]">
              
              {/* General Tab */}
              {activeTab === 'General' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-[15px] font-bold text-gray-900 mb-6">Tenant Information</h3>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-2">
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Tenant Name</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00829B]" 
                           value={general.name || ''} onChange={e => setGeneral({...general, name: e.target.value})} />
                       </div>
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Tenant ID</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-500 cursor-not-allowed" 
                           value={general.id || ''} disabled />
                       </div>
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Industry</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00829B]" 
                           value={general.industry || ''} onChange={e => setGeneral({...general, industry: e.target.value})} />
                       </div>
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Timezone</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00829B]" 
                           value={general.timezone || ''} onChange={e => setGeneral({...general, timezone: e.target.value})} />
                       </div>
                       <div className="col-span-2">
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Company Website</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00829B]" 
                           value={general.website || ''} onChange={e => setGeneral({...general, website: e.target.value})} />
                       </div>
                     </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-[15px] font-bold text-gray-900 mb-6">Account Plan</h3>
                     <div className="bg-[#f0f9ff] border border-blue-100 rounded-xl p-5 mb-6 flex justify-between items-center">
                        <div>
                          <div className="text-[15px] font-bold text-gray-900 mb-1">{general.plan || 'Enterprise'} Plan</div>
                          <div className="text-[13px] text-gray-600">Unlimited features, users, and data retention</div>
                        </div>
                        <span className="bg-[#1e3a8a] text-white px-3 py-1 text-[12px] font-bold rounded-full">Active</span>
                     </div>
                     <div className="space-y-4 text-[13px] font-medium text-gray-600">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span>Features</span>
                          <span className="text-gray-900 font-bold">{general?.usage?.features} / Unlimited</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span>Team Members</span>
                          <span className="text-gray-900 font-bold">{general?.usage?.users} / Unlimited</span>
                        </div>
                        <div className="flex justify-between items-center pb-3">
                          <span>Monthly Events</span>
                          <span className="text-gray-900 font-bold">{(general?.usage?.events || 0).toLocaleString()} / Unlimited</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Deployment Tab */}
              {activeTab === 'Deployment' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-[15px] font-bold text-gray-900 mb-6">Deployment Configuration</h3>
                     
                     <label className="block text-[13px] font-semibold text-gray-700 mb-2">Deployment Type</label>
                     <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                        <div>
                          <div className="text-[14px] font-bold text-gray-900">{deployment.deploymentType === 'ON_PREM' ? 'On-Premise' : 'Cloud Deployment'}</div>
                          <div className="text-[13px] text-gray-500 mt-1">Managed by FinSight on AWS infrastructure</div>
                        </div>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 text-[12px] font-bold rounded-full">Active</span>
                     </div>

                     <div className="grid grid-cols-1 gap-6 mb-6">
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Environment</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 cursor-not-allowed" value={deployment.environment || ''} disabled />
                       </div>
                       <div>
                         <label className="block text-[13px] font-semibold text-gray-700 mb-2">Region</label>
                         <input type="text" className="w-full bg-[#f8fafc] border border-gray-100 rounded-lg px-4 py-2 text-[14px] text-gray-900 cursor-not-allowed" value={deployment.region || ''} disabled />
                       </div>
                     </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-[15px] font-bold text-gray-900 mb-2">API Endpoints</h3>
                     <p className="text-[13px] text-gray-500 mb-6">Use these endpoints for integration</p>
                     
                     <div className="space-y-4">
                       <div className="flex items-center justify-between py-3 border-b border-gray-100">
                         <span className="text-[14px] font-medium text-gray-600">REST API</span>
                         <span className="bg-[#0f172a] text-white px-3 py-1.5 rounded text-[13px] font-mono tracking-tight">{deployment.restApiUrl || ''}</span>
                       </div>
                       <div className="flex items-center justify-between py-3">
                         <span className="text-[14px] font-medium text-gray-600">WebSocket</span>
                         <span className="bg-[#0f172a] text-white px-3 py-1.5 rounded text-[13px] font-mono tracking-tight">{deployment.websocketUrl || ''}</span>
                       </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'Team & Access' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                       <h3 className="text-[15px] font-bold text-gray-900">Team Members</h3>
                       <button className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center space-x-2">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                         <span>Invite Member</span>
                       </button>
                     </div>
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-gray-100 text-[13px] text-gray-500">
                           <th className="font-semibold py-3 px-2">Name</th>
                           <th className="font-semibold py-3 px-2">Email</th>
                           <th className="font-semibold py-3 px-2">Role</th>
                           <th className="font-semibold py-3 px-2">Status</th>
                           <th className="font-semibold py-3 px-2"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                         {team.map(member => (
                           <tr key={member._id} className="hover:bg-gray-50/50">
                             <td className="py-4 px-2">
                               <div className="flex items-center space-x-3">
                                 <div className="w-8 h-8 rounded-full bg-[#00829B] text-white font-bold text-[12px] flex items-center justify-center">
                                    {(member.name || member.email)[0].toUpperCase()}
                                 </div>
                                 <span className="text-[14px] font-bold text-gray-900">{member.name || 'User'}</span>
                               </div>
                             </td>
                             <td className="py-4 px-2 text-[14px] text-gray-500">{member.email}</td>
                             <td className="py-4 px-2">
                               <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${member.role === 'ADMIN' ? 'bg-[#0f172a] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                 {member.role === 'ADMIN' ? 'Admin' : member.role === 'ANALYST' ? 'Editor' : 'Viewer'}
                               </span>
                             </td>
                             <td className="py-4 px-2">
                               <span className="text-green-500 text-[13px] font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-md">Active</span>
                             </td>
                             <td className="py-4 px-2 text-right">
                               <button onClick={() => deleteUser(member._id)} className="text-red-400 hover:text-red-600 border border-red-100 rounded p-1 hover:bg-red-50">
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-[15px] font-bold text-gray-900 mb-4">Role Permissions</h3>
                     <div className="space-y-4">
                       <div className="bg-[#f8fafc] border border-gray-100 p-4 rounded-xl flex justify-between">
                         <div className="w-1/3">
                           <div className="font-bold text-[14px] text-gray-900 mb-2">Admin</div>
                           <div className="text-[13px] text-gray-600 flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Full access</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Configure features</div>
                         </div>
                         <div className="w-1/3">
                           <div className="text-[13px] text-gray-600 flex items-center mt-6"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Manage users</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> View audit logs</div>
                         </div>
                       </div>
                       <div className="bg-[#f8fafc] border border-gray-100 p-4 rounded-xl flex justify-between">
                         <div className="w-1/3">
                           <div className="font-bold text-[14px] text-gray-900 mb-2">Editor</div>
                           <div className="text-[13px] text-gray-600 flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> View analytics</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Create journeys</div>
                         </div>
                         <div className="w-1/3">
                           <div className="text-[13px] text-gray-600 flex items-center mt-6"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Edit features</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Manage users</div>
                         </div>
                       </div>
                       <div className="bg-[#f8fafc] border border-gray-100 p-4 rounded-xl flex justify-between">
                         <div className="w-1/3">
                           <div className="font-bold text-[14px] text-gray-900 mb-2">Viewer</div>
                           <div className="text-[13px] text-gray-600 flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> View analytics</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Edit features</div>
                         </div>
                         <div className="w-1/3">
                           <div className="text-[13px] text-gray-600 flex items-center mt-6"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Export reports</div>
                           <div className="text-[13px] text-gray-600 flex items-center mt-1"><svg className="w-4 h-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Manage users</div>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'Notifications' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                   <h3 className="text-[15px] font-bold text-gray-900 mb-6">Notification Preferences</h3>
                   
                   <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                     <div>
                       <div className="text-[14px] font-bold text-gray-900">Email Notifications</div>
                       <div className="text-[13px] text-gray-500 mt-0.5">Receive alerts and updates via email</div>
                     </div>
                     <div className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${notifications.email ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${notifications.email ? 'translate-x-5' : 'translate-x-1'}`}></div>
                     </div>
                   </div>

                   <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                     <div>
                       <div className="text-[14px] font-bold text-gray-900">Slack Notifications</div>
                       <div className="text-[13px] text-gray-500 mt-0.5">Send alerts to your Slack workspace</div>
                     </div>
                     <div className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${notifications.slack ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setNotifications({...notifications, slack: !notifications.slack})}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${notifications.slack ? 'translate-x-5' : 'translate-x-1'}`}></div>
                     </div>
                   </div>

                   <h3 className="text-[14px] font-bold text-gray-900 mb-4">Alert Types</h3>
                   <div className="space-y-4">
                      {[
                        { key: 'highUsageAlerts', label: 'High usage alerts' },
                        { key: 'licenseThreshold', label: 'License threshold warnings' },
                        { key: 'churnRisk', label: 'Churn risk notifications' },
                        { key: 'weeklySummary', label: 'Weekly summary reports' }
                      ].map(alert => (
                        <div key={alert.key} className="flex items-center space-x-3">
                          <div className={`w-10 h-6 rounded-full flex items-center shrink-0 transition-colors cursor-pointer ${notifications[alert.key] ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setNotifications({...notifications, [alert.key]: !notifications[alert.key]})}>
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${notifications[alert.key] ? 'translate-x-5' : 'translate-x-1'}`}></div>
                          </div>
                          <span className="text-[14px] text-gray-700 font-medium">{alert.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'Integrations' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                   <h3 className="text-[15px] font-bold text-gray-900 mb-6">Connected Integrations</h3>
                   <div className="space-y-4">
                     
                     <div className="border border-gray-100 bg-[#f8fafc] rounded-xl p-4 flex justify-between items-center">
                       <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-[#611f69] text-white flex items-center justify-center font-bold text-[18px]">S</div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Slack</div>
                           <div className="text-[13px] text-gray-500">{integrations.slackConnected ? 'Connected to #finsight-alerts' : 'Connect to channels for alerts'}</div>
                         </div>
                       </div>
                       {integrations.slackConnected ? (
                         <span className="bg-green-500 text-white px-3 py-1 text-[12px] font-bold rounded-full">Active</span>
                       ) : (
                         <button onClick={() => setIntegrations({...integrations, slackConnected: true})} className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-gray-50">Connect</button>
                       )}
                     </div>

                     <div className="border border-gray-100 bg-white rounded-xl p-4 flex justify-between items-center">
                       <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-[#0052cc] text-white flex items-center justify-center font-bold text-[18px]">J</div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Jira</div>
                           <div className="text-[13px] text-gray-500">{integrations.jiraConnected ? 'Connected to Jira workspace' : 'Sync issues and tickets'}</div>
                         </div>
                       </div>
                       {integrations.jiraConnected ? (
                         <span className="bg-green-500 text-white px-3 py-1 text-[12px] font-bold rounded-full cursor-pointer hover:bg-green-600" onClick={() => setIntegrations({...integrations, jiraConnected: false})}>Active</span>
                       ) : (
                         <button onClick={() => setIntegrations({...integrations, jiraConnected: true})} className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-gray-50">Connect</button>
                       )}
                     </div>

                     <div className="border border-gray-100 bg-white rounded-xl p-4 flex justify-between items-center">
                       <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-lg bg-[#632ca6] text-white flex items-center justify-center font-bold text-[18px] bg-orange-600">D</div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Datadog</div>
                           <div className="text-[13px] text-gray-500">{integrations.datadogConnected ? 'Sending metrics actively' : 'Send metrics and logs'}</div>
                         </div>
                       </div>
                       {integrations.datadogConnected ? (
                         <span className="bg-green-500 text-white px-3 py-1 text-[12px] font-bold rounded-full cursor-pointer hover:bg-green-600" onClick={() => setIntegrations({...integrations, datadogConnected: false})}>Active</span>
                       ) : (
                         <button onClick={() => setIntegrations({...integrations, datadogConnected: true})} className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-gray-50">Connect</button>
                       )}
                     </div>

                   </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
