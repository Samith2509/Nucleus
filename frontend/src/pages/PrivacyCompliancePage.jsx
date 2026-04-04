import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const PrivacyCompliancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [settings, setSettings] = useState({
    telemetryEnabled: true,
    anonymizeUserData: true,
    gdprComplianceMode: false,
    piiMasking: {
      email: true,
      phone: true,
      ip: false,
      fullName: false,
      physicalAddress: true
    },
    dataRetention: {
      eventData: '90 days',
      aggregatedAnalytics: '2 years',
      auditLogs: '7 years'
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      
      const res = await fetch('/api/v1/consent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return navigate('/login');

      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          telemetryEnabled: data.data.telemetryEnabled ?? true,
          anonymizeUserData: data.data.anonymizeUserData ?? true,
          gdprComplianceMode: data.data.gdprComplianceMode ?? false,
          piiMasking: data.data.piiMasking || { email: true, phone: true, ip: false, fullName: false, physicalAddress: true },
          dataRetention: data.data.dataRetention || { eventData: '90 days', aggregatedAnalytics: '2 years', auditLogs: '7 years' }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Settings saved successfully!');
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.message || 'Error saving settings');
      }
    } catch (err) {
      setMsg('Network error');
    } finally {
      setSaving(false);
    }
  };

  const togglePii = (key) => setSettings({
    ...settings,
    piiMasking: { ...settings.piiMasking, [key]: !settings.piiMasking[key] }
  });

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
    { name: 'Privacy & Compliance', href: '/privacy-compliance', active: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { name: 'Audit Logs', href: '/audit-logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { name: 'Settings', href: '/settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div></div>;

  return (
    <div className="flex bg-[#F4F7FB] font-sans text-gray-900 h-screen overflow-hidden">
      {/* Sidebar */}
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

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         <TopHeader />

        <div className="flex-1 overflow-y-auto p-8 pb-32">
           <div className="max-w-[1024px] mx-auto">
             <div className="mb-6 flex justify-between items-end">
               <div>
                 <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Privacy & Compliance</h1>
                 <p className="text-[15px] mt-1 text-[#64748B]">Configure privacy settings and ensure regulatory compliance</p>
               </div>
               {msg && <span className="text-[#00829B] text-[13px] font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">{msg}</span>}
             </div>

             <div className="bg-[#f0f9ff] border border-blue-100 rounded-xl p-4 flex items-start space-x-3 mb-8">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[14px] text-blue-800 font-medium">Your platform is configured to comply with GDPR, CCPA, and enterprise data protection standards. Review and adjust settings as needed.</span>
             </div>

             {/* Telemetry Collection */}
             <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-[15px] font-bold text-gray-900">Telemetry Collection</h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                    <div>
                      <div className="text-[14px] font-bold text-gray-900 flex items-center">
                        <svg className="w-4 h-4 text-[#0052cc] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span>Enable Telemetry</span>
                      </div>
                      <div className="text-[13px] text-gray-500 mt-1">Collect feature usage data and analytics across your platform</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer shrink-0 ${settings.telemetryEnabled ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setSettings({...settings, telemetryEnabled: !settings.telemetryEnabled})}>
                       <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform transform ${settings.telemetryEnabled ? 'translate-x-[1.2rem]' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                    <div>
                      <div className="text-[14px] font-bold text-gray-900">Anonymize User Data</div>
                      <div className="text-[13px] text-gray-500 mt-1">Hash and anonymize personally identifiable information</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer shrink-0 ${settings.anonymizeUserData ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setSettings({...settings, anonymizeUserData: !settings.anonymizeUserData})}>
                       <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform transform ${settings.anonymizeUserData ? 'translate-x-[1.2rem]' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold text-gray-900">GDPR Compliance Mode</div>
                      <div className="text-[13px] text-gray-500 mt-1">Ensure all data collection follows GDPR requirements</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer shrink-0 ${settings.gdprComplianceMode ? 'bg-gray-900' : 'bg-gray-300'}`} onClick={() => setSettings({...settings, gdprComplianceMode: !settings.gdprComplianceMode})}>
                       <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform transform ${settings.gdprComplianceMode ? 'translate-x-[1.2rem]' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                </div>
             </div>

             {/* PII Masking Configuration */}
             <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-[15px] font-bold text-gray-900">PII Masking Configuration</h3>
                </div>
                <div className="p-6">
                   <p className="text-[13px] text-gray-600 mb-6">Select which fields should be masked or encrypted in telemetry data</p>
                   <div className="space-y-4">
                     
                     <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => togglePii('email')}>
                       <div className="flex items-start space-x-3">
                         <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${settings.piiMasking.email ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                            {settings.piiMasking.email && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Email Address</div>
                           <div className="text-[13px] text-gray-500">Mask email addresses in all telemetry events</div>
                         </div>
                       </div>
                       {settings.piiMasking.email && <span className="bg-green-50 text-green-700 font-mono text-[12px] px-2 py-0.5 rounded border border-green-100 tracking-wider">u***@e***</span>}
                     </div>

                     <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => togglePii('phone')}>
                       <div className="flex items-start space-x-3">
                         <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${settings.piiMasking.phone ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                            {settings.piiMasking.phone && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Phone Number</div>
                           <div className="text-[13px] text-gray-500">Mask phone numbers in all telemetry events</div>
                         </div>
                       </div>
                       {settings.piiMasking.phone && <span className="bg-green-50 text-green-700 font-mono text-[12px] px-2 py-0.5 rounded border border-green-100 tracking-wider">***-***-1234</span>}
                     </div>

                     <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => togglePii('ip')}>
                       <div className="flex items-start space-x-3">
                         <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${settings.piiMasking.ip ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                            {settings.piiMasking.ip && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">IP Address</div>
                           <div className="text-[13px] text-gray-500">Mask IP addresses in all telemetry events</div>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => togglePii('fullName')}>
                       <div className="flex items-start space-x-3">
                         <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${settings.piiMasking.fullName ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                            {settings.piiMasking.fullName && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Full Name</div>
                           <div className="text-[13px] text-gray-500">Mask user names in all telemetry events</div>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-100 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" onClick={() => togglePii('physicalAddress')}>
                       <div className="flex items-start space-x-3">
                         <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${settings.piiMasking.physicalAddress ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}>
                            {settings.piiMasking.physicalAddress && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                         </div>
                         <div>
                           <div className="text-[14px] font-bold text-gray-900">Physical Address</div>
                           <div className="text-[13px] text-gray-500">Mask physical addresses in all telemetry events</div>
                         </div>
                       </div>
                       {settings.piiMasking.physicalAddress && <span className="bg-green-50 text-green-700 font-mono text-[12px] px-2 py-0.5 rounded border border-green-100 tracking-wider">*** street, city</span>}
                     </div>

                   </div>
                </div>
             </div>

             {/* Data Retention */}
             <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-[15px] font-bold text-gray-900">Data Retention Policy</h3>
                </div>
                <div className="p-6 space-y-5">
                   <div className="flex items-center justify-between pb-5 border-b border-gray-50">
                     <div>
                       <div className="text-[14px] font-bold text-gray-900">Event Data Retention</div>
                       <div className="text-[13px] text-gray-500 mt-1">Raw event data is automatically deleted after {settings.dataRetention.eventData}</div>
                     </div>
                     <span className="text-[13px] font-bold text-[#0052cc] bg-[#F0F5FF] px-3 py-1 rounded-full">{settings.dataRetention.eventData}</span>
                   </div>
                   <div className="flex items-center justify-between pb-5 border-b border-gray-50">
                     <div>
                       <div className="text-[14px] font-bold text-gray-900">Aggregated Analytics</div>
                       <div className="text-[13px] text-gray-500 mt-1">Aggregated and anonymized analytics retained for {settings.dataRetention.aggregatedAnalytics}</div>
                     </div>
                     <span className="text-[13px] font-bold text-[#0052cc] bg-[#F0F5FF] px-3 py-1 rounded-full">{settings.dataRetention.aggregatedAnalytics}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="text-[14px] font-bold text-gray-900">Audit Logs</div>
                       <div className="text-[13px] text-gray-500 mt-1">Compliance and audit logs retained for {settings.dataRetention.auditLogs}</div>
                     </div>
                     <span className="text-[13px] font-bold text-[#0052cc] bg-[#F0F5FF] px-3 py-1 rounded-full">{settings.dataRetention.auditLogs}</span>
                   </div>
                </div>
             </div>

             {/* Certifications */}
             <div className="bg-[#f2fdf5] border border-green-200 rounded-xl p-6">
                <h3 className="text-[14px] font-bold text-green-900 mb-4">Compliance Certifications</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div className="text-[14px] font-bold text-gray-900">GDPR</div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase mt-0.5 tracking-wider">Compliant</div>
                  </div>
                  <div className="bg-white border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div className="text-[14px] font-bold text-gray-900">CCPA</div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase mt-0.5 tracking-wider">Compliant</div>
                  </div>
                  <div className="bg-white border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div className="text-[14px] font-bold text-gray-900">SOC 2</div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase mt-0.5 tracking-wider">Type II</div>
                  </div>
                  <div className="bg-white border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div className="text-[14px] font-bold text-gray-900">ISO 27001</div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase mt-0.5 tracking-wider">Certified</div>
                  </div>
                </div>
             </div>

           </div>
        </div>

        {/* Floating Action Button strictly placed at bottom right wrapper */}
        <div className="absolute bottom-0 right-0 left-0 bg-white border-t border-gray-200 px-8 py-4 flex justify-end">
           <button 
             onClick={saveSettings} 
             disabled={saving}
             className="bg-[#0f172a] text-white px-5 py-2.5 rounded-lg text-[14px] font-medium flex items-center space-x-2 shadow hover:bg-gray-800 transition disabled:opacity-50">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
             <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
           </button>
        </div>
      </main>
    </div>
  );
};

export default PrivacyCompliancePage;
