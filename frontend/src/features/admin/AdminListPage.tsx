import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deleteResource, listResource, bookingAction, cancelQr } from './admin.api';
import { meta } from './resourceMeta';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmButton } from '../../components/common/ConfirmButton';
import type { ResourceRecord } from '../../types/models';
import { Search, Plus, Eye, Pencil, SlidersHorizontal, Filter } from 'lucide-react';

const cells = (record: ResourceRecord) =>
  Object.entries(record)
    .filter(
      ([key, value]) =>
        !['id', 'content', 'description', 'password_hash', 'image', 'logo', 'cover_image', 'public_token'].includes(key) &&
        typeof value !== 'object'
    )
    .slice(0, 6);

export function AdminListPage() {
  const { resource = 'stories' } = useParams();
  const descriptor = meta(resource);
  const [params, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', resource, params.toString()],
    queryFn: () => listResource(resource, params)
  });

  const mutation = useMutation({
    mutationFn: async ({ action, id }: { action: 'delete' | 'confirm' | 'cancel' | 'cancelQr'; id: string }) => {
      if (action === 'delete') return deleteResource(resource, id);
      if (action === 'cancelQr') return cancelQr(id);
      return bookingAction(id, action);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', resource] })
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

  const items = query.data?.items || [];
  const pagination = query.data?.pagination;

  return (
    <>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 text-navy fw-800 text-capitalize">{descriptor.title}</h1>
          <p className="text-muted font-size-09 mb-0">Manage and oversee all platform {descriptor.title.toLowerCase()}.</p>
        </div>
        {!descriptor.readonly && (
          <Link className="btn btn-primary d-inline-flex align-items-center gap-1.5" to={`/admin/${resource}/new`}>
            <Plus size={16} />
            <span>Create New</span>
          </Link>
        )}
      </div>

      {/* Toolbar / Filters */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-2.5 align-items-center">
            <div className="col-md">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  id="search"
                  className="form-control border-start-0 ps-0"
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
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Filter size={14} />
                  </span>
                  <select
                    aria-label="Type"
                    className="form-select border-start-0 ps-0"
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
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <SlidersHorizontal size={14} />
                  </span>
                  <select
                    aria-label="Status"
                    className="form-select border-start-0 ps-0"
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
          </div>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 table-mobile-cards">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                {items[0] &&
                  cells(items[0]).map(([key]) => (
                    <th key={key} className="text-capitalize">
                      {key.replaceAll('_', ' ')}
                    </th>
                  ))}
                <th className="text-end" style={{ width: '220px' }}>
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
                items.map((row) => (
                  <tr key={String(row.id)}>
                    <td data-label="ID">
                      <span className="font-monospace text-navy fw-600">#{String(row.id ?? '')}</span>
                    </td>
                    {cells(row).map(([key, value]) => (
                      <td key={key} data-label={key.replaceAll('_', ' ')}>
                        {key === 'is_active' || key === 'status' ? (
                          <StatusBadge value={value as string | boolean} />
                        ) : (
                          String(value ?? '—')
                        )}
                      </td>
                    ))}
                    <td className="text-nowrap text-end" data-label="Actions">
                      <div className="d-inline-flex gap-1.5">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={() => navigate(`/admin/${resource}/${row.id}`)}
                          title="View Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {!descriptor.readonly && (
                          <button
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                            onClick={() => navigate(`/admin/${resource}/${row.id}/edit`)}
                            title="Edit"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>
                        )}
                        {resource === 'bookings' && (
                          <>
                            <ConfirmButton
                              label="Confirm"
                              className="btn btn-sm btn-success text-white"
                              onConfirm={() => mutation.mutate({ action: 'confirm', id: String(row.id) })}
                            />
                            <ConfirmButton
                              label="Cancel"
                              className="btn btn-sm btn-outline-danger"
                              onConfirm={() => mutation.mutate({ action: 'cancel', id: String(row.id) })}
                            />
                          </>
                        )}
                        {resource === 'qr-codes' && (
                          <ConfirmButton
                            label="Cancel QR"
                            className="btn btn-sm btn-outline-danger"
                            onConfirm={() => mutation.mutate({ action: 'cancelQr', id: String(row.id) })}
                          />
                        )}
                        {!descriptor.readonly && (
                          <ConfirmButton
                            label="Delete"
                            className="btn btn-sm btn-danger text-white"
                            onConfirm={() => mutation.mutate({ action: 'delete', id: String(row.id) })}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination data={pagination} onPage={(page) => set('page', String(page))} />

      {mutation.isError && (
        <div className="alert alert-danger mt-3" role="alert">
          <span>{mutation.error.message}</span>
        </div>
      )}
    </>
  );
}
