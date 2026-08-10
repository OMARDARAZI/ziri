import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { RequireAuthentication } from '../auth/RequireAuthentication';
import { PublicOnlyRoute } from '../auth/PublicOnlyRoute';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../features/LoginPage';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { AdminListPage } from '../features/admin/AdminListPage';
import { AdminDetailPage } from '../features/admin/AdminDetailPage';
import { AdminFormPage } from '../features/admin/AdminFormPage';
import { AdminProfile } from '../features/admin/AdminProfile';
import { ProviderDashboard } from '../features/provider/ProviderDashboard';
import { ProviderBookings, ProviderBookingDetail } from '../features/provider/ProviderBookings';
import { ProviderScanner } from '../features/provider/ProviderScanner';
import { ProviderHistory } from '../features/provider/ProviderHistory';
import { ProviderProfile } from '../features/provider/ProviderProfile';
import { PublicQrPage } from '../features/publicQr/PublicQrPage';
import { PrivacyPolicyPage } from '../features/public/PrivacyPolicyPage';
import { DeleteAccountPage } from '../features/public/DeleteAccountPage';
import { SupportPage } from '../features/public/SupportPage';
import { AdminPrivacyPolicyPage } from '../features/admin/AdminPrivacyPolicyPage';
import { ShieldAlert, FileQuestion, ArrowLeft, Home } from 'lucide-react';

function Simple({ title, message }: { title: string; message: string }) {
  const navigate = useNavigate();
  const isUnauthorized = title.toLowerCase().includes('unauth') || title.toLowerCase().includes('forbidden');
  const Icon = isUnauthorized ? ShieldAlert : FileQuestion;
  const iconColor = isUnauthorized ? 'text-danger' : 'text-warning';
  const iconBg = isUnauthorized ? 'bg-danger-subtle bg-opacity-10' : 'bg-warning-subtle bg-opacity-10';

  return (
    <main className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card text-center border-0 shadow-sm p-4 p-md-5" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body d-flex flex-column align-items-center gap-3">
          <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center ${iconBg}`} style={{ width: 64, height: 64 }}>
            <Icon size={32} className={iconColor} />
          </div>
          <div>
            <h1 className="h3 fw-800 text-navy mb-2">{title}</h1>
            <p className="text-muted mb-0 font-size-095">{message}</p>
          </div>
          <div className="d-flex gap-2 w-100 justify-content-center mt-3">
            <button className="btn btn-outline-secondary btn-sm px-3 py-2 d-inline-flex align-items-center gap-1.5" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} />
              <span>Go Back</span>
            </button>
            <button className="btn btn-primary btn-sm px-3 py-2 d-inline-flex align-items-center gap-1.5" onClick={() => navigate('/')}>
              <Home size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/admin/login" element={<PublicOnlyRoute><LoginPage role="ADMIN" /></PublicOnlyRoute>} />
        <Route path="/provider/login" element={<PublicOnlyRoute><LoginPage role="PROVIDER" /></PublicOnlyRoute>} />
      </Route>
      <Route path="/qr/:token" element={<PublicQrPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/delete-account" element={<DeleteAccountPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/unauthorized" element={<Simple title="Unauthorized" message="You do not have access to this page." />} />
      <Route element={<RequireAuthentication role="ADMIN"><DashboardLayout role="admin" /></RequireAuthentication>}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/privacy-policy" element={<AdminPrivacyPolicyPage />} />
        <Route path="/admin/:resource" element={<AdminListPage />} />
        <Route path="/admin/:resource/new" element={<AdminFormPage />} />
        <Route path="/admin/:resource/:id" element={<AdminDetailPage />} />
        <Route path="/admin/:resource/:id/edit" element={<AdminFormPage />} />
      </Route>
      <Route element={<RequireAuthentication role="PROVIDER"><DashboardLayout role="provider" /></RequireAuthentication>}>
        <Route path="/provider" element={<Navigate to="/provider/dashboard" replace />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/provider/bookings" element={<ProviderBookings />} />
        <Route path="/provider/bookings/:id" element={<ProviderBookingDetail />} />
        <Route path="/provider/scanner" element={<ProviderScanner />} />
        <Route path="/provider/scan-history" element={<ProviderHistory />} />
        <Route path="/provider/profile" element={<ProviderProfile />} />
      </Route>
      <Route path="/not-found" element={<Simple title="Page not found" message="The requested page could not be found." />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}
