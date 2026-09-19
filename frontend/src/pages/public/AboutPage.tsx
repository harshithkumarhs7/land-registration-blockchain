import React from 'react';
import { Shield, Layers, Cpu, Database, Lock, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">System Architecture & Technical Design</h1>
        <p className="text-sm text-slate-500">
          Decentralized digital cadastre architecture leveraging EVM smart contracts, PostgreSQL relational models, and SHA-256 integrity verification.
        </p>
      </div>

      {/* Key Architectural Philosophy */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-700" />
          <span>Architectural Separation of Concerns</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          A fundamental engineering principle of this platform is: <strong>Do not store heavy documents or unstructured spatial layers directly on the blockchain</strong>. Doing so incurs prohibitive gas costs and compromises personal privacy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              On-Chain Distributed Ledger
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Unique Property Identifier (<code className="text-blue-800">propertyId</code>)</li>
              <li>Official Cadastral Survey Number</li>
              <li>Owner Ethereum Public Address</li>
              <li>Deterministic SHA-256 Title Document Hash</li>
              <li>Registration and Transfer Timestamps</li>
              <li>Immutable Historical Ownership Lineage</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Off-Chain Relational Orchestration
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>High-resolution cadastral spatial coordinates (GPS)</li>
              <li>Detailed village, taluk, district administrative metadata</li>
              <li>Encrypted user accounts and role-based permissions</li>
              <li>Storage-backed deed PDFs and survey sketches</li>
              <li>Audit logs and real-time in-app notifications</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cryptographic Proof Verification */}
      <section className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-6 space-y-3">
        <h3 className="text-base font-bold text-blue-950 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-700" />
          <span>Deterministic SHA-256 Document Hashing</span>
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          When a land deed or survey map is uploaded, the server deterministically calculates its cryptographic fingerprint using SHA-256:
        </p>
        <code className="block bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-blue-900 overflow-x-auto">
          documentHash = SHA256(deed_document_bytes)
        </code>
        <p className="text-xs text-slate-700 leading-relaxed">
          This 32-byte hash is embedded immutably into the <code className="text-blue-800">LandRegistry.sol</code> smart contract during approval. Later, any bank, citizen, or court official can supply the physical document to the public verification portal to mathematically prove whether the document matches the exact version validated by the government registrar.
        </p>
      </section>

      {/* Legal & Academic Notice */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-2">
        <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-700" />
          <span>Statutory Authority & Academic Caveat</span>
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Important Principle</strong>: This system does not make the naive claim that &quot;the blockchain replaces the government or makes land ownership legally valid.&quot; Rather, this system acts as a tamper-evident audit ledger and cryptographic verification companion for designated government revenue authorities and citizens. Legal title remains governed by statutory real property legislation.
        </p>
      </section>
    </div>
  );
};
