import React, { useState, useEffect, useRef } from 'react';
import TopHeader from '../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Implement the actual API call
      const response = await fetch('https://nucleus-by-sheeroo.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();      

      if (response.ok) {
        // Success: Store token and basic profile info
        localStorage.setItem('token', data.data?.token || data.token || 'placeholder_token');
        if (data.data?.tenant) {
          localStorage.setItem('tenantName', data.data.tenant.name);
          localStorage.setItem('tenantPlan', data.data.tenant.plan);
        }
        // Navigate to dashboard 
        navigate('/dashboard');
      } else {
        // Handle error
        setError(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error("Login Error Catch:", err);
      setError('Error: ' + err.name + ' - ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 font-sans text-gray-900 relative">
      {/* FinSight Logo Area */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-[#00829B] rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xl">F</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-gray-900">FinSight</span>
      </div>

      {/* Welcome Back Details */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold text-[#111827] mb-2 font-heading">Welcome Back</h1>
        <p className="text-[#64748B] text-[15px]">Sign in to your Enterprise Feature Intelligence Platform</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white w-full max-w-[440px] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 p-8 pb-10">
        
        {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Request */}
          <div>
            <label className="block text-[14px] font-semibold text-gray-900 mb-2 font-heading">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.smith@acme.com"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-transparent rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00829B]/20 focus:border-[#00829B] focus:bg-white transition-all placeholder:text-gray-400"
              required
            />
          </div>

          {/* Password Request */}
          <div>
              <label className="block text-[14px] font-semibold text-gray-900 font-heading">
                Password
              </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-transparent rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00829B]/20 focus:border-[#00829B] focus:bg-white transition-all placeholder:text-gray-400 tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-[18px] h-[18px] border rounded transition-colors ${keepSignedIn ? 'bg-[#00829B] border-[#00829B]' : 'bg-gray-50 border-gray-300 group-hover:border-[#00829B]'}`}>
                  {keepSignedIn && (
                    <svg className="w-3 h-3 text-white absolute top-[3px] left-[2.5px] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="ml-3 text-[14px] text-[#475569] font-medium select-none">
                Keep me signed in for 30 days
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B0F19] hover:bg-[#1C2433] text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 mt-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B0F19] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-[14px] text-[#64748B]">
          Don't have an account? <a onClick={() => navigate('/signup')} className="cursor-pointer flex-none font-semibold text-[#004f7a] hover:text-[#00829B]">Sign Up</a>
        </div>
      </div>

      {/* Footer Links */}
      <div className="w-full max-w-[440px] mt-12">
        <div className="text-center text-[#64748B] text-[13px]">
          By signing in, you agree to our <a href="#" className="underline hover:text-gray-900">Terms of Service</a> and <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>
        </div>
      </div>

      {/* Floating help button */}
      <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#1e293b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors focus:outline-none z-50">
         <span className="font-semibold text-lg hover:rotate-12 transition-transform">?</span>
      </button>

    </div>
  );
};

export default LoginPage;
