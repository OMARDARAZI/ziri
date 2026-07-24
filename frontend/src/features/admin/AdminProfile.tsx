import { useAuth } from '../../auth/AuthProvider';
import { CircleUser, Phone, ShieldCheck } from 'lucide-react';

export function AdminProfile() {
  const { user } = useAuth();
  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1 text-navy fw-800">My Profile</h1>
        <p className="text-muted font-size-09">Manage your account credentials and system profile settings.</p>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center py-5">
            <div className="card-body d-flex flex-column align-items-center">
              <div
                className="user-avatar mb-3"
                style={{
                  width: 90,
                  height: 90,
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 12px rgba(11, 127, 131, 0.15)'
                }}
              >
                {initial}
              </div>
              <h2 className="h5 fw-700 text-navy mb-1">{user?.full_name || 'Staff'}</h2>
              <span className="badge text-bg-warning px-3 py-1 text-uppercase tracking-wider font-size-075">
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Credentials / Details info */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                <CircleUser size={18} className="text-teal" />
                <span>Account Information</span>
              </span>
            </div>
            <div className="card-body p-4 d-flex flex-column gap-3.5">
              <div className="row border-bottom pb-3">
                <div className="col-sm-4 text-muted fw-600 font-size-09 text-uppercase">Full Name</div>
                <div className="col-sm-8 fw-700 text-navy font-size-095">{user?.full_name || '—'}</div>
              </div>

              <div className="row border-bottom pb-3">
                <div className="col-sm-4 text-muted fw-600 font-size-09 text-uppercase">Phone Number</div>
                <div className="col-sm-8 fw-600 text-navy font-size-095 d-flex align-items-center gap-2">
                  <Phone size={15} className="text-muted" />
                  <span>{user?.phone || '—'}</span>
                </div>
              </div>

              <div className="row border-bottom pb-3">
                <div className="col-sm-4 text-muted fw-600 font-size-09 text-uppercase">Security Role</div>
                <div className="col-sm-8 fw-600 text-navy font-size-095 d-flex align-items-center gap-2">
                  <ShieldCheck size={16} className="text-success" />
                  <span>Full Administrative Access</span>
                </div>
              </div>

              <div className="row pb-1">
                <div className="col-sm-4 text-muted fw-600 font-size-09 text-uppercase">Portal Scope</div>
                <div className="col-sm-8 font-size-09 text-muted">
                  Allowed to view bookings, create and manage providers/users, edit offerings, and update global settings.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
