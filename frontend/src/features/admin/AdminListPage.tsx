import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deleteResource, listResource, bookingAction, cancelQr, saveResource } from './admin.api';
import { meta } from './resourceMeta';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmButton } from '../../components/common/ConfirmButton';
import type { ResourceRecord } from '../../types/models';
import { Search, Plus, Eye, Pencil, SlidersHorizontal, Filter, LayoutGrid, List as ListIcon, Calendar, Play, GripVertical } from 'lucide-react';

function formatDateSafe(val: unknown): string {
  if (!val) return '';
  try {
    const raw = String(val).trim();
    if (!raw) return '';
    const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(val);
  }
}

function getMediaUrl(row: ResourceRecord): string | null {
  const url = (row.image || row.media_url || row.image_url || row.cover_image_url || row.logo_url || row.icon_url || row.cover_image || row.logo) as string | undefined;
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
}

function VideoThumbnail({ src, alt }: { src: string; alt: string }) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 0.1;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          if (isMounted) setPosterUrl(dataUrl);
        }
      } catch {
        // Fallback to video loop
      }
    };

    video.addEventListener('seeked', handleSeeked);
    video.load();

    return () => {
      isMounted = false;
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [src]);

  if (posterUrl) {
    return <img src={posterUrl} alt={alt} className="w-100 h-100" style={{ objectFit: 'cover' }} />;
  }

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="w-100 h-100"
      style={{ objectFit: 'cover' }}
    />
  );
}

const cells = (record: ResourceRecord) =>
  Object.entries(record)
    .filter(
      ([key, value]) =>
        !['id', 'content', 'description', 'password_hash', 'image', 'logo', 'cover_image', 'public_token', 'media_url', 'image_url', 'cover_image_url', 'icon_url', 'display_order'].includes(key) &&
        typeof value !== 'object'
    )
    .slice(0, 6);

