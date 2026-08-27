import React from 'react'

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  itemLabel = 'records'
}) {
  const safeTotalPages = totalPages || 1

  const startItem =
    totalItems === 0
      ? 0
      : ((currentPage - 1) * perPage) + 1

  const endItem =
    totalItems === 0
      ? 0
      : Math.min(currentPage * perPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

      {/* Record Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} {itemLabel}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={() =>
            onPageChange(Math.max(1, currentPage - 1))
          }
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-[#2a2a4a] text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#0f0f1a] transition-colors"
        >
          Previous
        </button>

        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.min(safeTotalPages, currentPage + 1)
            )
          }
          disabled={
            currentPage >= safeTotalPages ||
            totalItems === 0
          }
          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-[#2a2a4a] text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#0f0f1a] transition-colors"
        >
          Next
        </button>

      </div>
    </div>
  )
}

export default Pagination