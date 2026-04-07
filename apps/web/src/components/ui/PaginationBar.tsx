import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buildPageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push('ellipsis');

  pages.push(totalPages);
  return pages;
};

export const PaginationBar = ({ page, totalPages, onPageChange }: PaginationBarProps) => {
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={
              page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-orange-50'
            }
          />
        </PaginationItem>

        {pageNumbers.map((pageNum, idx) =>
          pageNum === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <PaginationLink
                isActive={page === pageNum}
                onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={
              page === totalPages
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer hover:bg-orange-50'
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
