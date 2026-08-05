import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getResource } from './admin.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { ResourceRecord } from '../../types/models';
import {
  ArrowLeft,
  Calendar,
  User,
  Compass,
  Building,
  Phone,
  DollarSign,
  Users,
  Clock,
  Pencil,
  MapPin,
  Star,
  UtensilsCrossed,
  Tag,
  FileText,
  Info
} from 'lucide-react';
import { dateTime } from '../../utils/format';

function formatValue(item: unknown): string {
  if (typeof item === 'boolean') return item ? 'Active / Yes' : 'Inactive / No';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (item === null || item === undefined) return '—';
  return JSON.stringify(item, null, 2);
}

function isRecord(item: unknown): item is ResourceRecord {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

function getMediaUrl(row: ResourceRecord): string | null {
  const url = (row.image || row.media_url || row.image_url || row.cover_image_url || row.logo_url || row.icon_url || row.cover_image || row.logo) as string | undefined;
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
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
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <Link className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} to="/admin/bookings" aria-label="Go back">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="h3 mb-0 text-navy fw-800" style={{ color: '#0F172A' }}>Booking Details</h1>
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
            <div className="card mb-4 border shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0' }}>
              <div className="card-header bg-transparent py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <span className="fw-700 font-size-095 d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
                  <Compass size={18} className="text-success" style={{ color: '#14532D' }} />
                  <span>Offering Details</span>
                </span>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Offering Name</span>
                    <p className="fw-700 text-navy fs-5 mb-0" style={{ color: '#0F172A' }}>{formatValue(data.offering_title)}</p>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Provider</span>
                    <p className="fw-600 text-navy fs-6 mb-0 d-flex align-items-center gap-1.5" style={{ color: '#0F172A' }}>
                      <Building size={16} className="text-muted" />
                      {formatValue(data.provider_name)}
                    </p>
                  </div>
                  <div className="col-12"><hr className="my-2" /></div>
                  <div className="col-md-6">
                    <span className="text-muted font-size-08 text-uppercase fw-600">Scheduled Date & Time</span>
                    <p className="fw-600 text-navy mb-0 d-flex align-items-center gap-1.5" style={{ color: '#0F172A' }}>
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
            <div className="card border shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0' }}>
              <div className="card-header bg-transparent py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <span className="fw-700 font-size-095 d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
                  <Users size={18} className="text-success" style={{ color: '#14532D' }} />
                  <span>Participants Roster ({participants.length})</span>
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4">Name</th>
                      <th>Phone</th>
                      <th>Ticket QR Token</th>
                      <th className="pe-4">Status</th>
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
                            <td className="fw-600 ps-4" style={{ color: '#0F172A' }}>{formatValue(person.full_name)}</td>
                            <td>{formatValue(person.phone)}</td>
                            <td className="font-monospace font-size-085 text-muted">
                              {qr ? formatValue(qr.public_token).slice(0, 12) + '...' : '—'}
                            </td>
                            <td className="pe-4">
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
            {/* Customer Profile */}
            <div className="card border shadow-sm mb-4" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0' }}>
              <div className="card-header bg-transparent py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <span className="fw-700 font-size-095 d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
                  <User size={18} className="text-success" style={{ color: '#14532D' }} />
                  <span>Customer Profile</span>
                </span>
              </div>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="user-avatar rounded-circle text-white fw-700 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#14532D', fontSize: '1.1rem' }}>
                    {data.customer_name ? String(data.customer_name).charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="fw-700 text-navy mb-0.5 font-size-1" style={{ color: '#0F172A' }}>{formatValue(data.customer_name)}</h4>
                    <span className="badge bg-light text-secondary border">Customer</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 font-size-09 text-muted pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Phone size={15} />
                    <span>{formatValue(data.customer_phone)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="card border shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0' }}>
              <div className="card-header bg-transparent py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <span className="fw-700 font-size-095 d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
                  <DollarSign size={18} className="text-success" style={{ color: '#14532D' }} />
                  <span>Financial Summary</span>
                </span>
              </div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Unit Price</span>
                  <span className="fw-600" style={{ color: '#0F172A' }}>
                    {data.currency === 'USD' ? `$${formatValue(data.price)}` : `${formatValue(data.price)} LBP`}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Participants count</span>
                  <span className="fw-600" style={{ color: '#0F172A' }}>× {formatValue(data.participant_count)}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 mt-2" style={{ borderColor: '#F1F5F9' }}>
                  <span className="fw-700" style={{ color: '#0F172A' }}>Total Amount</span>
                  <span className="fw-800 text-success font-size-12" style={{ color: '#14532D' }}>
                    {data.currency === 'USD' ? `$${formatValue(data.total_amount)}` : `${formatValue(data.total_amount)} LBP`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General Details View for Content & Entity Resources (News, Events, Restaurants, Stories, Providers, Offerings, etc.)
  const mediaUrl = getMediaUrl(data);
  const title = String(data.title || data.name || data.business_name || `${resource.replaceAll('-', ' ')} #${id}`);
  const description = String(data.content || data.description || '');
  const dateVal = data.story_time ?? data.published_at ?? data.event_date ?? data.created_at;
  const isVideo = mediaUrl?.toLowerCase().endsWith('.mp4') || mediaUrl?.toLowerCase().endsWith('.mov') || mediaUrl?.toLowerCase().endsWith('.webm');

  // Restaurant Menu items parsing if available
  let parsedMenu: Array<{ category?: string; name?: string; description?: string; price_usd?: number; price_lbp?: number; price?: string }> = [];
  if (data.menu_items) {
    try {
      const raw = typeof data.menu_items === 'string' ? JSON.parse(data.menu_items) : data.menu_items;
      if (Array.isArray(raw)) parsedMenu = raw;
    } catch {
      parsedMenu = [];
    }
  }

  // Filter out core fields & timestamps already prominently displayed in key info
  const filterKeys = [
    'id', 'title', 'name', 'business_name', 'content', 'description', 'image', 'media_url', 'image_url',
    'cover_image_url', 'logo_url', 'cover_image', 'logo', 'menu_items', 'password_hash', 'public_token',
    'participants', 'qr', 'created_at', 'updated_at', 'published_at', 'is_active', 'story_time', 'event_date',
    'location', 'cuisine_type', 'opening_time', 'closing_time', 'phone', 'rating', 'price_range'
  ];
  const detailEntries = Object.entries(data).filter(([key]) => !filterKeys.includes(key));

  return (
    <div className="animate-fade-in-up">
      {/* 1. Header Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link
            to={`/admin/${resource}`}
            className="btn btn-light border rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 40, height: 40, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            aria-label="Back to List"
          >
            <ArrowLeft size={18} style={{ color: '#0F172A' }} />
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill text-uppercase px-2.5 py-1 font-size-075 fw-700" style={{ backgroundColor: '#F1F5F9', color: '#475569', letterSpacing: '0.5px' }}>
                {resource.replaceAll('-', ' ')}
              </span>
              <StatusBadge value={data.is_active ?? data.status ?? true} />
            </div>
            <h1 className="h3 mb-0 fw-800 text-dark mt-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>{title}</h1>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2.5">
          <Link
            to={`/admin/${resource}/${id}/edit`}
            className="btn text-white rounded-pill px-4 py-2 fw-700 d-inline-flex align-items-center gap-2 shadow-sm"
            style={{ backgroundColor: '#14532D', border: 'none', fontSize: '0.88rem' }}
          >
            <Pencil size={16} />
            <span>Edit {resource.replaceAll('-', ' ').replace(/s$/, '')}</span>
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Media Hero + Main Content */}
        <div className="col-lg-8">
          {/* Cover Media Card */}
          {mediaUrl && (
            <div
              className="card border-0 shadow-sm overflow-hidden mb-4"
              style={{ borderRadius: '1.5rem', backgroundColor: '#0F172A', position: 'relative' }}
            >
              {isVideo ? (
                <video
                  src={mediaUrl}
                  controls
                  autoPlay
                  muted
                  className="w-100"
                  style={{ maxHeight: 420, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={title}
                  className="w-100"
                  style={{ maxHeight: 420, objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
          )}

          {/* Main Article / Entity Body Card */}
          <div className="card border shadow-sm p-4 p-md-5 mb-4" style={{ borderRadius: '1.5rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <FileText size={20} style={{ color: '#14532D' }} />
              <h4 className="fw-800 text-dark mb-0" style={{ color: '#0F172A' }}>Overview & Details</h4>
            </div>

            {description ? (
              <div
                className="text-dark font-size-100"
                style={{
                  lineHeight: 1.7,
                  color: '#334155',
                  whiteSpace: 'pre-line',
                  fontSize: '1.02rem',
                  fontWeight: 450
                }}
              >
                {description}
              </div>
            ) : (
              <p className="text-muted italic mb-0">No description provided for this record.</p>
            )}
          </div>

          {/* Restaurant Menu Showcase Section */}
          {parsedMenu.length > 0 && (
            <div className="card border shadow-sm p-4 p-md-5 mb-4" style={{ borderRadius: '1.5rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <div className="d-flex align-items-center gap-2">
                  <UtensilsCrossed size={22} style={{ color: '#C2410C' }} />
                  <h4 className="fw-800 text-dark mb-0" style={{ color: '#0F172A' }}>Dining Menu ({parsedMenu.length} Items)</h4>
                </div>
                <span className="badge rounded-pill px-3 py-1.5 fw-700" style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5' }}>
                  Full Menu List
                </span>
              </div>

              <div className="row g-3">
                {parsedMenu.map((item, idx) => (
                  <div key={idx} className="col-md-6">
                    <div className="p-3.5 border rounded-4 h-100" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '1rem' }}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <h6 className="fw-700 text-dark mb-0" style={{ color: '#0F172A' }}>{item.name || `Item #${idx + 1}`}</h6>
                        <span className="fw-800 text-success font-size-090" style={{ color: '#14532D' }}>
                          {item.price_usd ? `$${item.price_usd}` : item.price_lbp ? `${item.price_lbp} LBP` : item.price || ''}
                        </span>
                      </div>
                      {item.category && (
                        <span className="badge bg-white text-secondary border font-size-075 fw-600 mb-2">
                          {item.category}
                        </span>
                      )}
                      {item.description && (
                        <p className="text-muted font-size-085 mb-0" style={{ lineHeight: 1.45 }}>{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata & Specs Card */}
        <div className="col-lg-4">
          <div className="card border shadow-sm p-4 mb-4" style={{ borderRadius: '1.5rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
            <h5 className="fw-800 text-dark mb-3 pb-2 border-bottom" style={{ color: '#0F172A', borderColor: '#F1F5F9' }}>
              Key Information
            </h5>

            <div className="d-flex flex-column gap-3.5">
              {/* Publication / Status badge */}
              {(data.is_active !== undefined || data.status !== undefined) && (
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-secondary font-size-080 fw-600 text-uppercase">Status</span>
                  <StatusBadge value={data.is_active ?? data.status ?? true} />
                </div>
              )}

              {dateVal && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}>
                    <Calendar size={18} style={{ color: '#14532D' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Date & Time</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>{dateTime(String(dateVal))}</span>
                  </div>
                </div>
              )}

              {data.location && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}>
                    <MapPin size={18} style={{ color: '#14532D' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Location</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>{String(data.location)}</span>
                  </div>
                </div>
              )}

              {data.cuisine_type && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FFF7ED', width: 36, height: 36 }}>
                    <UtensilsCrossed size={18} style={{ color: '#C2410C' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Cuisine Type</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>{String(data.cuisine_type)}</span>
                  </div>
                </div>
              )}

              {(data.opening_time || data.closing_time) && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}>
                    <Clock size={18} style={{ color: '#14532D' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Operating Hours</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>
                      🕒 {String(data.opening_time || '10:00 AM')} - {String(data.closing_time || '11:00 PM')}
                    </span>
                  </div>
                </div>
              )}

              {data.phone && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}>
                    <Phone size={18} style={{ color: '#14532D' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Contact Phone</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>{String(data.phone)}</span>
                  </div>
                </div>
              )}

              {data.rating && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FEFCE8', width: 36, height: 36 }}>
                    <Star size={18} style={{ color: '#EAB308' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Rating</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>⭐ {String(data.rating)} / 5.0</span>
                  </div>
                </div>
              )}

              {data.price_range && (
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}>
                    <Tag size={18} style={{ color: '#14532D' }} />
                  </div>
                  <div>
                    <span className="text-secondary d-block font-size-075 fw-600 text-uppercase">Price Range</span>
                    <span className="fw-700 text-dark font-size-090" style={{ color: '#0F172A' }}>{String(data.price_range)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom attributes if any non-timestamp fields remain */}
            {detailEntries.length > 0 && (
              <div className="pt-3 mt-3 border-top d-flex flex-column gap-2" style={{ borderColor: '#F1F5F9' }}>
                {detailEntries.map(([key, item]) => (
                  <div key={key} className="d-flex align-items-center justify-content-between font-size-085">
                    <span className="text-secondary text-capitalize">{key.replaceAll('_', ' ')}</span>
                    <span className="fw-600 text-dark">{formatValue(item)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamps footer */}
            {(data.published_at || data.created_at || data.updated_at) && (
              <div className="pt-3 mt-3 border-top d-flex flex-column gap-1.5 font-size-080 text-muted" style={{ borderColor: '#F1F5F9' }}>
                {data.published_at && (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Published</span>
                    <span className="fw-600 text-dark">{dateTime(String(data.published_at))}</span>
                  </div>
                )}
                {data.created_at && (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Created</span>
                    <span className="fw-600 text-dark">{dateTime(String(data.created_at))}</span>
                  </div>
                )}
                {data.updated_at && (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Last Updated</span>
                    <span className="fw-600 text-dark">{dateTime(String(data.updated_at))}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
