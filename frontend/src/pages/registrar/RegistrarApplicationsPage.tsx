import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { ApiService } from '../../api/client';
import { RegistrationApplication, LandDocument } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';
import { BlockchainModal } from '../../components/BlockchainModal';
import { formatDate, formatAddress } from '../../utils/crypto';

export const RegistrarApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<RegistrationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<LandDocument | null>(null);

  // Blockchain modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<'SUBMITTING' | 'MINING' | 'CONFIRMED' | 'FAILED'>('SUBMITTING');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined);
  const [modalMessage, setModalMessage] = useState<string | undefined>(undefined);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getApplications();
      setApplications(res.data.data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (application: RegistrationApplication) => {
    const confirmApprove = window.confirm(
      `Confirm registration for Property ${application.land?.propertyId} on the blockchain?`
    );
    if (!confirmApprove) return;

    setModalOpen(true);
    setTxStatus('SUBMITTING');
    setModalMessage('Connecting to EVM Node and submitting transaction...');
    setTxHash(undefined);
    setBlockNumber(undefined);

    let isCompleted = false;
    const miningTimer = setTimeout(() => {
      if (!isCompleted) {
        setTxStatus('MINING');
        setModalMessage('Sub-Registrar role verified. Mining block on Ethereum ledger...');
      }
    }, 400);

    try {
      const res = await ApiService.approveApplication(application.id, 'Verified by Sub-Registrar');
      isCompleted = true;
      clearTimeout(miningTimer);
      const data = res.data.data;

      setTxStatus('CONFIRMED');
      setTxHash(data.transactionHash);
      setBlockNumber(data.blockNumber);
      setModalMessage(`Property ${application.land?.propertyId} is now officially registered on-chain.`);

      fetchApplications();
    } catch (err: any) {
      isCompleted = true;
      clearTimeout(miningTimer);
      setTxStatus('FAILED');
      setModalMessage(err.response?.data?.message || err.message || 'Blockchain transaction reverted');
    }
  };

  const handleReject = async (application: RegistrationApplication) => {
    const remarks = window.prompt(
      `Enter reason for rejecting Property ${application.land?.propertyId}:`,
      'Survey documentation incomplete or boundaries disputed'
    );
    if (!remarks) return;

    try {
      await ApiService.rejectApplication(application.id, remarks);
      alert('Application has been rejected.');
      fetchApplications();
    } catch (err: any) {
      alert(`Rejection failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Land Registration Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify title documents and authorize immutable smart contract registration
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No registration applications awaiting review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Property ID & Survey</th>
                  <th className="py-3.5 px-4">Applicant & Wallet</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Title Documents</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Registrar Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-800 block">
                        {app.land?.propertyId}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Survey #{app.land?.surveyNumber} ({app.land?.landType})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.applicant?.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatAddress(app.applicant?.walletAddress)}
                      </div>
                      <div className="mt-1">
                        {app.applicant?.isAadhaarVerified ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Aadhaar: {app.applicant.aadhaarMasked || 'Verified'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            e-KYC Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{app.land?.village}</div>
                      <div className="text-[10px] text-slate-400">
                        {app.land?.taluk}, {app.land?.district}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {app.land?.documents?.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-[11px] font-medium text-slate-700 hover:text-blue-800 border border-slate-200 transition"
                            title="Inspect and verify SHA-256 fingerprint"
                          >
                            <FileText className="w-3 h-3 text-blue-700" />
                            <span>{doc.documentType}</span>
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {app.status === 'PENDING_VERIFICATION' ? (
                        <>
                          <button
                            onClick={() => handleReject(app)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(app)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Approve On-Chain</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {app.status === 'APPROVED' ? 'Recorded on Ledger' : 'Rejected'}
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

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          canVerify={true}
          onStatusUpdate={async (status) => {
            try {
              await ApiService.updateDocumentStatus(selectedDoc.id, status);
              setSelectedDoc(null);
              fetchApplications();
            } catch (err: any) {
              alert(`Status update failed: ${err.message}`);
            }
          }}
        />
      )}

      {/* Blockchain Mining & Confirmation Modal */}
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