export function AdminListPage() {
  const { resource = 'stories' } = useParams();
  const descriptor = meta(resource);
  const [params, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();

  const isContentResource = ['stories', 'news', 'events', 'restaurants', 'safety-tips', 'offerings'].includes(resource);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(isContentResource ? 'grid' : 'table');

  const query = useQuery({
    queryKey: ['admin', resource, params.toString()],
    queryFn: () => listResource(resource, params)
  });

  const [itemsList, setItemsList] = useState<ResourceRecord[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    if (query.data?.items) {
      setItemsList(query.data.items);
    }
  }, [query.data?.items]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex) return;

    const nextItems = [...itemsList];
    const [movedItem] = nextItems.splice(draggedIdx, 1);
    nextItems.splice(dropIndex, 0, movedItem);

    setItemsList(nextItems);
    setDraggedIdx(null);
    setIsSavingOrder(true);

    try {
      await Promise.all(
        nextItems.map((item, idx) =>
          saveResource(resource, String(item.id), { display_order: idx + 1 })
        )
      );
      void client.invalidateQueries({ queryKey: ['admin', resource] });
    } catch (err) {
      console.error('Failed to update display order:', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async ({ action, id }: { action: 'delete' | 'confirm' | 'cancel' | 'cancelQr'; id: string }) => {
      if (action === 'delete') return deleteResource(resource, id);
      if (action === 'cancelQr') return cancelQr(id);
      return bookingAction(id, action);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', resource] }),
    onError: (error: any) => {
      alert(error?.response?.data?.message || error?.message || 'Failed to update status. Please try again.');
    }
  });

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const items = itemsList;
  const pagination = query.data?.pagination;

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 text-dark fw-800 text-capitalize" style={{ color: '#0F172A' }}>{descriptor.title}</h1>
          <p className="text-secondary font-size-09 mb-0" style={{ color: '#64748B' }}>Manage and publish platform {descriptor.title.toLowerCase()}.</p>
        </div>
        {!descriptor.readonly && (
          <Link
            className="btn text-white rounded-pill px-4 py-2.5 fw-700 d-inline-flex align-items-center gap-2 shadow-sm"
            style={{ backgroundColor: '#14532D', border: 'none', fontSize: '0.88rem' }}
            to={`/admin/${resource}/new`}
          >
            <Plus size={18} />
            <span>Create New {descriptor.title.endsWith('ies') ? descriptor.title.slice(0, -3) + 'y' : descriptor.title.endsWith('s') ? descriptor.title.slice(0, -1) : descriptor.title}</span>
          </Link>
        )}
      </div>

      {/* Toolbar / Filters + View Switcher */}
      <div className="card mb-4 border shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-3">
          <div className="row g-2.5 align-items-center">
            <div className="col-md">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted rounded-start-pill ps-3">
                  <Search size={16} />
                </span>
                <input
                  id="search"
                  className="form-control border-start-0 ps-0 rounded-end-pill"
                  defaultValue={params.get('search') || ''}
                  onChange={(event) => set('search', event.target.value)}
                  placeholder={`Search ${descriptor.title.toLowerCase()}...`}
                  aria-label="Search"
                />
              </div>
            </div>

            {['offerings'].includes(resource) && (
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted rounded-start-pill ps-3">
                    <Filter size={14} />
                  </span>
                  <select
                    aria-label="Type"
                    className="form-select border-start-0 ps-0 rounded-end-pill"
                    value={params.get('type') || ''}
                    onChange={(event) => set('type', event.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="SERVICE">Service</option>
                    <option value="ACTIVITY">Activity</option>
                  </select>
                </div>
              </div>
            )}

            {['bookings', 'qr-codes'].includes(resource) && (
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted rounded-start-pill ps-3">
                    <SlidersHorizontal size={14} />
                  </span>
                  <select
                    aria-label="Status"
                    className="form-select border-start-0 ps-0 rounded-end-pill"
                    value={params.get('status') || ''}
                    onChange={(event) => set('status', event.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'ACTIVE', 'USED', 'EXPIRED'].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Layout Toggle Buttons */}
            {isSavingOrder && (
              <div className="col-auto">
                <span className="badge bg-success text-white rounded-pill px-3 py-1.5 font-size-080 fw-600 animate-pulse">
                  Saving order…
                </span>
              </div>
            )}

            <div className="col-auto ms-auto d-flex align-items-center gap-1 bg-light p-1 rounded-pill border" style={{ borderColor: '#E2E8F0' }}>
              <button
                className={`btn btn-sm rounded-circle p-1.5 d-flex align-items-center justify-content-center ${viewMode === 'grid' ? 'btn-white shadow-sm border text-dark' : 'text-muted'}`}
                style={{ width: 32, height: 32, backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent' }}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`btn btn-sm rounded-circle p-1.5 d-flex align-items-center justify-content-center ${viewMode === 'table' ? 'btn-white shadow-sm border text-dark' : 'text-muted'}`}
                style={{ width: 32, height: 32, backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent' }}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' ? (
        items.length === 0 ? (
          <div className="card border-0 p-5 shadow-sm text-center" style={{ borderRadius: '1.25rem' }}>
            <EmptyState message={`No ${descriptor.title.toLowerCase()} created yet.`} />
          </div>
        ) : (
          <div className="row g-4 mb-4">
            {items.map((row, index) => {
              const mediaUrl = getMediaUrl(row);
              const title = String(row.title || row.business_name || row.name || `Record #${row.id}`);
              const snippet = String(row.content || row.description || '');
              const dateVal = row.story_time ?? row.published_at ?? row.event_date ?? row.created_at;
              const dateStr = typeof dateVal === 'string' || typeof dateVal === 'number' ? String(dateVal) : null;
              const isVideo = mediaUrl?.toLowerCase().endsWith('.mp4') || mediaUrl?.toLowerCase().endsWith('.mov') || mediaUrl?.toLowerCase().endsWith('.webm');
              const isDraggingThis = draggedIdx === index;

              return (
                <div
                  className="col-md-6 col-lg-4"
                  key={String(row.id)}
                  draggable={!descriptor.readonly}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    opacity: isDraggingThis ? 0.35 : 1,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    cursor: !descriptor.readonly ? 'grab' : 'default'
                  }}
                >
                  <div
                    className="card border h-100 shadow-sm overflow-hidden d-flex flex-column"
                    style={{
                      borderRadius: '1.25rem',
                      backgroundColor: '#FFFFFF',
                      borderColor: isDraggingThis ? '#14532D' : '#E2E8F0',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Editorial Cover Media Header */}
                    <div
                      className="position-relative bg-dark cursor-pointer overflow-hidden"
                      style={{ height: 210 }}
                      onClick={() => navigate(`/admin/${resource}/${row.id}`)}
                    >
                      {/* Drag Handle Badge */}
                      {!descriptor.readonly && (
                        <div
                          className="position-absolute text-white rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5 shadow"
                          style={{ top: 12, left: 12, zIndex: 10, backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15, 23, 42, 0.85)', fontSize: '0.75rem', cursor: 'grab' }}
                          title="Drag to reorder"
                        >
                          <GripVertical size={14} />
                          <span className="fw-700">#{index + 1}</span>
                        </div>
                      )}

                      {mediaUrl ? (
                        isVideo ? (
                          <div className="position-relative w-100 h-100">
                            <VideoThumbnail src={mediaUrl} alt={title} />
                            <div
                              className="position-absolute top-50 start-50 translate-middle rounded-circle text-white d-flex align-items-center justify-content-center shadow"
                              style={{ width: 44, height: 44, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', pointerEvents: 'none' }}
                            >
                              <Play size={18} className="ms-0.5" fill="#FFFFFF" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={title}
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                        )
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted fw-600" style={{ fontSize: '0.85rem' }}>
                          No Image Uploaded
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="position-absolute d-flex align-items-center justify-content-between w-100 px-3" style={{ top: 12, right: 0 }}>
                        <div className="ms-auto">
                          <StatusBadge value={(row.is_active ?? row.status ?? true) as string | boolean | null | undefined} />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 d-flex flex-column flex-grow-1">
                      <h5
                        className="fw-800 text-dark mb-2 cursor-pointer text-truncate"
                        style={{ color: '#0F172A', fontSize: '1.05rem', lineHeight: 1.3 }}
                        onClick={() => navigate(`/admin/${resource}/${row.id}`)}
                      >
                        {title}
                      </h5>

                      {Boolean(snippet) && (
                        <p className="text-secondary mb-3" style={{ color: '#475569', fontSize: '0.86rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 42, lineHeight: 1.5 }}>
                          {snippet}
                        </p>
                      )}

                      {dateStr && (
                        <div className="d-flex align-items-center gap-1.5 text-muted font-size-080 mb-3" style={{ color: '#64748B' }}>
                          <Calendar size={14} />
                          <span>{formatDateSafe(dateStr)}</span>
                        </div>
                      )}

                      {/* Editorial Card Action Footer */}
                      <div className="pt-3 border-top d-flex align-items-center justify-content-between gap-2 mt-auto" style={{ borderColor: '#F1F5F9' }}>
                        <button
                          className="btn btn-light border btn-sm rounded-pill px-3.5 py-1.5 font-size-080 fw-600 d-inline-flex align-items-center gap-1.5"
                          onClick={() => navigate(`/admin/${resource}/${row.id}/edit`)}
                        >
                          <Pencil size={14} />
                          <span>Edit</span>
                        </button>
                        {!descriptor.readonly && (
                          <ConfirmButton
                            label="Delete"
                            className="btn btn-outline-danger btn-sm rounded-pill px-3.5 py-1.5 font-size-080 fw-600"
                            onConfirm={() => mutation.mutate({ action: 'delete', id: String(row.id) })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table View Mode */
        <div className="card border shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="px-4 py-3" style={{ width: '100px' }}>Order / ID</th>
                  {items[0] &&
                    cells(items[0]).map(([key]) => (
                      <th key={key} className="py-3 text-capitalize text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {key.replaceAll('_', ' ')}
                      </th>
                    ))}
                  <th className="py-3 text-end px-4" style={{ width: '220px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <EmptyState message={`No ${descriptor.title.toLowerCase()} recorded yet.`} />
                    </td>
                  </tr>
                ) : (
                  items.map((row, index) => {
                    const isDraggingThis = draggedIdx === index;
                    return (
                      <tr
                        key={String(row.id)}
                        draggable={!descriptor.readonly}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          opacity: isDraggingThis ? 0.35 : 1,
                          backgroundColor: isDraggingThis ? '#F1F5F9' : undefined,
                          cursor: !descriptor.readonly ? 'grab' : 'default'
                        }}
                      >
                        <td className="px-4 py-3 font-monospace fw-700 text-dark">
                          <div className="d-flex align-items-center gap-2">
                            {!descriptor.readonly && (
                              <span title="Drag to reorder">
                                <GripVertical size={15} className="text-secondary cursor-grab" />
                              </span>
                            )}
                            <span>#{String(row.id ?? '')}</span>
                          </div>
                        </td>
                        {cells(row).map(([key, value]) => (
                          <td key={key} className="py-3">
                            {key === 'is_active' || key === 'status' ? (
                              <StatusBadge value={value as string | boolean} />
                            ) : (
                              String(value ?? '—')
                            )}
                          </td>
                        ))}
                        <td className="text-nowrap text-end px-4 py-3">
                          <div className="d-inline-flex gap-1.5">
                            <button
                              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 font-size-075 fw-600"
                              onClick={() => navigate(`/admin/${resource}/${row.id}`)}
                              title="View Details"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                            {!descriptor.readonly && (
                              <button
                                className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 font-size-075 fw-600"
                                onClick={() => navigate(`/admin/${resource}/${row.id}/edit`)}
                                title="Edit"
                              >
                                <Pencil size={13} />
                                <span>Edit</span>
                              </button>
                            )}
                            {resource === 'bookings' && (
                              <>
                                {(row.status === 'PENDING' || row.status === undefined) && (
                                  <ConfirmButton
                                    label="Confirm"
                                    className="btn btn-sm btn-success text-white rounded-pill px-2.5 py-1 font-size-075 fw-600"
                                    onConfirm={() => mutation.mutate({ action: 'confirm', id: String(row.id) })}
                                  />
                                )}
                                {['PENDING', 'CONFIRMED'].includes(String(row.status)) && (
                                  <ConfirmButton
                                    label="Cancel"
                                    className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 font-size-075 fw-600"
                                    onConfirm={() => mutation.mutate({ action: 'cancel', id: String(row.id) })}
                                  />
                                )}
                              </>
                            )}
                            {resource === 'qr-codes' && (
                              <ConfirmButton
                                label="Cancel QR"
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 font-size-075 fw-600"
                                onConfirm={() => mutation.mutate({ action: 'cancelQr', id: String(row.id) })}
                              />
                            )}
                            {!descriptor.readonly && (
                              <ConfirmButton
                                label="Delete"
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 font-size-075 fw-600"
                                onConfirm={() => mutation.mutate({ action: 'delete', id: String(row.id) })}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination data={pagination} onPage={(page) => set('page', String(page))} />

      {mutation.isError && (
        <div className="alert alert-danger mt-3" role="alert">
          <span>{mutation.error.message}</span>
        </div>
      )}
    </div>
  );
}
