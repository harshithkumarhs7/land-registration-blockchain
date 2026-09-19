import React, { useState } from 'react';
import { X, Download, ShieldCheck, AlertTriangle, Upload, CheckCircle2, FileText } from 'lucide-react';
import { LandDocument } from '../types';
import { ApiService } from '../api/client';
import { calculateFileSha256 } from '../utils/crypto';

interface DocumentViewerModalProps {
  document: LandDocument;
  onClose: () => void;
  onStatusUpdate?: (status: 'VERIFIED' | 'REJECTED') => void;
  canVerify?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onStatusUpdate,
  canVerify = false,
}) => {
  const [testFile, setTestFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isMatch: boolean;
    computedHash: string;
    storedHash: string;
    onChainVerified?: boolean;
  } | null>(null);

  const handleTestFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTestFile(file);
      setVerifying(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await ApiService.verifyDocumentFile(document.id, formData);
        setVerifyResult(res.data.data);
      } catch (err: any) {
        // Fallback to client-side SHA-256 calculation
        const clientHash = await calculateFileSha256(file);
        setVerifyResult({
          isMatch: clientHash.toLowerCase() === document.fileHash.toLowerCase(),
          computedHash: clientHash,
          storedHash: document.fileHash,
        });
      } finally {
        setVerifying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-800" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{document.documentType}</h3>
              <p className="text-xs text-slate-500">{document.originalFileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Metadata Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-semibold text-slate-800">{document.documentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">File Size:</span>
              <span className="font-semibold text-slate-800">
                {(document.fileSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-slate-800">{document.verificationStatus}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-slate-500 block mb-1">
                Deterministic SHA-256 Fingerprint:
              </span>
              <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono break-all text-blue-900 select-all">
                {document.fileHash}
              </code>
            </div>
          </div>

          {/* Download Original Link */}
          <a
            href={`/api/documents/${document.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Original Document</span>
          </a>

          {/* Cryptographic Tamper Test */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Cryptographic Tamper-Verification Test</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Upload any document file below to compute its SHA-256 hash and verify if it matches the immutable blockchain hash.
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-lg p-4 cursor-pointer bg-white transition text-center">
              <Upload className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-slate-700">
                {testFile ? testFile.name : 'Select or drop test document'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                PDF, JPG, or PNG (up to 10MB)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleTestFileChange}
              />
            </label>

            {verifying && (
              <div className="text-center py-2 text-xs text-blue-600 font-medium">
                Computing SHA-256 hash and verifying...
              </div>
            )}

            {verifyResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  verifyResult.isMatch
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {verifyResult.isMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 overflow-hidden">
                  <span className="font-bold block">
                    {verifyResult.isMatch
                      ? 'AUTHENTIC RECORD: SHA-256 MATCH'
                      : 'TAMPERED / MISMATCH DETECTED'}
                  </span>
                  <div className="text-[10px] font-mono break-all opacity-85">
                    Computed: {verifyResult.computedHash}
                  </div>
                  {verifyResult.onChainVerified !== undefined && (
                    <div className="text-[10px] font-semibold text-blue-700">
                      Smart Contract Verification:{' '}
                      {verifyResult.onChainVerified ? 'CONFIRMED ON-CHAIN' : 'ON-CHAIN MISMATCH'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions for registrar */}
        {canVerify && onStatusUpdate && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => onStatusUpdate('REJECTED')}
              className="px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-lg transition"
            >
              Reject Document
            </button>
            <button
              onClick={() => onStatusUpdate('VERIFIED')}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition"
            >
              Mark Verified
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
