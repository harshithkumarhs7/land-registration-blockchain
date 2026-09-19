import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../api/client';
import { AuditLogItem } from '../../types';
import { formatDate } from '../../utils/crypto';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAuditLogs({
        action: actionFilter || undefined,
        page,
        limit: 15,
      });
      setLogs(res.data.data.logs || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable application access logs, state transitions, and administrative actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden"
          >
            <option value="">All Audit Actions</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="WALLET_LINKED">Wallet Linked</option>
            <option value="LAND_CREATED">Land Created</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="DOCUMENT_VERIFIED">Document Verified</option>
            <option value="LAND_REGISTERED_BLOCKCHAIN">Blockchain Registered</option>
            <option value="TRANSFER_CREATED">Transfer Initiated</option>
            <option value="OWNERSHIP_TRANSFERRED">Ownership Transferred</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No audit logs recorded matching this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor / User</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-blue-900">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4">
                      {log.user ? (
                        <div>
                          <span className="font-semibold text-slate-900">{log.user.name}</span>
                          <span className="text-[10px] text-slate-400 block">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">System / Anonymous</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {log.metadata || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
