import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Shield, Lock, Cpu, Globe } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>BHOOMICHAIN LAND REGISTRY</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              An academic prototype demonstrating tamper-evident land provenance and decentralized title transfer on Ethereum-compatible distributed ledger technology.
            </p>
            <div className="text-slate-500 text-[11px] pt-2">
              © {new Date().getFullYear()} National Digital Land Cadastre & Blockchain Initiative.
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/public/search" className="hover:text-white transition">Public Land Search</Link></li>
              <li><Link to="/public/verify" className="hover:text-white transition">Verify Blockchain Title</Link></li>
              <li><Link to="/about" className="hover:text-white transition">System Architecture</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Sign In to Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Security & Compliance</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Deed Hashing</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> EVM Smart Contracts</li>
              <li className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-amber-400" /> Open Access Verification</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
