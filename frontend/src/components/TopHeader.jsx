import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TopHeader = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const notifications = [
    { id: 1, text: 'New feature deployed: Predictions', time: '5m ago', read: false },
    { id: 2, text: 'Acme Corp reached API tier limit', time: '1h ago', read: false },
    { id: 3, text: 'Weekly analytics report generated', time: '2d ago', read: true },
  ];

  return (
    <header className="h-[72px] bg-white dark-invert-bg border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-50">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center space-x-2 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50 dark-invert-element transition">
          <span className="text-[14px] font-medium text-gray-800 dark-invert-text">Acme Corp</span>
          <div className="flex items-center pl-2 ml-2 border-l border-gray-200 space-x-1">
            <span className="text-[13px] text-gray-600 dark-invert-text">Production</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search features, customers, events..." className="pl-9 pr-4 py-2 w-[340px] bg-[#F8FAFC] border border-gray-100 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:bg-white transition" />
        </div>
      </div>
      
      <div className="flex items-center space-x-5">
        <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-900 transition dark-invert-text">
          {theme === 'light' ? (
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ) : (
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          )}
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-gray-900 transition relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute top-10 right-0 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
               <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-[14px] font-bold text-gray-900">Notifications</h3>
                 <span className="text-[12px] text-[#0052cc] cursor-pointer hover:underline font-medium">Mark all read</span>
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                 {notifications.map(n => (
                   <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${n.read ? 'opacity-60' : 'bg-[#f0f9ff]/30'}`}>
                     <div className="flex items-start">
                        {!n.read && <div className="w-1.5 h-1.5 bg-[#0052cc] rounded-full mt-1.5 mr-2 shrink-0"></div>}
                        <div className={!n.read ? '' : 'pl-3'}>
                           <p className="text-[13px] font-medium text-gray-900 leading-tight">{n.text}</p>
                           <p className="text-[11px] text-gray-500 mt-1">{n.time}</p>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="px-4 py-2 text-center border-t border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <span className="text-[12px] font-medium text-gray-600">View all notifications</span>
               </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <div onClick={() => setShowProfile(!showProfile)} className="flex items-center space-x-2 cursor-pointer ml-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-full bg-[#00829B] flex items-center justify-center text-white font-semibold text-[13px] shadow-sm">JS</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          {showProfile && (
            <div className="absolute top-10 right-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
               <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                 <p className="text-[14px] font-bold text-gray-900">John Smith</p>
                 <p className="text-[12px] text-gray-500 truncate mt-0.5">john@acmecorp.com</p>
               </div>
               <div className="py-1 border-b border-gray-100">
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700 flex items-center space-x-2" onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                     <span>Account Settings</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700 flex items-center space-x-2">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                     <span>Theme Preferences</span>
                  </div>
               </div>
               <div className="py-1">
                  <div className="px-4 py-2 hover:bg-red-50 cursor-pointer text-[13px] text-red-600 font-medium flex items-center space-x-2" onClick={handleLogout}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                     <span>Logout</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
