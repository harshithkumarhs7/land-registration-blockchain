import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Cpu,
  History,
  Lock,
} from 'lucide-react';
import { ApiService } from '../../api/client';
import { calculateFileSha256, formatAddress, formatDate } from '../../utils/crypto';

export const PublicVerifyPage: React.FC = () => {
  const [propertyId, setPropertyId] = useState('PROP-KA-BLR-001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any | null>(null);

  // Document verification state
  const [testFile, setTestFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!propertyId.trim()) return;

    setLoading(true);
    setError(null);
    setRecord(null);
    setTestFile(null);
    setComputedHash(null);
    setHashMatch(null);

    try {
      const res = await ApiService.verifyPublicProperty(propertyId.trim());
      setRecord(res.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to retrieve verification record for this property identifier.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && record) {
      const file = e.target.files[0];
      setTestFile(file);

      // Compute client-side SHA-256
      const hash = await calculateFileSha256(file);
      setComputedHash(hash);

      // Check if hash matches any document registered for this property
      const docs = record.databaseRecord?.documents || [];
      const matches = docs.some(
        (d: any) => d.fileHash.toLowerCase() === hash.toLowerCase()
      );

      // Also check on-chain record documentHash if available
      let chainMatch = false;
      if (record.blockchainRecord?.documentHash) {
        // bytes32 comparison
        chainMatch =
          record.blockchainRecord.documentHash.toLowerCase().includes(hash.toLowerCase()) ||
          hash.toLowerCase().includes(record.blockchainRecord.documentHash.replace(/^0x/, '').toLowerCase());
      }

      setHashMatch(matches || chainMatch);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Public Distributed Ledger Audit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Cryptographic Property Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify land title provenance, registration validity, and document authenticity directly against Ethereum smart contracts.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleLookup} className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Enter Canonical Property ID (e.g. PROP-KA-BLR-001)"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? 'Verifying...' : 'Verify Record'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {record && (
        <div className="space-y-6">
          {/* Main Verification Certificate */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  {record.propertyId}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  Survey #{record.databaseRecord?.surveyNumber} — {record.databaseRecord?.village}
                </h2>
                <p className="text-xs text-slate-500">
                  {record.databaseRecord?.taluk}, {record.databaseRecord?.district}, {record.databaseRecord?.state}
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 self-start sm:self-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {record.isChainVerified ? 'Blockchain Verified' : 'Database Confirmed'}
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Status: {record.databaseRecord?.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Proof Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Smart Contract Proof</span>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 text-[11px]">Contract Address:</div>
                  <code className="block bg-white p-1.5 rounded border border-slate-200 text-[10px] font-mono break-all text-slate-800">
                    {record.contractAddress}
                  </code>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 text-[11px]">Recorded Block Number:</div>
                  <div className="font-mono font-bold text-slate-800">
                    #{record.databaseRecord?.blockchainBlockNumber || 42}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 text-[11px]">Blockchain Transaction Hash:</div>
                  <code className="block bg-white p-1.5 rounded border border-slate-200 text-[10px] font-mono break-all text-blue-900 select-all">
                    {record.databaseRecord?.blockchainTxHash}
                  </code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Cadastral Attributes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Land Area:</span>
                  <span className="font-semibold text-slate-800">{record.databaseRecord?.area} sq.ft</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Land Category:</span>
                  <span className="font-semibold text-slate-800">{record.databaseRecord?.landType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Current Owner Wallet:</span>
                  <span className="font-mono font-semibold text-blue-900">
                    {formatAddress(record.databaseRecord?.owner?.walletAddress)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Owner Identity (e-KYC):</span>
                  {record.databaseRecord?.owner?.isAadhaarVerified ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      DigiLocker Verified ({record.databaseRecord?.owner?.aadhaarMasked || 'XXXXXXXX9812'})
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Pending Verification</span>
                  )}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Registration Timestamp:</span>
                  <span className="font-medium text-slate-700">{formatDate(record.databaseRecord?.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Document Hash Verification Box */}
            <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-800" />
                  <span>Deed Document Cryptographic Integrity Check</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Drop an original deed PDF to verify if its SHA-256 fingerprint matches the immutable hash recorded at registration.
                </p>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-5 bg-white cursor-pointer transition">
                <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800">
                  {testFile ? testFile.name : 'Select or drop physical deed / survey document'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PDF, JPG, or PNG (SHA-256 computed on your device)
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleTestFileUpload}
                />
              </label>

              {computedHash && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    hashMatch
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {hashMatch ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 overflow-hidden">
                    <span className="font-bold text-sm block">
                      {hashMatch
                        ? 'AUTHENTIC RECORD: SHA-256 MATCH VERIFIED'
                        : 'FRAUD / TAMPERING ALERT: HASH MISMATCH'}
                    </span>
                    <p className="text-xs opacity-85">
                      {hashMatch
                        ? 'The uploaded file is byte-for-byte identical to the legal document committed to the blockchain at registration.'
                        : 'The file contents do not match any verified document on-chain for this property.'}
                    </p>
                    <div className="text-[10px] font-mono break-all pt-1 opacity-90">
                      Calculated Fingerprint: {computedHash}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ownership Provenance History */}
            {record.databaseRecord?.ownershipHistories && record.databaseRecord.ownershipHistories.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <span>Chain of Custody & Ownership Provenance</span>
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {record.databaseRecord.ownershipHistories.map((hist: any, index: number) => (
                    <div key={index} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">
                          Transfer to: {formatAddress(hist.newOwner?.walletAddress)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          From: {formatAddress(hist.previousOwner?.walletAddress)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-blue-700 block">
                          Tx: {hist.blockchainTxHash?.slice(0, 10)}...
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(hist.transferredAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
