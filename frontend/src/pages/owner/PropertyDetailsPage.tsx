import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Maximize2,
  FileText,
  History,
  ArrowLeft,
  ArrowLeftRight,
  Download,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { ApiService } from '../../api/client';
import { Land, LandDocument } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PropertyMap } from '../../components/PropertyMap';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';
import { formatAddress, formatDate } from '../../utils/crypto';
import { useAuth } from '../../context/AuthContext';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<LandDocument | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const res = await ApiService.getLandById(id);
        setLand(res.data.data.land);
      } catch (err) {
        console.error('Failed to load land details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading property records...</div>;
  }

  if (!land) {
    return (
      <div className="text-center py-20 text-slate-500 text-xs">
        Property not found.{' '}
        <Link to="/public/search" className="text-blue-700 underline">
          Return to search
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === land.ownerId;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {isOwner && land.status === 'REGISTERED' && (
          <Link
            to={`/owner/transfers?initiate=${land.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Initiate Ownership Transfer</span>
          </Link>
        )}
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded">
              {land.propertyId}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              Cadastral Survey #{land.surveyNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {land.village}, {land.taluk}, {land.district}, {land.state}
              </span>
            </p>
          </div>
          <StatusBadge status={land.status} />
        </div>

        {/* Attribute badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Area</span>
            <span className="font-bold text-slate-800">{land.area.toLocaleString()} sq.ft</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Category</span>
            <span className="font-bold text-slate-800">{land.landType}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Owner</span>
            <span className="font-bold text-slate-800 truncate block">{land.owner?.name}</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {land.owner?.isAadhaarVerified
                ? `Aadhaar: ${land.owner.aadhaarMasked || 'Verified'}`
                : 'e-KYC Pending'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Owner Wallet</span>
            <span className="font-mono font-bold text-blue-800 block truncate">
              {formatAddress(land.owner?.walletAddress)}
            </span>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-700" />
          <span>Cadastral Boundary Location</span>
        </h2>
        <PropertyMap
          latitude={land.latitude}
          longitude={land.longitude}
          propertyId={land.propertyId}
          surveyNumber={land.surveyNumber}
          village={land.village}
          area={land.area}
          height="320px"
        />
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Title Deeds & Documents ({land.documents?.length || 0})</span>
          </h2>
          <span className="text-[11px] text-slate-400">Deterministic SHA-256 Hashed</span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {land.documents?.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">{doc.documentType}</span>
                  <StatusBadge status={doc.verificationStatus} />
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                  SHA-256: {doc.fileHash}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition"
                >
                  Verify Hash
                </button>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-blue-700"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance & Ownership History */}
      {land.ownershipHistories && land.ownershipHistories.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <span>Historical Ownership Provenance</span>
          </h2>

          <div className="space-y-3">
            {land.ownershipHistories.map((hist) => (
              <div key={hist.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">
                    Transferred to: {hist.newOwner?.name} ({formatAddress(hist.newOwner?.walletAddress)})
                  </span>
                  <span className="text-slate-400 text-[11px]">{formatDate(hist.transferredAt)}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Previous Owner: {hist.previousOwner?.name} ({formatAddress(hist.previousOwner?.walletAddress)})
                </div>
                {hist.blockchainTxHash && (
                  <div className="font-mono text-[10px] text-blue-800 break-all">
                    Tx: {hist.blockchainTxHash}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
};
