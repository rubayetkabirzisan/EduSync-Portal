"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
              : "border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
          } disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-60 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
