import { useQuery } from '@tanstack/react-query';
import { providerHistory } from './provider.api';
import { ErrorState, LoadingState, EmptyState } from '../../components/common/States';
import { StatusBadge } from '../../components/common/StatusBadge';
import { dateTime } from '../../utils/format';
import { Clock } from 'lucide-react';

export function ProviderHistory() {
  const query = useQuery({
    queryKey: ['provider', 'history'],
    queryFn: providerHistory
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const items = query.data || [];

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1 text-navy fw-800">Scan History Logs</h1>
        <p className="text-muted font-size-09">Detailed auditing feed of all client digital ticket validation actions.</p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 table-mobile-cards">
            <thead>
              <tr>
                <th>Verification Date & Time</th>
                <th>Validation Result</th>
                <th>System Message</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-0">
                    <EmptyState message="No ticket validations have been logged yet." />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={String(item.id)}>
                    <td data-label="When" className="text-muted d-inline-flex align-items-center gap-1.5 border-0">
                      <Clock size={14} className="text-muted" />
                      <span>{dateTime(item.created_at as string)}</span>
                    </td>
                    <td data-label="Result">
                      <StatusBadge value={item.result_code as string} />
                    </td>
                    <td data-label="Message" className="fw-500 text-navy">
                      {String(item.result_message)}
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
