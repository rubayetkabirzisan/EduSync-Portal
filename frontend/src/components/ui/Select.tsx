"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Option[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
              : "border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
          } disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
