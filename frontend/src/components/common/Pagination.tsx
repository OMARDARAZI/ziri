import type { Pagination as Page } from '../../types/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ data, onPage }: { data?: Page; onPage: (page: number) => void }) {
  if (!data || data.pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="d-flex align-items-center justify-content-between py-3 border-top mt-3">
      <div className="text-muted font-size-085 fw-500">
        Showing page <span className="text-dark fw-600">{data.page}</span> of <span className="text-dark fw-600">{data.pages}</span>
      </div>
      <ul className="pagination pagination-sm mb-0 gap-1.5">
        <li className={`page-item ${data.page <= 1 ? 'disabled' : ''}`}>
          <button
            className="page-link rounded d-inline-flex align-items-center gap-1"
            onClick={() => onPage(data.page - 1)}
            disabled={data.page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span className="d-none d-sm-inline">Previous</span>
          </button>
        </li>
        <li className={`page-item ${data.page >= data.pages ? 'disabled' : ''}`}>
          <button
            className="page-link rounded d-inline-flex align-items-center gap-1"
            onClick={() => onPage(data.page + 1)}
            disabled={data.page >= data.pages}
            aria-label="Next page"
          >
            <span className="d-none d-sm-inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
