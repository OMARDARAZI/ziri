import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { providerSummary } from './provider.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import {
  CalendarCheck,
  Compass,
  CheckCircle,
  XCircle,
  QrCode,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MetricMeta {
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  color: string;
  desc: string;
}

const metricMeta: Record<string, MetricMeta> = {
  today: { label: "Today's Bookings", icon: CalendarCheck, color: '#0066cc', desc: 'Scheduled for today' },
  upcoming: { label: 'Upcoming confirmed bookings', icon: CalendarCheck, color: '#0B7F83', desc: 'Awaiting service delivery' },
  participants: { label: 'Total Participants', icon: Compass, color: '#198754', desc: 'Booked experiences roster' },
  successful_validations: { label: 'Successful Scans', icon: CheckCircle, color: '#198754', desc: 'QR validations verified today' },
  failed_scans: { label: 'Failed Scans', icon: XCircle, color: '#D64545', desc: 'Rejected validation attempts' }
};

export function ProviderDashboard() {
  const query = useQuery({
    queryKey: ['provider', 'summary'],
    queryFn: providerSummary
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const data = query.data || {};
  const provider = typeof data.provider === 'object' && data.provider !== null ? (data.provider as Record<string, unknown>) : null;
  const businessName = provider ? String(provider.business_name) : 'Provider Portal';

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
            <span className="text-uppercase tracking-wider font-size-075 fw-600 text-white-50">Operations Dashboard</span>
          </div>
          <h1 className="h2 text-white fw-800 mb-2">{businessName}</h1>
          <p className="text-white-50 mb-0 font-size-095">
            Manage your service reservations, review upcoming participant schedules, and validate attendee QR codes.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Statistics Grid */}
        <div className="col-lg-8">
          <h2 className="h5 fw-700 mb-3 text-navy">Performance Summary</h2>
          <div className="row g-3">
            {Object.entries(data)
              .filter(([key]) => key !== 'provider')
              .map(([key, value]) => {
                const meta = metricMeta[key] || {
                  label: key.replaceAll('_', ' '),
                  icon: CalendarCheck,
                  color: 'var(--zeere-teal)',
                  desc: ''
                };
                const Icon = meta.icon;
                return (
                  <div className="col-sm-6" key={key}>
                    <div className="stat-card">
                      <div className="stat-icon-wrapper" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                        <Icon size={22} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{String(value)}</span>
                        <span className="stat-label text-capitalize">{meta.label}</span>
                        {meta.desc && <span className="text-muted font-size-075 mt-0.5">{meta.desc}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Large Prominent Scanner CTA */}
        <div className="col-lg-4">
          <div
            className="card border-0 text-white h-100 p-4 d-flex flex-column justify-content-between text-center align-items-center"
            style={{
              background: 'linear-gradient(135deg, var(--zeere-teal) 0%, var(--zeere-turquoise) 100%)',
              boxShadow: 'var(--zeere-shadow-md)'
            }}
          >
            <div className="py-3">
              <div
                className="rounded-circle bg-white text-teal d-flex align-items-center justify-content-center mb-3 mx-auto shadow-sm"
                style={{ width: 64, height: 64, color: 'var(--zeere-teal)' }}
              >
                <QrCode size={32} />
              </div>
              <h3 className="h4 fw-800 text-white mb-2">Ticket QR Scanner</h3>
              <p className="text-white-50 font-size-09 px-2">
                Scan client digital tickets on entry to automatically validate customer tokens.
              </p>
            </div>
            <Link
              className="btn btn-light text-teal w-100 d-inline-flex align-items-center justify-content-center gap-1.5 py-2.5 fw-700"
              to="/provider/scanner"
              style={{ color: 'var(--zeere-teal)' }}
            >
              <span>Scan QR Code</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
