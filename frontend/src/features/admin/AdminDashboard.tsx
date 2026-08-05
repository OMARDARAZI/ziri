import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminSummary } from './admin.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ArrowUpRight,
  Plus,
  CalendarCheck,
  Compass,
  Building2,
  CalendarDays,
  UtensilsCrossed,
  ScanLine,
  ChevronRight
} from 'lucide-react';
import { dateTime } from '../../utils/format';

export function AdminDashboard() {
  const query = useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminSummary
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const data = query.data || {};
  const recentBookings = Array.isArray(data.recent_bookings) ? data.recent_bookings : [];

  return (
    <div className="animate-fade-in-up">
      {/* 1. Dashboard Header Row */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fw-800 text-dark mb-1" style={{ fontSize: '1.85rem', letterSpacing: '-0.03em', color: '#0F172A' }}>Dashboard</h1>
          <p className="text-secondary mb-0" style={{ fontSize: '0.92rem', color: '#64748B' }}>Monitor platform reservations, offerings, and provider activity for Zeere.</p>
        </div>
        <div className="d-flex align-items-center gap-2.5">
          <Link
            to="/admin/offerings/new"
            className="btn text-white rounded-pill px-4 py-2.5 fw-700 d-inline-flex align-items-center gap-2 shadow-sm"
            style={{ backgroundColor: '#14532D', border: 'none', fontSize: '0.88rem' }}
          >
            <Plus size={18} />
            <span>New Offering</span>
          </Link>
          <Link
            to="/admin/providers/new"
            className="btn btn-outline-success text-success-emphasis rounded-pill px-4 py-2.5 fw-700 d-inline-flex align-items-center gap-2"
            style={{ borderColor: '#14532D', color: '#14532D', fontSize: '0.88rem' }}
          >
            <span>Register Provider</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 Primary Real Stat Cards Row */}
      <div className="row g-3.5 mb-4">
        {/* Card 1: Featured Primary Green Card (Total Bookings) */}
        <div className="col-sm-6 col-xl-3">
          <Link to="/admin/bookings" className="text-decoration-none">
            <div
              className="card border-0 p-4 h-100 text-white shadow-sm d-flex flex-column justify-content-between"
              style={{
                background: 'linear-gradient(135deg, #0B291A 0%, #14532D 100%)',
                borderRadius: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-600 font-size-090 opacity-90">Total Bookings</span>
                  <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div>
                  <span className="fw-800" style={{ fontSize: '2.5rem', lineHeight: 1 }}>{String(data.bookings ?? 0)}</span>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mt-3 pt-2" style={{ gap: '0.6rem' }}>
                <span className="rounded-pill font-size-075 fw-600" style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF', padding: '0.35rem 0.85rem' }}>
                  {data.confirmed ?? 0} Confirmed
                </span>
                <span className="rounded-pill font-size-075 fw-600" style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF', padding: '0.35rem 0.85rem' }}>
                  {data.pending ?? 0} Pending
                </span>
                <span className="rounded-pill font-size-075 fw-600" style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF', padding: '0.35rem 0.85rem' }}>
                  {data.cancelled ?? 0} Cancelled
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Card 2: Active Offerings */}
        <div className="col-sm-6 col-xl-3">
          <Link to="/admin/offerings" className="text-decoration-none">
            <div className="card border p-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>Active Offerings</span>
                  <div className="rounded-circle border text-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, borderColor: '#E2E8F0' }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div>
                  <span className="fw-800 text-dark" style={{ fontSize: '2.5rem', lineHeight: 1, color: '#0F172A' }}>{String(data.offerings ?? 0)}</span>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mt-3 pt-2" style={{ gap: '0.6rem' }}>
                <span className="rounded-pill font-size-075 fw-600 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569', padding: '0.35rem 0.85rem' }}>
                  {data.services ?? 0} Services
                </span>
                <span className="rounded-pill font-size-075 fw-600 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569', padding: '0.35rem 0.85rem' }}>
                  {data.activities ?? 0} Activities
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Card 3: Providers & Customers */}
        <div className="col-sm-6 col-xl-3">
          <Link to="/admin/providers" className="text-decoration-none">
            <div className="card border p-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>Registered Providers</span>
                  <div className="rounded-circle border text-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, borderColor: '#E2E8F0' }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div>
                  <span className="fw-800 text-dark" style={{ fontSize: '2.5rem', lineHeight: 1, color: '#0F172A' }}>{String(data.providers ?? 0)}</span>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mt-3 pt-2" style={{ gap: '0.6rem' }}>
                <span className="rounded-pill font-size-075 fw-600 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569', padding: '0.35rem 0.85rem' }}>
                  {data.customers ?? 0} Active Customers
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Card 4: Upcoming Events */}
        <div className="col-sm-6 col-xl-3">
          <Link to="/admin/events" className="text-decoration-none">
            <div className="card border p-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>Upcoming Events</span>
                  <div className="rounded-circle border text-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, borderColor: '#E2E8F0' }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div>
                  <span className="fw-800 text-dark" style={{ fontSize: '2.5rem', lineHeight: 1, color: '#0F172A' }}>{String(data.events ?? 0)}</span>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mt-3 pt-2" style={{ gap: '0.6rem' }}>
                <span className="rounded-pill font-size-075 fw-600 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569', padding: '0.35rem 0.85rem' }}>
                  Scheduled on Island
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Card 5: Active Restaurants */}
        <div className="col-sm-6 col-xl-3">
          <Link to="/admin/restaurants" className="text-decoration-none">
            <div className="card border p-4 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>Active Restaurants</span>
                  <div className="rounded-circle border text-dark d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, borderColor: '#E2E8F0' }}>
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <div>
                  <span className="fw-800 text-dark" style={{ fontSize: '2.5rem', lineHeight: 1, color: '#0F172A' }}>{String(data.restaurants ?? 0)}</span>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mt-3 pt-2" style={{ gap: '0.6rem' }}>
                <span className="rounded-pill font-size-075 fw-600 border" style={{ backgroundColor: '#FFF7ED', borderColor: '#FFEDD5', color: '#C2410C', padding: '0.35rem 0.85rem' }}>
                  Island Dining & Menus
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Main Split Section: Real Recent Bookings Table + Management Links */}
      <div className="row g-4">
        {/* Left Column: Real Recent Bookings Table */}
        <div className="col-lg-8">
          <div className="card border p-4 h-100 shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
              <div>
                <h5 className="fw-800 text-dark mb-0 font-size-100" style={{ color: '#0F172A' }}>Recent Reservations</h5>
                <span className="text-secondary font-size-080" style={{ color: '#64748B' }}>Latest booking activity submitted by customers</span>
              </div>
              <Link to="/admin/bookings" className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-size-075 fw-700 d-inline-flex align-items-center gap-1">
                <span>View All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr>
                    <th className="px-3 py-2.5 text-uppercase text-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>Reference</th>
                    <th className="py-2.5 text-uppercase text-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>Customer</th>
                    <th className="py-2.5 text-uppercase text-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>Offering</th>
                    <th className="py-2.5 text-uppercase text-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>Scheduled Date</th>
                    <th className="py-2.5 text-uppercase text-secondary" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No recent bookings recorded.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking: any) => (
                      <tr
                        key={booking.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = `/admin/bookings/${booking.id}`}
                      >
                        <td className="px-3 py-3 font-monospace fw-700 text-dark">
                          #{booking.booking_code || booking.id}
                        </td>
                        <td className="py-3 font-weight-semibold text-dark" style={{ fontWeight: 600 }}>
                          {booking.customer_name || '—'}
                        </td>
                        <td className="py-3 text-secondary">
                          {booking.offering_title || '—'}
                        </td>
                        <td className="py-3 text-secondary" style={{ fontSize: '0.82rem' }}>
                          {dateTime(booking.scheduled_at)}
                        </td>
                        <td className="py-3">
                          <StatusBadge value={booking.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Management Shortcuts & Live QR Log Summary */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-3 h-100">
            {/* Quick Actions Panel */}
            <div className="card border p-4 shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div className="pb-2.5 mb-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="fw-800 text-dark mb-0 font-size-100" style={{ color: '#0F172A' }}>Quick Actions</h5>
              </div>
              <div className="d-flex flex-column gap-2">
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/offerings/new">
                  <span>Create Offering</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/providers/new">
                  <span>Register Provider</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/events/new">
                  <span>Schedule Event</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/restaurants/new">
                  <span>Add Restaurant</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/stories/new">
                  <span>Add Island Story</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
                <Link className="btn btn-light btn-sm w-100 justify-content-between py-2.5 px-3 text-start d-flex align-items-center border" style={{ borderRadius: '0.75rem', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }} to="/admin/news/new">
                  <span>Publish News Article</span>
                  <Plus size={16} className="text-secondary" />
                </Link>
              </div>
            </div>

            {/* Operations & QR Scanner Card */}
            <div className="card border p-4 shadow-sm mt-auto" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>Scanner Check-ins</span>
                <ScanLine size={18} style={{ color: '#14532D' }} />
              </div>
              <div className="mb-2">
                <span className="fw-800 text-dark" style={{ fontSize: '2rem', lineHeight: 1, color: '#0F172A' }}>{String(data.validations ?? 0)}</span>
                <span className="text-secondary ms-2" style={{ fontSize: '0.85rem' }}>validations today</span>
              </div>
              <Link to="/admin/scan-logs" className="text-decoration-none font-weight-semibold font-size-085 text-success d-inline-flex align-items-center gap-1 mt-2" style={{ color: '#14532D', fontWeight: 700 }}>
                <span>View Full Scan Logs</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
