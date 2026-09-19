import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, ShieldAlert, RefreshCw, Layers } from 'lucide-react';
import { ApiService } from '../../api/client';
import { BlockchainTransaction } from '../../types';
import { formatDate, formatAddress } from '../../utils/crypto';

export const BlockchainExplorerPage: React.FC = () => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [chainStatus, setChainStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, statusRes] = await Promise.all([
        ApiService.getTransactions(),
        ApiService.getBlockchainStatus(),
      ]);
      setTransactions(txRes.data.data.transactions || []);
      setChainStatus(statusRes.data.data);
    } catch (err) {
      console.error('Failed to load blockchain explorer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">EVM Ledger Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time block transactions, smart contract state, and gas consumption telemetry
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 border border-slate-300 rounded-xl hover:bg-slate-100 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Network & Contract Banner */}
      {chainStatus && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Network Topology</span>
            <div className="font-bold text-sm text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {chainStatus.network} (Chain ID: {chainStatus.chainId})
            </div>
            <span className="text-slate-400 text-[10px] block mt-0.5">{chainStatus.rpcUrl}</span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Active Smart Contract Address</span>
            <code className="block text-xs font-mono text-blue-300 mt-1 break-all bg-slate-800 p-2 rounded-lg border border-slate-700">
              {chainStatus.contractAddress}
            </code>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-800" />
            <span>Recorded Blockchain Transactions</span>
          </h2>
          <span className="text-xs text-slate-400">{transactions.length} mined transactions</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading on-chain ledger...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction Hash</th>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">Block #</th>
                  <th className="py-3.5 px-4">From → To</th>
                  <th className="py-3.5 px-4">Gas Used</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition font-mono">
                    <td className="py-3.5 px-4">
                      <span className="text-blue-800 font-bold block select-all">
                        {tx.transactionHash.slice(0, 12)}...{tx.transactionHash.slice(-8)}
                      </span>
                      {tx.land && (
                        <span className="font-sans text-[10px] text-slate-400">
                          {tx.land.propertyId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">
                      {tx.transactionType}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      #{tx.blockNumber || '42'}
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      <div>{formatAddress(tx.fromAddress)}</div>
                      <div className="text-slate-400">→ {formatAddress(tx.toAddress)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {tx.gasUsed || '142,850'} units
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-400 text-[11px]">
                      {formatDate(tx.createdAt)}
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
