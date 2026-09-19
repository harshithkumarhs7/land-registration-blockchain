import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Land } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatAddress } from '../utils/crypto';

interface PropertyCardProps {
  land: Land;
  actionButton?: React.ReactNode;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ land, actionButton }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {land.propertyId}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Survey #{land.surveyNumber}
            </h3>
          </div>
          <StatusBadge status={land.status} />
        </div>

        <div className="space-y-2 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {land.village}, {land.taluk}, {land.district}, {land.state}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{land.area.toLocaleString()} sq.ft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{land.landType}</span>
            </div>
          </div>

          {land.blockchainTxHash && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/60 px-2 py-1 rounded border border-emerald-200/50">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-[10px] truncate">
                Tx: {land.blockchainTxHash}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <div className="text-[11px] text-slate-500 truncate">
          Owner: <span className="font-medium text-slate-800">{formatAddress(land.owner?.walletAddress)}</span>
        </div>

        {actionButton || (
          <Link
            to={`/property/${land.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 group-hover:translate-x-0.5 transition"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
