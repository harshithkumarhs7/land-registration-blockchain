import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2, AlertTriangle, PlusCircle, Building2, ShieldCheck, Wallet, UserCheck, Info } from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land, TransferRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, formatAddress } from '../../utils/crypto';

export const OwnerTransfersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initiateLandId = searchParams.get('initiate');

  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating transfer
  const [selectedLandId, setSelectedLandId] = useState(initiateLandId || '');
  const [buyerId, setBuyerId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedBuyer = buyers.find((b) => b.id === buyerId);

  const fetchData = async () => {
    try {
      const [transRes, landsRes, buyersRes] = await Promise.all([
        ApiService.getTransfers(),
        ApiService.getMyProperties(),
        ApiService.getEligibleBuyers().catch(() => ({ data: { data: { buyers: [] } } })),
      ]);
      setTransfers(transRes.data.data.transfers || []);
      setMyLands(landsRes.data.data.lands?.filter((l: Land) => l.status === 'REGISTERED') || []);
      setBuyers(buyersRes.data.data.buyers || []);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLandId || !buyerId || !reason) {
      setError('Please fill in all required transfer fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await ApiService.createTransfer({
        landId: selectedLandId,
        buyerId,
        reason,
      });

      setMessage('Ownership transfer request initiated successfully! Submitted for government registrar verification.');
      setSelectedLandId('');
      setBuyerId('');
      setReason('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate transfer request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Land Title Ownership Transfers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Initiate land conveyance and track multi-party registrar approvals
        </p>
      </div>

      {/* Initiate Transfer Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-700" />
          <span>Initiate New Ownership Transfer Request</span>
        </h2>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInitiateTransfer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Registered Property *</label>
              <select
                value={selectedLandId}
                onChange={(e) => setSelectedLandId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                required
              >
                <option value="">-- Choose verified parcel --</option>
                {myLands.map((land) => (
                  <option key={land.id} value={land.id}>
                    {land.propertyId} (Survey #{land.surveyNumber} - {land.village})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Assign Prospective Buyer *</label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {buyers.length} {buyers.length === 1 ? 'buyer' : 'buyers'} available
                </span>
              </div>
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                required
              >
                <option value="">-- Select buyer --</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.email}) {b.isAadhaarVerified ? '✓ Verified' : '⚠ KYC Pending'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Buyer Summary Card */}
          {selectedBuyer && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedBuyer.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{selectedBuyer.name}</span>
                    <span className="text-slate-400 font-normal">({selectedBuyer.email})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-slate-400" />
                      {selectedBuyer.walletAddress ? (
                        <span className="font-mono text-slate-700">{formatAddress(selectedBuyer.walletAddress)}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">No Wallet Linked</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className={`w-3 h-3 ${selectedBuyer.isAadhaarVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
                      {selectedBuyer.isAadhaarVerified ? (
                        <span className="text-emerald-700 font-semibold">DigiLocker: {selectedBuyer.aadhaarMasked}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Aadhaar KYC Required</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {selectedBuyer.isAadhaarVerified && selectedBuyer.walletAddress ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Eligible for Transfer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Helper for Demo / Testing */}
          {buyers.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                No prospective buyers registered yet. You can sign out and register a new user as a <strong>Buyer</strong> or use the pre-seeded account <strong>buyer@gmail.com</strong>.
              </span>
            </div>
          ) : !buyerId ? (
            <p className="text-[11px] text-slate-500 italic">
              💡 Tip: Pre-seeded buyer <strong>Ananya Deshmukh (buyer@gmail.com)</strong> is verified via DigiLocker and ready for instant transfer testing.
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Conveyance / Transfer Reason *</label>
            <input
              type="text"
              placeholder="e.g. Registered absolute sale deed pursuant to agreement dated 2024"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || myLands.length === 0}
            className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting Transfer Request...' : 'Submit Transfer Request'}</span>
          </button>
        </form>
      </div>

      {/* Transfer History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Transfer Request Inquiries</h2>
          <span className="text-xs text-slate-400">{transfers.length} records</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No transfer requests logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Counterparty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Blockchain Proof</th>
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
                        Survey #{req.land?.surveyNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {req.buyer?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{req.buyer?.email}</div>
                      <div className="mt-1">
                        {req.buyer?.isAadhaarVerified ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Aadhaar: {req.buyer.aadhaarMasked || 'Verified'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            e-KYC Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.blockchainTxHash ? (
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {req.blockchainTxHash.slice(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Pending Registrar</span>
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
