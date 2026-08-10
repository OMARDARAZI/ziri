import { useState } from 'react';
import { api } from '../../api/client';
import { UserX, CheckCircle2, AlertCircle } from 'lucide-react';

export function DeleteAccountPage() {
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/request-deletion', { phone, reason });
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while submitting your request.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5 d-flex justify-content-center">
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: '600px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: 54, height: 54 }}>
            <UserX size={28} />
          </div>
          <div>
            <h1 className="h3 fw-bold mb-0 text-navy">Account Deletion Request</h1>
            <p className="text-muted small mb-0">Submit your details to request account deletion</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-success mb-3">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h3 className="h4 fw-bold mb-2">Request Received</h3>
            <p className="text-muted">
              We have registered your account deletion request for phone number <strong>{phone}</strong>.
              Your account has been deactivated and will be permanently processed by our team.
            </p>
            <a href="/privacy-policy" className="btn btn-outline-secondary mt-3">
              Back to Privacy Policy
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="phone" className="form-label fw-semibold text-navy">
                Registered Phone Number <span className="text-danger">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="form-control"
                placeholder="e.g. +961 70 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="reason" className="form-label fw-semibold text-navy">
                Reason for Deletion (Optional)
              </label>
              <textarea
                id="reason"
                className="form-control"
                rows={3}
                placeholder="Tell us why you are requesting account deletion..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-danger py-2.5 fw-semibold mt-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Deletion Request'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
