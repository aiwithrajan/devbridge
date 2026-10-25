import React from "react";

interface PanelProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Single panel shell used by every card in the app.
 * Keeps spacing, borders, and header rhythm identical everywhere.
 */
export default function Panel({ icon, title, subtitle, actions, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon && (
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-slate-300">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
              {title}
            </h2>
            {subtitle && (
              <div className="mt-0.5 text-[11px] text-slate-500 truncate">{subtitle}</div>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
