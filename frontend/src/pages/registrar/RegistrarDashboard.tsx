import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowLeftRight, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { ApiService } from '../../api/client';
import { RegistrationApplication, TransferRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/crypto';

export const RegistrarDashboard: React.FC = () => {
  const [applications, setApplications] = useState<RegistrationApplication[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, transRes] = await Promise.all([
          ApiService.getApplications({ limit: 5 }),
          ApiService.getTransfers({ limit: 5 }),
        ]);
        setApplications(appRes.data.data.applications || []);
        setTransfers(transRes.data.data.transfers || []);
      } catch (err) {
        console.error('Failed to load registrar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingApps = applications.filter((a) => a.status === 'PENDING_VERIFICATION');
  const pendingTrans = transfers.filter((t) => t.status === 'PENDING');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Government Registrar Portal</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official Sub-Registrar inbox for verifying cadastral title deeds and committing state changes to Ethereum blockchain
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Pending Land Registrations</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingApps.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Pending Ownership Transfers</span>
            <div className="text-2xl font-bold text-blue-800 mt-1">{pendingTrans.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Applications Processed</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Land Applications */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-700" />
              <span>Land Applications Awaiting Action</span>
            </h2>
            <Link
              to="/registrar/applications"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-blue-800 block">
                    {app.land?.propertyId}
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Survey #{app.land?.surveyNumber} — {app.applicant?.name}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
              <span>Conveyance Transfer Inquiries</span>
            </h2>
            <Link
              to="/registrar/transfers"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {transfers.slice(0, 4).map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-blue-800 block">
                    {req.land?.propertyId}
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Seller: {req.seller?.name} → Buyer: {req.buyer?.name}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
