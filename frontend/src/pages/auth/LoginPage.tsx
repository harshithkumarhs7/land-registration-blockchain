import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { ApiService } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.login({ email, password });
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to BhoomiChain</h1>
          <p className="text-xs text-slate-500">
            Access your property dashboard, registry applications, or public records
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-blue-700" />
            <span>Academic Demonstration Quick Logins:</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Click any demo role below to autofill verified test credentials:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@landregistry.gov', 'Admin@123456')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 font-medium text-left hover:bg-blue-50/50 transition"
            >
              <div className="font-bold text-slate-900 text-[11px]">System Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@landregistry.gov</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('registrar@landregistry.gov', 'Registrar@123456')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 font-medium text-left hover:bg-blue-50/50 transition"
            >
              <div className="font-bold text-emerald-800 text-[11px]">Sub-Registrar</div>
              <div className="text-[10px] text-slate-400 truncate">registrar@landregistry.gov</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@gmail.com', 'Owner@123456')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 font-medium text-left hover:bg-blue-50/50 transition"
            >
              <div className="font-bold text-blue-800 text-[11px]">Land Owner</div>
              <div className="text-[10px] text-slate-400 truncate">owner@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('buyer@gmail.com', 'Buyer@123456')}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 font-medium text-left hover:bg-blue-50/50 transition"
            >
              <div className="font-bold text-amber-800 text-[11px]">Prospective Buyer</div>
              <div className="text-[10px] text-slate-400 truncate">buyer@gmail.com</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-semibold text-blue-700 hover:underline">
            Register as Owner or Buyer
          </Link>
        </div>
      </div>
    </div>
  );
};
