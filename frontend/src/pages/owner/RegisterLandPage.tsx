import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Upload, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ApiService } from '../../api/client';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import { calculateFileSha256 } from '../../utils/crypto';
import { useAuth } from '../../context/AuthContext';

export const RegisterLandPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [surveyNumber, setSurveyNumber] = useState('');
  const [area, setArea] = useState('');
  const [landType, setLandType] = useState('RESIDENTIAL');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [description, setDescription] = useState('');

  // Document upload state
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('SALE_DEED');
  const [clientHash, setClientHash] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const hash = await calculateFileSha256(selectedFile);
      setClientHash(hash);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.walletAddress) {
      setError('You must connect and link your Ethereum MetaMask wallet before submitting a land registration.');
      return;
    }
    if (!file) {
      setError('Please attach at least one supporting title deed or survey sketch document.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Land parcel record
      const landRes = await ApiService.createLand({
        surveyNumber,
        area: parseFloat(area),
        landType,
        village,
        taluk,
        district,
        state,
        latitude,
        longitude,
        description,
      });

      const newLand = landRes.data.data.land;

      // 2. Upload document with SHA-256 hash
      const formData = new FormData();
      formData.append('landId', newLand.id);
      formData.append('documentType', documentType);
      formData.append('file', file);

      await ApiService.uploadDocument(formData);

      setSuccess(`Land parcel registered successfully! Property ID: ${newLand.propertyId}. Application submitted to sub-registrar.`);
      setTimeout(() => {
        navigate('/owner/properties');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit land registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register New Land Parcel</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit official cadastral parameters and title deed documents for government registrar approval
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Cadastral Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Cadastral Survey & Measurement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Official Survey Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 142/2B"
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Total Area (sq. ft) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 2400"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Land Classification *</label>
              <select
                value={landType}
                onChange={(e) => setLandType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="AGRICULTURAL">Agricultural</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Revenue Jurisdiction & Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Village / Locality *</label>
              <input
                type="text"
                required
                placeholder="e.g. Whitefield"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Taluk / Sub-District *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru East"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">District *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru Urban"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Interactive Map Picker */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Geographic Coordinates (Cadastral Pinpoint)
          </h2>
          <MapLocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationSelect={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
        </div>

        {/* Document Upload & SHA-256 Preview */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Title Deed & Cryptographic Hashing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Document Classification *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="SALE_DEED">Original Sale Deed</option>
                <option value="SURVEY_SKETCH">Official Survey Sketch</option>
                <option value="TAX_RECEIPT">Tax Clearance Challan</option>
                <option value="ENCUMBRANCE_CERTIFICATE">Encumbrance Certificate</option>
                <option value="IDENTITY_PROOF">Identity Proof</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Attach Document File (PDF / Image) *</label>
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition bg-white text-xs">
                <Upload className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="truncate text-slate-700 font-medium">
                  {file ? file.name : 'Choose deed file...'}
                </span>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {clientHash && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Deterministic SHA-256 Hash Calculated Client-Side</span>
              </div>
              <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-[11px] text-blue-900 break-all select-all">
                {clientHash}
              </code>
              <p className="text-[10px] text-slate-500">
                This exact hash will be committed onto the Ethereum blockchain upon government registrar verification.
              </p>
            </div>
          )}
        </div>

        {/* Remarks / Description */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Parcel Description / Boundary Remarks</label>
          <textarea
            rows={3}
            placeholder="e.g. Corner plot facing 40ft road with water connection..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{submitting ? 'Submitting Application & Hashing...' : 'Submit Land Registration Application'}</span>
        </button>
      </form>
    </div>
  );
};
