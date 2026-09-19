import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../api/client';
import { TransferRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, formatAddress } from '../../utils/crypto';

export const BuyerTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await ApiService.getTransfers();
        setTransfers(res.data.data.transfers || []);
      } catch (err) {
        console.error('Failed to load transfers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Purchase & Title Transfers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track conveyance approvals and blockchain title transmissions assigned to you
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Transfer Inquiries</h2>
          <span className="text-xs text-slate-400">{transfers.length} records</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading records...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            You do not have any pending or completed land transfers yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Selling Owner</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Initiated</th>
                  <th className="py-3 px-4">Blockchain Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-800 block">
                        {req.land?.propertyId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Survey #{req.land?.surveyNumber} ({req.land?.district})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{req.seller?.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatAddress(req.seller?.walletAddress)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {req.reason || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.blockchainTxHash ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{req.blockchainTxHash.slice(0, 10)}...</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Awaiting Registrar Approval</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
