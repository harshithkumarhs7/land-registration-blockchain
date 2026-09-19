import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Building2, ArrowLeftRight, Eye } from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatAddress } from '../../utils/crypto';

export const MyPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const res = await ApiService.getMyProperties();
      setProperties(res.data.data.lands || []);
    } catch (err) {
      console.error('Failed to load owned properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Registered Land Parcels</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View property titles, official documents, and initiate ownership transfers
          </p>
        </div>

        <Link
          to="/owner/register"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold transition self-start sm:self-auto shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Land</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading land parcels...</div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No properties registered yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Submit a new cadastral registration application to register your property on the decentralized ledger.
          </p>
          <Link
            to="/owner/register"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold"
          >
            Register Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((land) => (
            <div
              key={land.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {land.propertyId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Survey #{land.surveyNumber}
                    </h3>
                  </div>
                  <StatusBadge status={land.status} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Location: {land.village}, {land.district}</div>
                  <div>Area: {land.area.toLocaleString()} sq.ft ({land.landType})</div>
                  <div>Documents: {land.documents?.length || 0} attached</div>
                </div>

                {land.blockchainTxHash && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 truncate">
                    Tx: {land.blockchainTxHash}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/property/${land.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </Link>

                {land.status === 'REGISTERED' && (
                  <Link
                    to={`/owner/transfers?initiate=${land.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 transition"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
