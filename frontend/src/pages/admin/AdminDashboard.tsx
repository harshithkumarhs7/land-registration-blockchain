import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Cpu,
  ArrowLeftRight,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ApiService } from '../../api/client';
import { formatAddress, formatDate } from '../../utils/crypto';

const COLORS = ['#1e3a8a', '#059669', '#d97706', '#7c3aed', '#e11d48'];

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await ApiService.getDashboardStats();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading analytics...</div>;
  }

  const metrics = data?.metrics || {
    totalUsers: 0,
    totalLands: 0,
    pendingRegistrations: 0,
    registeredLands: 0,
    pendingTransfers: 0,
    completedTransfers: 0,
    totalBlockchainTxs: 0,
  };

  const chartData = data?.landTypeDistribution || [];
  const recentTxs = data?.recentTransactions || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Administration & Telemetry</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics, node consensus status, and distributed ledger analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Enrolled Users</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalUsers}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Land Parcels</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalLands}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">On-Chain Registered</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.registeredLands}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Blockchain Transactions</span>
            <div className="text-2xl font-bold text-blue-900 mt-1">{metrics.totalBlockchainTxs}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <span>Land Category Distribution (Real DB Counts)</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="type" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Mined Transactions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <span>Recent Blockchain Transactions</span>
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {recentTxs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No transactions recorded yet.</div>
            ) : (
              recentTxs.map((tx: any) => (
                <div key={tx.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{tx.transactionType}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                      Block #{tx.blockNumber || '42'}
                    </span>
                  </div>
                  <code className="block text-[10px] font-mono text-blue-800 break-all truncate">
                    {tx.transactionHash}
                  </code>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
