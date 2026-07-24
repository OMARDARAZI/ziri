import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminSummary } from './admin.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import {
  Users,
  Building2,
  Compass,
  Waves,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ScanLine,
  CalendarDays,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Layout
} from 'lucide-react';

interface MetricMeta {
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  color: string;
  desc: string;
}

const metricMetadata: Record<string, MetricMeta> = {
  customers: { label: 'Customers', icon: Users, color: '#0066cc', desc: 'Registered customers' },
  providers: { label: 'Providers', icon: Building2, color: '#0d6efd', desc: 'Island experience providers' },
  offerings: { label: 'Total Offerings', icon: Compass, color: '#198754', desc: 'Services & activities' },
  services: { label: 'Services', icon: Waves, color: '#0B7F83', desc: 'Essential island services' },
  activities: { label: 'Activities', icon: Compass, color: '#E5A100', desc: 'Recreational activities' },
  bookings: { label: 'Total Bookings', icon: CalendarCheck, color: '#0B1F33', desc: 'All reservation entries' },
  pending: { label: 'Pending Bookings', icon: Clock, color: '#E5A100', desc: 'Awaiting confirmation' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: '#198754', desc: 'Approved bookings' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#D64545', desc: 'Cancelled bookings' },
  completed: { label: 'Completed', icon: ShieldCheck, color: '#13653f', desc: 'Completed bookings' },
  validations: { label: 'QR Validations', icon: ScanLine, color: '#6B7785', desc: 'Validations history' },
  events: { label: 'Events', icon: CalendarDays, color: '#F27A5E', desc: 'Upcoming island events' }
};

export function AdminDashboard() {
  const query = useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminSummary
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const links: Record<string, string> = {
    customers: 'customers',
    providers: 'providers',
    offerings: 'offerings',
    services: 'offerings?type=SERVICE',
    activities: 'offerings?type=ACTIVITY',
    bookings: 'bookings',
    pending: 'bookings?status=PENDING',
    confirmed: 'bookings?status=CONFIRMED',
    cancelled: 'bookings?status=CANCELLED',
    completed: 'bookings?status=COMPLETED',
    validations: 'scan-logs',
    events: 'events'
  };

  const data = query.data || {};

  return (
    <>
      {/* Welcome Banner */}
      <div
        className="card border-0 mb-4 p-4 p-md-5 text-white"
        style={{
          background: 'linear-gradient(135deg, var(--zeere-navy) 0%, var(--zeere-navy-light) 100%)',
          borderRadius: 'var(--zeere-radius-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Sparkles size={18} className="text-warning animate-pulse" />
            <span className="text-uppercase tracking-wider font-size-075 fw-600 text-white-50">Zeere Operations</span>
          </div>
          <h1 className="h2 text-white fw-800 mb-2">Welcome Back, Administrator</h1>
          <p className="text-white-50 mb-0 font-size-095">
            Monitor reservation requests, coordinate service listings, weather reports, and check scanner histories across the island.
          </p>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(28, 181, 176, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Main Grid */}
      <div className="row g-4">
        {/* Statistics Columns */}
        <div className="col-lg-9">
          <h2 className="h5 fw-700 mb-3 d-flex align-items-center gap-2 text-navy">
            <Layout size={18} />
            <span>Platform Overview</span>
          </h2>
          <div className="row g-3">
            {Object.entries(data).map(([key, value]) => {
              const meta = metricMetadata[key] || {
                label: key.replaceAll('_', ' '),
                icon: Compass,
                color: 'var(--zeere-teal)',
                desc: ''
              };
              const Icon = meta.icon;
              return (
                <div className="col-sm-6 col-md-4" key={key}>
                  <Link
                    className="stat-card text-decoration-none h-100"
                    to={`/admin/${links[key] || 'dashboard'}`}
                  >
                    <div className="stat-icon-wrapper" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                      <Icon size={22} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{String(value)}</span>
                      <span className="stat-label">{meta.label}</span>
                      {meta.desc && <span className="text-muted font-size-075 mt-0.5">{meta.desc}</span>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="col-lg-3">
          <div className="card h-100">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095">Quick Actions</span>
            </div>
            <div className="card-body d-flex flex-column gap-2.5">
              <Link className="btn btn-outline-primary btn-sm w-100 justify-content-between py-2 text-start d-flex align-items-center" to="/admin/stories/new">
                <span>Add Story</span>
                <PlusCircle size={16} />
              </Link>
              <Link className="btn btn-outline-primary btn-sm w-100 justify-content-between py-2 text-start d-flex align-items-center" to="/admin/news/new">
                <span>Add News</span>
                <PlusCircle size={16} />
              </Link>
              <Link className="btn btn-outline-primary btn-sm w-100 justify-content-between py-2 text-start d-flex align-items-center" to="/admin/events/new">
                <span>Schedule Event</span>
                <PlusCircle size={16} />
              </Link>
              <Link className="btn btn-outline-primary btn-sm w-100 justify-content-between py-2 text-start d-flex align-items-center" to="/admin/providers/new">
                <span>Register Provider</span>
                <PlusCircle size={16} />
              </Link>
              <Link className="btn btn-outline-primary btn-sm w-100 justify-content-between py-2 text-start d-flex align-items-center" to="/admin/offerings/new">
                <span>New Offering</span>
                <PlusCircle size={16} />
              </Link>
              <hr className="my-2 border-dashed" />
              <Link className="btn btn-primary btn-sm w-100 py-2 justify-content-center d-flex align-items-center gap-1.5" to="/admin/bookings">
                <span>Manage Bookings</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
