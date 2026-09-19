import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { ApiService } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DigiLockerModal: React.FC<DigiLockerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'aadhaar' | 'digilocker'>('aadhaar');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  
  // Aadhaar OTP state
  const [rawAadhaar, setRawAadhaar] = useState('');
  const [txnId, setTxnId] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const isAlreadyVerified = user?.isAadhaarVerified;

  // Format Aadhaar display with spaces (4-4-4)
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
    setRawAadhaar(cleaned);
    setErrorMsg(null);
  };

  const formattedAadhaarDisplay = rawAadhaar
    .replace(/(\d{4})(\d{0,4})/, '$1 $2')
    .replace(/(\d{4}) (\d{4})(\d{0,4})/, '$1 $2 $3')
    .trim();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAadhaar.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!consent) {
      setErrorMsg('You must provide legal consent for Aadhaar e-KYC verification');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.requestAadhaarOtp(rawAadhaar);
      setTxnId(res.data.data.txnId);
      setMaskedAadhaar(res.data.data.maskedAadhaar);
      setMaskedMobile(res.data.data.maskedMobile);
      if (res.data.data.debugOtp) {
        setOtp(res.data.data.debugOtp);
      }
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch Aadhaar OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.verifyAadhaarOtp(txnId, otp);
      setSuccessData(res.data.data.user);
      setStep('success');
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant DigiLocker Sandbox Connect
  const handleSimulateDigiLocker = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.simulateDigiLockerConnect();
      setSuccessData(res.data.data.user);
      setStep('success');
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to connect DigiLocker');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setStep('input');
    setRawAadhaar('');
    setOtp('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex min-h-screen items-center justify-center p-4 py-8">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="bg-white/15 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <Fingerprint className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  UIDAI & DigiLocker
                </span>
                <span className="text-xs text-blue-200">MeitY, Govt of India</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Citizen Identity e-KYC Verification
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* If user is already verified */}
          {isAlreadyVerified && step !== 'success' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500">
                <ShieldCheck className="w-9 h-9 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                Identity Verified & Authenticated
              </h4>
              <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                Your account is cryptographically bound to a Government of India verified DigiLocker Aadhaar credential.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 text-left space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Masked Aadhaar:</span>
                  <span className="font-mono font-bold text-slate-900">{user.aadhaarMasked || 'XXXXXXXX9812'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">DigiLocker Doc URI:</span>
                  <span className="font-mono text-blue-700 font-semibold truncate max-w-[200px]">
                    {user.digilockerUri || 'in.gov.uidai-adhr-XXXXXXXX9812'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Verification Status:</span>
                  <span className="inline-flex items-center text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ACTIVE & VALID
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Legal Compliance:</span>
                  <span className="text-slate-600">Aadhaar Act 2016 (Section 29)</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : step === 'success' ? (
            /* Success Screen */
            <div className="text-center py-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                Aadhaar e-KYC Verified Successfully!
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Your DigiLocker citizen identity has been cryptographically confirmed.
              </p>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mt-5 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Masked Identity:</span>
                  <span className="font-mono font-bold text-emerald-900">{successData?.aadhaarMasked || maskedAadhaar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Reference:</span>
                  <span className="font-mono text-emerald-800 truncate max-w-[220px]">{successData?.digilockerUri}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authority:</span>
                  <span className="font-semibold text-slate-800">DigiLocker / UIDAI</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-md"
              >
                Complete & Return to Dashboard
              </button>
            </div>
          ) : (
            /* Verification Flow (Tabs) */
            <div>
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('aadhaar'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                    activeTab === 'aadhaar'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Aadhaar OTP e-KYC</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('digilocker'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                    activeTab === 'digilocker'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>DigiLocker Connect</span>
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'aadhaar' ? (
                step === 'input' ? (
                  /* Step 1: Input Aadhaar */
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Enter 12-Digit Aadhaar Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formattedAadhaarDisplay}
                          onChange={handleAadhaarChange}
                          placeholder="0000 0000 0000"
                          maxLength={14}
                          className="w-full font-mono text-center tracking-widest text-lg font-bold px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Try demo Aadhaar: <span className="font-mono text-blue-700 cursor-pointer font-bold" onClick={() => setRawAadhaar('987654321098')}>9876 5432 1098</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        id="aadhaar-consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <label htmlFor="aadhaar-consent" className="text-[11px] text-slate-600 leading-relaxed">
                        I hereby give my consent to verify my Aadhaar credentials via DigiLocker e-KYC for land property transactions. I understand that my raw 12-digit Aadhaar number will not be stored.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || rawAadhaar.length !== 12 || !consent}
                      className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Secure OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Aadhaar OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: OTP Verification */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                      <div className="flex justify-between font-medium mb-1">
                        <span>Aadhaar:</span>
                        <span className="font-mono font-bold">{maskedAadhaar}</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span>OTP Dispatched to:</span>
                        <span className="font-mono font-semibold">{maskedMobile}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Enter 6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtp('123456')}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded"
                        >
                          Auto-fill Sandbox OTP (123456)
                        </button>
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setErrorMsg(null);
                        }}
                        placeholder="••••••"
                        maxLength={6}
                        className="w-full font-mono text-center tracking-[0.5em] text-xl font-bold px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="flex space-x-2.5">
                      <button
                        type="button"
                        onClick={() => setStep('input')}
                        className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm & Verify Identity</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* Tab 2: DigiLocker Instant Connect */
                <div className="space-y-4 text-center py-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
                    <p className="text-slate-700 font-medium">
                      Connect your account directly with the Government of India DigiLocker Cloud:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Authorizes automatic retrieval of verified e-Aadhaar document</li>
                      <li>Extracts cryptographic digital signature and masked identity token</li>
                      <li>Complies with Indian Digital Personal Data Protection (DPDP) Act</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateDigiLocker}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting to DigiLocker Gateway...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Authorize with DigiLocker (Sandbox)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Compliance Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center">
                  <Lock className="w-3 h-3 text-emerald-600 mr-1" />
                  256-bit AES Encrypted
                </span>
                <span>Aadhaar Act 2016 Compliant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
