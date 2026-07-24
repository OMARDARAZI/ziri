import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getResource } from './admin.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { ResourceRecord } from '../../types/models';
import { ArrowLeft, Calendar, User, Compass, Building, Phone, DollarSign, Users, Clock } from 'lucide-react';
import { dateTime } from '../../utils/format';

function formatValue(item: unknown) {
  if (typeof item === 'boolean') return item ? 'Yes' : 'No';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (item === null || item === undefined) return '—';
  return JSON.stringify(item);
}

function isRecord(item: unknown): item is ResourceRecord {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

export function AdminDetailPage() {
  const { resource = 'stories', id = '' } = useParams();

  const query = useQuery({
    queryKey: ['admin', resource, id],
    queryFn: () => getResource(resource, id)
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const data = query.data || {};
  const participants = Array.isArray(data.participants) ? data.participants.filter(isRecord) : [];

  // Specialized Booking Details View
  if (resource === 'bookings') {
    return (
      <>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <Link className="btn btn-outline-secondary btn-sm px-2.5 py-1.5" to="/admin/bookings" aria-label="Go back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h3 mb-0 text-navy fw-800">Booking Details</h1>
              <span className="font-monospace text-muted font-size-085">ID: #{data.id}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <StatusBadge value={data.status as string} />
          </div>
        </div>

        <div className="row g-4">
          {/* Main Booking Summary */}
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
                    <span className="text-muted font-size-08 text-uppercase fw-600">Offering Name</span>
                    <p className="fw-700 text-navy fs-5 mb-0">{formatValue(data.offering_title)}</p>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Provider</span>
                    <p className="fw-600 text-navy fs-6 mb-0 d-flex align-items-center gap-1.5">
                      <Building size={16} className="text-muted" />
                      {formatValue(data.provider_name)}
                    </p>
                  </div>
                  <div className="col-12"><hr className="my-2" /></div>
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Scheduled Date & Time</span>
                    <p className="fw-600 text-navy mb-0 d-flex align-items-center gap-1.5">
                      <Calendar size={16} className="text-muted" />
                      {dateTime(data.scheduled_at as string)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Creation Date</span>
                    <p className="fw-500 text-muted mb-0 d-flex align-items-center gap-1.5">
                      <Clock size={16} />
                      {dateTime(data.created_at as string)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants list */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent py-3">
                <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                  <Users size={18} className="text-teal" />
                  <span>Participants Roster ({participants.length})</span>
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Ticket QR Token</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">No participants registered.</td>
                      </tr>
                    ) : (
                      participants.map((person) => {
                        const qr = isRecord(person.qr) ? person.qr : null;
                        return (
                          <tr key={String(person.id)}>
                            <td className="fw-600 text-navy">{formatValue(person.full_name)}</td>
                            <td>{formatValue(person.phone)}</td>
                            <td className="font-monospace font-size-085 text-muted">
                              {qr ? formatValue(qr.public_token).slice(0, 12) + '...' : '—'}
                            </td>
                            <td>
                              {qr ? (
                                <StatusBadge value={qr.status as string} />
                              ) : (
                                <span className="badge bg-secondary">No QR</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pricing & Customer Cards */}
          <div className="col-lg-4">
            {/* Customer Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent py-3">
                <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                  <User size={18} className="text-teal" />
                  <span>Customer Profile</span>
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                    {data.customer_name ? String(data.customer_name).charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="fw-700 text-navy mb-0.5 font-size-1">{formatValue(data.customer_name)}</h4>
                    <span className="badge text-bg-secondary">Customer</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 font-size-09 text-muted pt-2 border-top">
                  <div className="d-flex align-items-center gap-2">
                    <Phone size={15} />
                    <span>{formatValue(data.customer_phone)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent py-3">
                <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                  <DollarSign size={18} className="text-teal" />
                  <span>Financial Summary</span>
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Unit Price</span>
                  <span className="fw-600 text-navy">
                    {data.currency === 'USD' ? `$${formatValue(data.price)}` : `${formatValue(data.price)} LBP`}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Participants count</span>
                  <span className="fw-600 text-navy">× {formatValue(data.participant_count)}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 mt-2">
                  <span className="fw-700 text-navy">Total Amount</span>
                  <span className="fw-800 text-teal font-size-12">
                    {data.currency === 'USD' ? `$${formatValue(data.total_amount)}` : `${formatValue(data.total_amount)} LBP`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // General Details View for other resources
  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link className="btn btn-outline-secondary btn-sm px-2.5 py-1.5" to={`/admin/${resource}`} aria-label="Go back">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 mb-0 text-navy fw-800 text-capitalize">{resource.replaceAll('-', ' ')}</h1>
            <span className="font-monospace text-muted font-size-085">ID: #{id}</span>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <dl className="row mb-0 g-3">
            {Object.entries(data)
              .filter(([key]) => !['password_hash', 'public_token', 'participants', 'qr'].includes(key))
              .map(([key, item]) => (
                <div key={key} className="col-md-6 border-bottom pb-2.5">
                  <dt className="text-muted font-size-08 text-uppercase fw-600 mb-1">{key.replaceAll('_', ' ')}</dt>
                  <dd className="mb-0 text-navy fw-500">
                    {key.includes('status') || key === 'is_active' ? (
                      <StatusBadge value={item as string | boolean} />
                    ) : (
                      formatValue(item)
                    )}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {participants.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent py-3">
            <h2 className="fw-700 text-navy font-size-095 mb-0">Registered Participants</h2>
          </div>
          <div className="card-body">
            <ul className="list-group list-group-flush mb-0">
              {participants.map((participant) => (
                <li key={String(participant.id)} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2.5">
                  <div>
                    <span className="fw-600 text-navy d-block">{formatValue(participant.full_name)}</span>
                    <span className="text-muted font-size-08">{formatValue(participant.phone)}</span>
                  </div>
                  {isRecord(participant.qr) && (
                    <StatusBadge value={participant.qr.status as string} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
