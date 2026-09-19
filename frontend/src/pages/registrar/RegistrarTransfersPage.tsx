import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle, ShieldCheck, RefreshCw, Cpu } from 'lucide-react';
import { ApiService } from '../../api/client';
import { TransferRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { BlockchainModal } from '../../components/BlockchainModal';
import { formatAddress, formatDate } from '../../utils/crypto';

export const RegistrarTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Blockchain modal
  const [modalOpen, setModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<'SUBMITTING' | 'MINING' | 'CONFIRMED' | 'FAILED'>('SUBMITTING');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined);
  const [modalMessage, setModalMessage] = useState<string | undefined>(undefined);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getTransfers();
      setTransfers(res.data.data.transfers || []);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleApprove = async (transfer: TransferRequest) => {
    const confirmApprove = window.confirm(
      `Approve title conveyance of ${transfer.land?.propertyId} to ${transfer.buyer?.name}? This will execute an on-chain ownership transfer.`
    );
    if (!confirmApprove) return;

    setModalOpen(true);
    setTxStatus('SUBMITTING');
    setModalMessage('Calling transferOwnership on Ethereum smart contract...');
    setTxHash(undefined);
    setBlockNumber(undefined);

    let isCompleted = false;
    const miningTimer = setTimeout(() => {
      if (!isCompleted) {
        setTxStatus('MINING');
        setModalMessage('Mining ownership transfer transaction and appending provenance block...');
      }
    }, 400);

    try {
      const res = await ApiService.approveTransfer(transfer.id);
      isCompleted = true;
      clearTimeout(miningTimer);
      const data = res.data.data;

      setTxStatus('CONFIRMED');
      setTxHash(data.transactionHash);
      setBlockNumber(data.blockNumber);
      setModalMessage(`Ownership of ${transfer.land?.propertyId} has been successfully transferred to buyer ${transfer.buyer?.name} on-chain.`);

      fetchTransfers();
    } catch (err: any) {
      isCompleted = true;
      clearTimeout(miningTimer);
      setTxStatus('FAILED');
      setModalMessage(err.response?.data?.message || err.message || 'On-chain transfer reverted');
    }
  };

  const handleReject = async (transfer: TransferRequest) => {
    const reason = window.prompt(
      `Enter reason for rejecting transfer request for ${transfer.land?.propertyId}:`,
      'Consideration or identity verification non-compliance'
    );
    if (!reason) return;

    try {
      await ApiService.rejectTransfer(transfer.id, reason);
      alert('Transfer request rejected.');
      fetchTransfers();
    } catch (err: any) {
      alert(`Rejection failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ownership Transfer Approvals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review land conveyance requests and execute immutable ownership change on the smart contract
          </p>
        </div>

        <button
          onClick={fetchTransfers}
          className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading requests...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No transfer requests currently awaiting government approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Property Parcel</th>
                  <th className="py-3.5 px-4">Selling Owner</th>
                  <th className="py-3.5 px-4">Target Buyer</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Government Action</th>
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
                        Survey #{req.land?.surveyNumber} ({req.land?.village})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{req.seller?.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatAddress(req.seller?.walletAddress)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{req.buyer?.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatAddress(req.buyer?.walletAddress)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {req.reason || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleReject(req)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(req)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Approve & Transfer</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {req.status === 'COMPLETED' ? 'Transferred on Ledger' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BlockchainModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        status={txStatus}
        txHash={txHash}
        blockNumber={blockNumber}
        message={modalMessage}
      />
    </div>
  );
};
