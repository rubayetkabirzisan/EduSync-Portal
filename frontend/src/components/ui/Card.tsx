import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

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

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "sky" | "indigo" | "emerald" | "amber" | "purple" | "rose";
  loading?: boolean;
}

const colorMap = {
  sky: "from-sky-500 to-blue-600 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40",
  indigo: "from-indigo-500 to-purple-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
  emerald: "from-emerald-500 to-teal-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
  amber: "from-amber-500 to-orange-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
  purple: "from-purple-500 to-pink-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
  rose: "from-rose-500 to-red-600 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
  loading = false,
}: StatCardProps) {
  const colorStyle = colorMap[color] || colorMap.indigo;

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {loading ? <span className="animate-pulse">...</span> : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyle.split(" ").slice(2).join(" ")}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" variant="primary" onClick={onAction} className="cursor-pointer">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
