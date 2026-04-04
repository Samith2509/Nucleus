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
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();      

      if (response.ok) {
        // Success: Store token and redirect
        // Assuming data contains a token
        localStorage.setItem('token', data.data?.token || data.token || 'placeholder_token');
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[14px] font-semibold text-gray-900 font-heading">
                Password
              </label>
              <a href="#" className="text-[13px] text-[#0066cc] font-medium hover:underline hover:text-[#0055aa]">
                Forgot password?
              </a>
            </div>
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
          Don't have an account? <a href="#" className="flex-none font-semibold text-[#004f7a] hover:text-[#00829B]">Request Access</a>
        </div>
      </div>

      {/* Social Logins */}
      <div className="w-full max-w-[440px] mt-8">
        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-[#94a3b8] text-[13px] bg-[#F4F7FB] px-2 font-medium">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl py-2.5 px-4 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00829B]/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span className="text-[14px] font-semibold text-[#111827]">Google</span>
          </button>
          
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl py-2.5 px-4 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00829B]/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" stroke="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>            
            <span className="text-[14px] font-semibold text-[#111827]">LinkedIn</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center text-[#64748B] text-[13px]">
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
