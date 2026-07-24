import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { providerBooking, providerBookings } from './provider.api';
import { ErrorState, LoadingState, EmptyState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dateTime } from '../../utils/format';
import { Calendar, User, Compass, Users, ArrowLeft, Eye } from 'lucide-react';

export function ProviderBookings() {
  const query = useQuery({
    queryKey: ['provider', 'bookings'],
    queryFn: providerBookings
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const items = query.data?.items || [];

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1 text-navy fw-800">My Bookings</h1>
        <p className="text-muted font-size-09">Overview of current customer reservations and activity enrollments.</p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 table-mobile-cards">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Offering</th>
                <th>Scheduled Date & Time</th>
                <th>Status</th>
                <th className="text-end" style={{ width: '120px' }} />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState message="No customer bookings assigned to you yet." />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Code">
                      <span className="font-monospace fw-700 text-navy">#{item.booking_code}</span>
                    </td>
                    <td data-label="Offering" className="fw-600 text-navy">
                      {item.offering_title}
                    </td>
                    <td data-label="Scheduled" className="text-muted">
                      {dateTime(item.scheduled_at)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="text-nowrap text-end" data-label="Actions">
                      <Link
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        to={`/provider/bookings/${item.id}`}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function ProviderBookingDetail() {
  const { id = '' } = useParams();
  const query = useQuery({
    queryKey: ['provider', 'bookings', id],
    queryFn: () => providerBooking(id)
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const data = query.data || {};
  const participants = Array.isArray(data.participants) ? data.participants : [];
  const owner = participants.find((p) => p.is_owner);
  const customerName = String(data.customer_name || owner?.full_name || 'Customer');

  return (
    <>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link className="btn btn-outline-secondary btn-sm px-2.5 py-1.5" to="/provider/bookings" aria-label="Go back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 mb-0 text-navy fw-800">Booking Summary</h1>
            <span className="font-monospace text-muted font-size-085">Code: #{data.booking_code}</span>
          </div>
        </div>
        <div>
          <StatusBadge value={data.status} />
        </div>
      </div>

      <div className="row g-4">
        {/* Reservation Card Details */}
        <div className="col-lg-8">
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                <Compass size={18} className="text-teal" />
                <span>Offering Details</span>
              </span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <span className="text-muted font-size-08 text-uppercase fw-600">Offering Title</span>
                  <p className="fw-700 text-navy fs-5 mb-0">{data.offering_title}</p>
                </div>
                <div className="col-md-6">
                  <span className="text-muted font-size-08 text-uppercase fw-600">Scheduled Date & Time</span>
                  <p className="fw-600 text-navy mb-0 d-flex align-items-center gap-1.5 mt-1">
                    <Calendar size={16} className="text-muted" />
                    {dateTime(data.scheduled_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attending roster */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                <Users size={18} className="text-teal" />
                <span>Participants roster ({participants.length})</span>
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>QR Code Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No participants registered.
                      </td>
                    </tr>
                  ) : (
                    participants.map((person) => (
                      <tr key={person.id}>
                        <td className="fw-600 text-navy">{person.full_name}</td>
                        <td>{person.phone}</td>
                        <td>
                          {person.is_owner ? (
                            <span className="badge bg-primary-subtle text-primary py-1 px-2">Primary Client</span>
                          ) : (
                            <span className="badge bg-light text-muted py-1 px-2">Guest</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge value={person.qr?.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Client side cards */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                <User size={18} className="text-teal" />
                <span>Customer Profile</span>
              </span>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="fw-700 text-navy mb-0.5 font-size-1">{customerName}</h4>
                  <span className="badge text-bg-secondary">Primary Booking Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
