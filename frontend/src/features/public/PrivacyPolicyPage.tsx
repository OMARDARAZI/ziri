import { ShieldCheck } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <main className="container py-5 d-flex justify-content-center">
      <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: '800px' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: 54, height: 54 }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="h3 fw-bold mb-0 text-navy">Zeera Privacy Policy</h1>
            <p className="text-muted small mb-0">Last updated: August 2026</p>
          </div>
        </div>

        <div className="privacy-body text-secondary lh-lg fs-6" style={{ whiteSpace: 'pre-wrap' }}>
{`Welcome to Zeera. Your privacy is paramount to us.

1. Information We Collect
We collect minimal personal information including your full name, phone number, and optional profile avatar to process reservation bookings, validate participant QR codes at check-in, and allow providers to confirm service details.

2. How We Use Your Data
Your data is strictly used for facilitating island activity reservations, customer service support, and security authentication. We do not sell, rent, or trade your personal data to third parties.

3. Account Deletion & Rights
You have the right to request the permanent deletion of your account and personal data at any time directly through the Zeera mobile app under Profile Settings, or by submitting your registered phone number on our public deletion portal.

4. Contact & Support
For any privacy inquiries or assistance, please contact us at support@zeera.lb.`}
        </div>

        <hr className="my-4" />

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted small">
          <span>&copy; {new Date().getFullYear()} Zeera Platform. All rights reserved.</span>
          <a href="mailto:support@zeera.lb" className="text-decoration-none text-primary fw-semibold">
            Contact Support &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
