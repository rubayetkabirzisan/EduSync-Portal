import React, { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => ReactNode);
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  pagination,
}: TableProps<T>) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3.5 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4 text-slate-700 dark:text-slate-300 ${col.className || ""}`}>
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : col.accessor
                        ? (item[col.accessor] as ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {pagination.totalCount}
            </span>{" "}
            results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
