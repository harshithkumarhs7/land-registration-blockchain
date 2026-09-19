import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, PlusCircle, ArrowLeftRight, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land, TransferRequest } from '../../types';
import { PropertyCard } from '../../components/PropertyCard';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { account, linkWalletToAccount } = useWeb3();
  const [properties, setProperties] = useState<Land[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isWalletLinked =
    user?.walletAddress &&
    account &&
    user.walletAddress.toLowerCase() === account.toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, transRes] = await Promise.all([
          ApiService.getMyProperties(),
          ApiService.getTransfers({ limit: 5 }),
        ]);
        setProperties(propsRes.data.data.lands || []);
        setTransfers(transRes.data.data.transfers || []);
      } catch (err) {
        console.error('Failed to load owner dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Owner Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your land parcels, title registrations, and ownership transfers
          </p>
        </div>

        <Link
          to="/owner/register"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Land</span>
        </Link>
      </div>

      {/* Wallet Link Warning Banner if not linked */}
      {!isWalletLinked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">MetaMask Ethereum Wallet Not Linked</span>
              <span>
                Link your cryptographic wallet to enable decentralized ownership verification on-chain.
              </span>
            </div>
          </div>
          <button
            onClick={linkWalletToAccount}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0"
          >
            Connect & Link Wallet
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{properties.length}</div>
            <div className="text-xs font-medium text-slate-500">Registered Land Parcels</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {properties.filter((p) => p.status === 'REGISTERED').length}
            </div>
            <div className="text-xs font-medium text-slate-500">On-Chain Verified Titles</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{transfers.length}</div>
            <div className="text-xs font-medium text-slate-500">Active Transfers</div>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">My Registered Lands</h2>
          <Link
            to="/owner/properties"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">You have not registered any land parcels yet.</p>
            <Link
              to="/owner/register"
              className="inline-block px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold"
            >
              Submit First Land Registration
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 3).map((land) => (
              <PropertyCard key={land.id} land={land} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
