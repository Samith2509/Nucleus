import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, companyName }),
      });

      const data = await response.json();      

      if (response.ok) {
        // Success: Store token and basic profile info
        localStorage.setItem('token', data.data?.token || data.token || '');
        if (data.data?.tenant) {
          localStorage.setItem('tenantName', data.data.tenant.name);
          localStorage.setItem('tenantPlan', data.data.tenant.plan);
        }
        navigate('/dashboard');
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError('Connection error. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 font-sans text-gray-900">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-[#00829B] rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xl">F</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-gray-900">FinSight</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[28px] font-bold text-[#111827] mb-2">Get Started</h1>
        <p className="text-[#64748B] text-[15px]">Create your organization's analytics account</p>
      </div>

      <div className="bg-white w-full max-w-[440px] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 p-8 pb-10">
        
        {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[14px] font-semibold text-gray-900 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Industries"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-transparent rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00829B]/20 focus:border-[#00829B] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-gray-900 mb-2">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-transparent rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00829B]/20 focus:border-[#00829B] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-transparent rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00829B]/20 focus:border-[#00829B] transition-all tracking-widest"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B0F19] hover:bg-[#1C2433] text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 mt-2 text-[15px] disabled:opacity-70"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-8 text-center text-[14px] text-[#64748B]">
          Already have an account? <a onClick={() => navigate('/login')} className="cursor-pointer font-semibold text-[#004f7a] hover:text-[#00829B]">Sign In</a>
        </div>
      </div>
      
      <div className="mt-12 text-center text-[#64748B] text-[13px] max-w-[440px]">
        By signing up, you will become the administrator for your organization's FinSight workspace.
      </div>
    </div>
  );
};

export default SignupPage;
