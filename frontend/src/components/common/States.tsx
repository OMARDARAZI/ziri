import type { ReactNode } from 'react';
import { ApiError } from '../../api/apiError';
import { Loader2, AlertCircle, Inbox, CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="p-5 text-center d-flex flex-column align-items-center justify-content-center gap-3" role="status" style={{ minHeight: '200px' }}>
      <Loader2 className="animate-spin text-teal" size={36} style={{ animation: 'spin 1s linear infinite' }} />
      <span className="text-muted fw-500 font-size-09">Loading information...</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .text-teal { color: var(--zeere-teal); }
      `}</style>
    </div>
  );
}

export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  const providerSetup = error instanceof ApiError && error.code === 'PROVIDER_PROFILE_REQUIRED';
  return (
    <div className="card border-danger-subtle bg-danger-subtle bg-opacity-10 p-4 rounded-lg d-flex flex-column align-items-center text-center gap-3">
      <div className="rounded-circle bg-danger-subtle text-danger p-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
        <AlertCircle size={28} />
      </div>
      <div>
        <h3 className="h5 text-danger mb-1 fw-700">{providerSetup ? 'Provider setup required' : 'Something went wrong'}</h3>
        <p className="text-muted mb-0 font-size-09">{providerSetup ? 'An administrator must finish creating your provider profile before you can use the provider dashboard.' : error.message || 'An unexpected error occurred while fetching data.'}</p>
      </div>
      {retry && (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 mt-1"
          onClick={retry}
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No records found.' }: { message?: string }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center p-5 gap-3" style={{ minHeight: '220px' }}>
      <div className="rounded-circle bg-light text-muted p-3 d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, backgroundColor: '#f8f9fa' }}>
        <Inbox size={28} className="text-muted opacity-75" />
      </div>
      <div>
        <h4 className="h6 text-navy mb-1 fw-600">No data available</h4>
        <p className="text-muted mb-0 font-size-09" style={{ maxWidth: '280px' }}>{message}</p>
      </div>
    </div>
  );
}

export function Alert({
  children,
  type = 'danger'
}: {
  children: ReactNode;
  type?: 'danger' | 'success' | 'info' | 'warning';
}) {
  const icons = {
    danger: <AlertCircle size={18} className="flex-shrink-0" />,
    success: <CheckCircle2 size={18} className="flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="flex-shrink-0" />,
    info: <Info size={18} className="flex-shrink-0" />
  };

  return (
    <div className={`alert alert-${type} d-flex align-items-start gap-2`} role="alert">
      {icons[type]}
      <div className="flex-grow-1">{children}</div>
    </div>
  );
}
