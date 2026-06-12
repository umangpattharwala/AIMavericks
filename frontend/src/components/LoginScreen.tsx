'use client';

import { useState } from 'react';
import { UserInfo } from '@/app/page';
import { Shield, Users, Building2 } from 'lucide-react';

interface Props {
  onLogin: (user: UserInfo) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<'employee' | 'hr'>('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      onLogin({
        token: data.access_token,
        employeeId,
        name: data.employee_name,
        role: data.role,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 to-brand-800 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-400 rounded-lg flex items-center justify-center">
              <Building2 size={22} className="text-brand-900" />
            </div>
            <span className="text-xl font-semibold tracking-tight">NexaCore</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Total Rewards &<br />Benefits Portal
          </h1>
          <p className="text-brand-300 text-lg max-w-md leading-relaxed">
            Your AI-powered assistant for benefits inquiries, policy information, 
            compensation details, and HR support tickets.
          </p>
          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 text-brand-200">
              <Shield size={16} />
              <span className="text-sm">Secure Access</span>
            </div>
            <div className="flex items-center gap-2 text-brand-200">
              <Users size={16} />
              <span className="text-sm">Role-Based</span>
            </div>
          </div>
        </div>

        <p className="text-brand-400 text-xs">
          &copy; 2026 NexaCore Corporation. Internal use only.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-brand-900 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-accent-400" />
            </div>
            <span className="text-lg font-semibold text-brand-900">NexaCore</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-900">Sign in</h2>
            <p className="text-brand-500 mt-1.5 text-sm">
              Access your Total Rewards & Benefits assistant
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="NX01001"
                className="w-full px-4 py-2.5 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none text-brand-900 placeholder:text-brand-300 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Access Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                    role === 'employee'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 shadow-sm'
                      : 'border-brand-200 text-brand-500 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('hr')}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                    role === 'hr'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 shadow-sm'
                      : 'border-brand-200 text-brand-500 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  HR Professional
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !employeeId}
              className="w-full py-2.5 bg-brand-800 text-white font-medium rounded-lg hover:bg-brand-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-xs text-brand-300 text-center mt-8">
            Demo environment — Use any ID from NX01001 to NX02500
          </p>
        </div>
      </div>
    </div>
  );
}
