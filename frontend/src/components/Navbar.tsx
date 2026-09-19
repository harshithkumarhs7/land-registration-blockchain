import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Wallet, LogOut, User as UserIcon, CheckCircle2, ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { NotificationDropdown } from './NotificationDropdown';
import { DigiLockerModal } from './DigiLockerModal';
import { formatAddress } from '../utils/crypto';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { account, isConnecting, connectWallet, linkWalletToAccount } = useWeb3();
  const navigate = useNavigate();
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  const handleWalletAction = async () => {
    if (!account) {
      await connectWallet();
    } else if (user && user.walletAddress !== account.toLowerCase()) {
      await linkWalletToAccount();
    }
  };

  const isWalletLinked =
    user?.walletAddress &&
    account &&
    user.walletAddress.toLowerCase() === account.toLowerCase();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block">
                BHOOMI<span className="text-blue-700">CHAIN</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block -mt-1">
                Decentralized Land Registry
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/public/search"
              className="text-sm font-medium text-slate-600 hover:text-blue-700 transition"
            >
              Public Search
            </Link>
            <Link
              to="/public/verify"
              className="text-sm font-medium text-slate-600 hover:text-blue-700 transition"
            >
              Verify On-Chain
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-slate-600 hover:text-blue-700 transition"
            >
              Architecture & Security
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* DigiLocker Aadhaar e-KYC Status Button */}
            {isAuthenticated && user && (
              <button
                onClick={() => setIsKycModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  user.isAadhaarVerified
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
                }`}
                title={
                  user.isAadhaarVerified
                    ? 'Identity Verified via DigiLocker Aadhaar'
                    : 'Click to complete DigiLocker Aadhaar e-KYC'
                }
              >
                {user.isAadhaarVerified ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Aadhaar:</span>
                    <span className="font-mono">{user.aadhaarMasked || 'Verified'}</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verify Aadhaar</span>
                  </>
                )}
              </button>
            )}

            {/* MetaMask Wallet Button */}
            <button
              onClick={handleWalletAction}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isWalletLinked
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : account
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={
                isWalletLinked
                  ? 'Wallet linked to account'
                  : account
                  ? 'Click to link wallet to account'
                  : 'Click to connect MetaMask'
              }
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>
                {isWalletLinked ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {formatAddress(account)}
                  </span>
                ) : account ? (
                  `Link ${formatAddress(account)}`
                ) : isConnecting ? (
                  'Connecting...'
                ) : (
                  'Connect Wallet'
                )}
              </span>
            </button>

            {isAuthenticated && user ? (
              <>
                <NotificationDropdown />

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <span className="text-xs font-semibold text-slate-900 block leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* DigiLocker Aadhaar e-KYC Modal */}
      <DigiLockerModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
      />
    </>
  );
};
