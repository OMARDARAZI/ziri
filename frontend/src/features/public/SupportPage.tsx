import { useState } from 'react';
import { api } from '../../api/client';
import { Headset, CheckCircle2, AlertCircle } from 'lucide-react';

export function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/support/messages', { name, email, phone, subject, message });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit support request. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5 d-flex justify-content-center">
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: '640px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: 54, height: 54 }}>
            <Headset size={28} />
          </div>
          <div>
            <h1 className="h3 fw-bold mb-0 text-navy">Zeera Support & Contact</h1>
            <p className="text-muted small mb-0">Send a support message to our team</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-success mb-3">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h3 className="h4 fw-bold mb-2">Thank you, {name}!</h3>
            <p className="text-muted">
              Your support request has been received. Our team will review your inquiry and get back to you shortly.
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
              <label htmlFor="name" className="form-label fw-semibold text-navy">
                Your Name <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                type="text"
                className="form-control py-2"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="email" className="form-label fw-semibold text-navy">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-control py-2"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="phone" className="form-label fw-semibold text-navy">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="form-control py-2"
                  placeholder="+961 70 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="form-label fw-semibold text-navy">
                Subject <span className="text-danger">*</span>
              </label>
              <input
                id="subject"
                type="text"
                className="form-control py-2"
                placeholder="How can we help you?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="form-label fw-semibold text-navy">
                Message <span className="text-danger">*</span>
              </label>
              <textarea
                id="message"
                className="form-control py-2"
                rows={4}
                placeholder="Describe your issue or inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary py-2.5 fw-semibold mt-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? 'Sending Message...' : 'Send Support Message'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
