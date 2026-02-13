import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

interface ActivitiesListComponentProps {
  goalId: string;
  /** Whether the accordion is expanded – controls when data loads */
  isExpanded?: boolean;
}

interface ProgressEntry {
  id: string;
  date: string;
  value: number;
  note?: string;
  customData?: string;
}

interface PaginatedActivitiesResponse {
  activities: ProgressEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTIVITIES_PER_PAGE = 10;

export const ActivitiesListComponent: React.FC<ActivitiesListComponentProps> = ({
  goalId,
  isExpanded = true,
}) => {
  const [activities, setActivities] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadActivities = useCallback(
    async (targetPage: number) => {
      try {
        setIsLoading(true);
        const data: PaginatedActivitiesResponse = await api.getGoalActivities(goalId, {
          page: targetPage,
          limit: ACTIVITIES_PER_PAGE,
        });
        setActivities(data.activities || []);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setPage(data.pagination.page);
        setHasLoaded(true);
      } catch (e) {
        console.error('Failed to load activities', e);
      } finally {
        setIsLoading(false);
      }
    },
    [goalId]
  );

  // Load when expanded changes to true, or on initial mount if already expanded
  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadActivities(1);
    }
  }, [isExpanded, hasLoaded, loadActivities]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    loadActivities(newPage);
  };

  /** Generate visible page numbers with ellipsis logic */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (page > 3) pages.push('ellipsis');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('ellipsis');

    pages.push(totalPages);
    return pages;
  };

  if (!hasLoaded && !isLoading) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--warm-gray)' }}>
        Loading activities...
      </p>
    );
  }

  if (isLoading && !hasLoaded) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--warm-gray)' }}>
        ↻ Loading activities...
      </p>
    );
  }

  if (hasLoaded && activities.length === 0 && total === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--warm-gray)' }}>
        No activities recorded yet
      </p>
    );
  }

  return (
    <div>
      {/* Activity count */}
      <div
        className="text-xs font-semibold mb-3 uppercase tracking-wide"
        style={{ color: 'var(--warm-gray)' }}
      >
        {total} {total === 1 ? 'entry' : 'entries'}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {activities.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center rounded-xl p-4 transition-all hover:shadow-sm"
            style={{
              background: 'rgba(255, 140, 66, 0.04)',
              border: '1px solid rgba(255, 140, 66, 0.08)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm" style={{ color: 'var(--deep-charcoal)' }}>
                {p.customData || (p.value > 0 ? `+${p.value}` : String(p.value))}
              </div>
              {p.note && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--warm-gray)' }}>
                  {p.note}
                </p>
              )}
            </div>
            <span
              className="text-xs font-medium ml-4 whitespace-nowrap"
              style={{ color: 'var(--warm-gray)' }}
            >
              {new Date(p.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {/* Loading overlay for page transitions */}
      {isLoading && hasLoaded && (
        <div className="text-center py-2">
          <span className="text-xs" style={{ color: 'var(--warm-gray)' }}>
            Loading...
          </span>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={
                    page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-orange-50'
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, idx) =>
                pageNum === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className="cursor-pointer"
                      style={
                        page === pageNum
                          ? {
                              background: 'var(--energizing-orange)',
                              color: 'white',
                              borderColor: 'var(--energizing-orange)',
                            }
                          : {}
                      }
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={
                    page === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-orange-50'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
