import React from 'react';
import { X, CheckCircle, Cpu, Loader2 } from 'lucide-react';

interface BlockchainModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'SUBMITTING' | 'MINING' | 'CONFIRMED' | 'FAILED';
  txHash?: string;
  blockNumber?: number;
  message?: string;
}

export const BlockchainModal: React.FC<BlockchainModalProps> = ({
  isOpen,
  onClose,
  status,
  txHash,
  blockNumber,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">EVM Blockchain Operation</h3>
          </div>
          {status !== 'SUBMITTING' && status !== 'MINING' && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="text-center py-4 space-y-3">
          {status === 'SUBMITTING' || status === 'MINING' ? (
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
            </div>
          ) : status === 'CONFIRMED' ? (
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          ) : (
            <div className="text-rose-600 font-bold">Transaction Failed</div>
          )}

          <div>
            <h4 className="text-base font-bold text-slate-800">
              {status === 'SUBMITTING' && 'Broadcasting Transaction...'}
              {status === 'MINING' && 'Mining Block on Hardhat Node...'}
              {status === 'CONFIRMED' && 'Transaction Confirmed on Blockchain!'}
              {status === 'FAILED' && 'Operation Encountered an Error'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">{message}</p>
          </div>

          {txHash && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Block:</span>
                <span className="font-mono font-semibold text-slate-800">#{blockNumber || 'Pending'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Tx Hash:</span>
                <code className="block bg-white p-1.5 rounded border border-slate-200 text-[11px] font-mono break-all text-blue-900 select-all">
                  {txHash}
                </code>
              </div>
            </div>
          )}
        </div>

        {status === 'CONFIRMED' && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
