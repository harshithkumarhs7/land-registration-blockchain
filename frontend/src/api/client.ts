import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lr_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('lr_token');
        localStorage.removeItem('lr_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const ApiService = {
  // Auth
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),

  // Wallet
  getNonce: (walletAddress: string) => api.post('/wallet/nonce', { walletAddress }),
  linkWallet: (data: { walletAddress: string; signature: string; message: string }) =>
    api.post('/wallet/link', data),

  // Lands
  getLands: (params?: any) => api.get('/lands', { params }),
  getMyProperties: () => api.get('/lands/my-properties'),
  getLandById: (id: string) => api.get(`/lands/${id}`),
  createLand: (data: any) => api.post('/lands', data),

  // Documents
  uploadDocument: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyDocumentFile: (id: string, formData: FormData) =>
    api.post(`/documents/${id}/verify-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateDocumentStatus: (id: string, status: string) =>
    api.put(`/documents/${id}/status`, { status }),

  // Registrations (Registrar)
  getApplications: (params?: any) => api.get('/registrations', { params }),
  getApplicationById: (id: string) => api.get(`/registrations/${id}`),
  approveApplication: (id: string, remarks?: string) =>
    api.post(`/registrations/${id}/approve`, { remarks }),
  rejectApplication: (id: string, remarks?: string) =>
    api.post(`/registrations/${id}/reject`, { remarks }),

  // Transfers
  getTransfers: (params?: any) => api.get('/transfers', { params }),
  getEligibleBuyers: () => api.get('/transfers/eligible-buyers'),
  createTransfer: (data: any) => api.post('/transfers', data),
  approveTransfer: (id: string) => api.post(`/transfers/${id}/approve`),
  rejectTransfer: (id: string, reason?: string) =>
    api.post(`/transfers/${id}/reject`, { reason }),

  // Blockchain
  getBlockchainStatus: () => api.get('/blockchain/status'),
  getTransactions: (params?: any) => api.get('/blockchain/transactions', { params }),
  getTransactionByHash: (hash: string) => api.get(`/blockchain/transactions/${hash}`),
  getLandFromChain: (propertyId: string) => api.get(`/blockchain/lands/${propertyId}`),
  verifyDocumentOnChain: (propertyId: string, documentHash: string) =>
    api.post(`/blockchain/verify/${propertyId}`, { documentHash }),

  // Admin
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string) =>
    api.put(`/admin/users/${id}/status`, { status }),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/notifications/read-all'),

  // Public
  searchPublicLands: (params?: any) => api.get('/public/lands', { params }),
  verifyPublicProperty: (propertyId: string) => api.get(`/public/verify/${propertyId}`),

  // DigiLocker & Aadhaar e-KYC
  getKycStatus: () => api.get('/kyc/status'),
  requestAadhaarOtp: (aadhaarNumber: string) =>
    api.post('/kyc/aadhaar/otp-request', { aadhaarNumber }),
  verifyAadhaarOtp: (txnId: string, otp: string) =>
    api.post('/kyc/aadhaar/otp-verify', { txnId, otp }),
  getDigiLockerAuthUrl: () => api.get('/kyc/digilocker/auth-url'),
  handleDigiLockerCallback: (code: string, state: string) =>
    api.post('/kyc/digilocker/callback', { code, state }),
  simulateDigiLockerConnect: () => api.post('/kyc/digilocker/simulate'),
};
