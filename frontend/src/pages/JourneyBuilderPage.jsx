import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const JourneyBuilderPage = () => {
  const navigate = useNavigate();

  const [features, setFeatures] = useState([]);
  const [journeyName, setJourneyName] = useState('Onboarding Journey');
  const [journeyType, setJourneyType] = useState('Onboarding');
  
  const [steps, setSteps] = useState([
    { id: Date.now(), stepName: 'Login', featureCode: '' },
    { id: Date.now() + 1, stepName: 'Profile Setup', featureCode: '' },
    { id: Date.now() + 2, stepName: 'Payment', featureCode: '' }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const res = await fetch('/api/v1/features', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setFeatures(json.data);
            
            // Auto map features if exact matches found just for convenience, 
            // but normally they would be empty until selected.
            // In the screenshot they are mapped: User Authentication, User Management, Payment Processing.
            if (json.data.length > 0) {
              setSteps(prev => prev.map((s, idx) => {
                if (idx === 0) return { ...s, featureCode: json.data.find(f => f.name.includes('Auth'))?.code || json.data[0].code };
                if (idx === 1) return { ...s, featureCode: json.data.find(f => f.name.includes('User'))?.code || json.data[0].code };
                if (idx === 2) return { ...s, featureCode: json.data.find(f => f.name.includes('Payment'))?.code || json.data[0].code };
                return s;
              }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load features", err);
      }
    };
    fetchFeatures();
  }, [navigate]);

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now(), stepName: '', featureCode: features[0]?.code || '' }]);
  };

  const handleRemoveStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id, key, value) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [key]: value } : s));
  };

  const handleSave = async () => {
    if (!journeyName.trim()) {
      setErrorMsg('Journey name is required');
      return;
    }
    setErrorMsg('');
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Create Journey
      const journeyRes = await fetch('/api/v1/journeys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: journeyName, type: journeyType })
      });
      const journeyJson = await journeyRes.json();
      if (!journeyJson.success) throw new Error(journeyJson.message || 'Failed to save journey');
      
      const journeyId = journeyJson.data._id;

      // 2. Add Steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.stepName && step.featureCode) {
          await fetch('/api/v1/journeys/step', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              journeyId,
              stepOrder: i + 1,
              stepName: step.stepName,
              featureCode: step.featureCode
            })
          });
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error saving journey');
    } finally {
      setIsSaving(false);
    }
  };

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
              { name: 'Dashboard', active: false, href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
              { name: 'Feature Analytics', active: false, href: '/feature-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
              { name: 'Journey Analytics', active: false, href: '/journey-analytics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg> },
              { name: 'Customers / Segments', active: false, href: '/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { name: 'License Insights', active: false, href: '/license-insights', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { name: 'Predictions', href: '/predictions', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
              { name: 'Events Explorer', href: '/events-explorer', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
              { name: 'Feature Configuration', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
              { name: 'Journey Builder', active: true, href: '/journey-builder', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4c0-1.1.9-2 2-2h8.5L22 7.5V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { name: 'Privacy & Compliance', href: '/privacy-compliance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { name: 'Audit Logs', href: '/audit-logs', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { name: 'Settings', href: '/settings', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
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
            <div className="w-[34px] h-[34px] bg-[#00829B] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">{localStorage.getItem('tenantName')?.substring(0, 2).toUpperCase() || 'AC'}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 truncate tracking-tight">{localStorage.getItem('tenantName') || 'Acme Corp'}</span>
              <span className="text-[12px] text-[#64748B] tracking-tight">{localStorage.getItem('tenantPlan') || 'Enterprise'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ──────── Main Content ──────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <TopHeader />

        {/* ──────── Journey Builder Body ──────── */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Journey Builder</h1>
              <p className="text-[15px] mt-1 text-[#64748B]">Create and configure user journeys</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Test Journey</span>
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-[#0f172a] hover:bg-black transition-colors disabled:opacity-70">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>{isSaving ? 'Saving...' : 'Save Journey'}</span>
              </button>
            </div>
          </div>

          {errorMsg && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{errorMsg}</div>}
          {saveSuccess && <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">Journey saved successfully!</div>}

          {/* 1. Journey Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Journey Settings</h2>
            <div className="grid grid-cols-2 gap-6 w-[80%]">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Journey Name</label>
                <input 
                  type="text" 
                  value={journeyName}
                  onChange={e => setJourneyName(e.target.value)}
                  className="w-full bg-[#f8fafc] border-none rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Journey Type</label>
                <div className="relative">
                  <select 
                    value={journeyType}
                    onChange={e => setJourneyType(e.target.value)}
                    className="w-full bg-[#f8fafc] border-none rounded-lg pl-3 pr-8 py-2 text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Conversion">Conversion</option>
                    <option value="Retention">Retention</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Journey Steps */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[15px] font-semibold text-gray-900">Journey Steps</h2>
              <button onClick={handleAddStep} className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0f172a] text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="flex items-start space-x-6">
                    {/* Step Number */}
                    <div className="w-10 h-10 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-semibold text-[15px] shrink-0 mt-2 z-10 relative">
                      {index + 1}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Step Name</label>
                        <input 
                          type="text" 
                          value={step.stepName}
                          onChange={(e) => updateStep(step.id, 'stepName', e.target.value)}
                          className="w-full bg-[#f8fafc] border-none rounded-lg px-3 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="text-[12px] font-medium text-gray-600 bg-[#f1f5f9] px-2 py-0.5 rounded">Feature: {step.featureCode || 'Select a feature'}</span>
                          {step.featureCode && <span className="text-[11px] font-medium text-[#0f172a] bg-[#e2e8f0] px-2 py-0.5 rounded">Tracked</span>}
                        </div>
                      </div>
                      <div className="relative pr-10">
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Mapped Feature</label>
                        <div className="relative">
                          <select 
                            value={step.featureCode}
                            onChange={(e) => updateStep(step.id, 'featureCode', e.target.value)}
                            className="w-full bg-[#f8fafc] border-none rounded-lg pl-3 pr-8 py-2.5 text-[14px] text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-gray-300"
                          >
                            <option value="" disabled>Select a feature</option>
                            {features.map(f => (
                              <option key={f.code} value={f.code}>{f.name}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleRemoveStep(step.id)}
                          className="absolute right-0 top-[26px] p-2 text-red-400 hover:text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vertical Line Connecting Steps */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-[-16px] w-[1px] bg-gray-200 z-0 ml-[-0.5px]"></div>
                  )}
                  {index < steps.length - 1 && <div className="h-4"></div>}
                </div>
              ))}
              {steps.length === 0 && <div className="text-[14px] text-gray-500 py-4 text-center">No steps added. Click "Add Step" to begin.</div>}
            </div>
          </div>

          {/* 3. Visual Flow & Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-16">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Visual Flow</h2>
            <div className="bg-[#f8fafc] rounded-xl p-8 flex items-center justify-center mb-6 overflow-x-auto min-h-[200px]">
              {steps.length === 0 ? (
                <div className="text-gray-400 text-sm">Visual flow is empty</div>
              ) : (
                <div className="flex items-center min-w-max">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center group w-28">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00829B] to-[#1e3a8a] text-white flex items-center justify-center text-[18px] font-bold shadow-md transform transition-transform group-hover:scale-105">
                          {index + 1}
                        </div>
                        <div className="mt-4 text-center">
                          <div className="text-[13px] font-semibold text-gray-800 truncate px-1 max-w-full">{step.stepName || 'Unnamed'}</div>
                          <div className="text-[11px] font-medium text-gray-500 mt-1 bg-white px-2 py-0.5 rounded border border-gray-100 inline-block shadow-sm">
                            {step.featureCode || 'No feature'}
                          </div>
                        </div>
                      </div>
                      
                      {index < steps.length - 1 && (
                        <div className="w-12 mx-3 flex items-center justify-center text-gray-300 pb-10">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start space-x-3 bg-[#F0F5FF] p-4 rounded-xl border border-[#D0E2FF]">
              <div className="mt-0.5 text-[#1e3a8a]">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#1e3a8a] mb-0.5">Journey Summary</h3>
                <p className="text-[13px] text-[#2563eb]">
                  <span className="font-semibold">{journeyName || 'This Journey'}</span> contains {steps.length} steps. This journey will track users through {steps.filter(s => s.featureCode).length} mapped features.
                </p>
              </div>
            </div>
          </div>

        </div>

        <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#1e293b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors focus:outline-none z-50">
          <span className="font-semibold text-lg">?</span>
        </button>
      </main>
    </div>
  );
};

export default JourneyBuilderPage;
