import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land } from '../../types';
import { PropertyCard } from '../../components/PropertyCard';

export const LandingPage: React.FC = () => {
  const [featuredLands, setFeaturedLands] = useState<Land[]>([]);
  const [stats, setStats] = useState({
    registeredLands: 0,
    totalTransactions: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [landsRes, statsRes] = await Promise.all([
          ApiService.searchPublicLands({ limit: 3, status: 'REGISTERED' }),
          ApiService.getDashboardStats().catch(() => null),
        ]);
        setFeaturedLands(landsRes.data.data.lands || []);
        if (statsRes?.data?.data?.metrics) {
          setStats({
            registeredLands: statsRes.data.data.metrics.registeredLands,
            totalTransactions: statsRes.data.data.metrics.totalBlockchainTxs,
            totalUsers: statsRes.data.data.metrics.totalUsers,
          });
        }
      } catch (err) {
        console.error('Failed to load landing data:', err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cryptographically Secured on EVM Distributed Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Tamper-Resistant Digital Land Registry & Title Governance
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Eliminating record manipulation, fraudulent deeds, and ambiguous provenance. Every registered parcel holds an immutable cryptographic fingerprint on the Ethereum blockchain.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/public/verify"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify Property On-Chain</span>
              </Link>

              <Link
                to="/public/search"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/10 flex items-center gap-2 transition"
              >
                <Search className="w-4 h-4" />
                <span>Search Land Records</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.registeredLands || 1}</div>
              <div className="text-xs font-medium text-slate-500">Verified Land Parcels</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.totalTransactions || 1}</div>
              <div className="text-xs font-medium text-slate-500">On-Chain Transactions</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.totalUsers || 4}</div>
              <div className="text-xs font-medium text-slate-500">Enrolled Registry Stakeholders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Blockchain Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Integrity & Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Balancing high-throughput relational data with immutable decentralized ledger commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">SHA-256 Deed Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every deed, cadastral survey, and revenue clearance certificate is hashed deterministically upon upload. The cryptographic hash is logged on Ethereum, preventing retroactive document forgery.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Party Smart Contracts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Title transfers require mutual consensus between the owner and buyer, accompanied by government sub-registrar authorization directly on the OpenZeppelin-secured smart contract.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Complete Historical Provenance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unbroken chain of custody recorded both in indexed database tables and on-chain event logs. Citizens can inspect all historical title transfers and transaction hashes.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recently Verified Land Parcels</h2>
            <p className="text-xs text-slate-500">Publicly verified cadastral records with on-chain proofs</p>
          </div>
          <Link
            to="/public/search"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredLands.map((land) => (
            <PropertyCard key={land.id} land={land} />
          ))}
        </div>
      </section>
    </div>
  );
};
