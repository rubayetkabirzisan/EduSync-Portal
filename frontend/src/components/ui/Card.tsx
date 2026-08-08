import React, { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
  footer,
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-all ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
