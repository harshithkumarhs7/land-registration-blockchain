import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, ArrowLeftRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land, TransferRequest } from '../../types';
import { PropertyCard } from '../../components/PropertyCard';
import { StatusBadge } from '../../components/StatusBadge';

export const BuyerDashboard: React.FC = () => {
  const [featuredLands, setFeaturedLands] = useState<Land[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [landsRes, transRes] = await Promise.all([
          ApiService.searchPublicLands({ limit: 3, status: 'REGISTERED' }),
          ApiService.getTransfers({ limit: 5 }),
        ]);
        setFeaturedLands(landsRes.data.data.lands || []);
        setTransfers(transRes.data.data.transfers || []);
      } catch (err) {
        console.error('Failed to load buyer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prospective Buyer Portal</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explore registered land parcels and track incoming ownership transfers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Incoming Land Transfers</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{transfers.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Verified Titles Acquired</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {transfers.filter((t) => t.status === 'COMPLETED').length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Transfers Table */}
      {transfers.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">My Purchase & Transfer Inquiries</h2>
            <Link to="/buyer/transfers" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {transfers.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-800">{item.land?.propertyId}</span>
                  <p className="text-slate-500 text-[11px]">From Seller: {item.seller?.name}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Catalog Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Explore Verified Land Parcels</h2>
            <p className="text-xs text-slate-500">Government certified lands with SHA-256 title deeds</p>
          </div>
          <Link
            to="/buyer/browse"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLands.map((land) => (
              <PropertyCard key={land.id} land={land} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
