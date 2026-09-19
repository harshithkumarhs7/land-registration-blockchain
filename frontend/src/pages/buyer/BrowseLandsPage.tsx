import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land } from '../../types';
import { PropertyCard } from '../../components/PropertyCard';

export const BrowseLandsPage: React.FC = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [landType, setLandType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLands = async () => {
    setLoading(true);
    try {
      const res = await ApiService.searchPublicLands({
        query: query || undefined,
        district: district || undefined,
        landType: landType || undefined,
        status: 'REGISTERED',
        page,
        limit: 9,
      });
      setLands(res.data.data.lands || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load lands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLands();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLands();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Certified Land Parcels</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explore legally verified properties registered on the blockchain
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by survey #, village, property ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="District"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={landType}
              onChange={(e) => setLandType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="">All Categories</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="AGRICULTURAL">Agricultural</option>
              <option value="INDUSTRIAL">Industrial</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition"
          >
            Filter Records
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Fetching land catalog...</span>
        </div>
      ) : lands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No certified properties found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lands.map((land) => (
            <PropertyCard key={land.id} land={land} />
          ))}
        </div>
      )}
    </div>
  );
};
