'use client';

import React from 'react';
import { clsx } from './clsx';

export const Card = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(function Card({ children, className }, ref) {
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-indigo-500/5',
        className,
      )}
    >
      {children}
    </div>
  );
});

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: 'bg-indigo-500 hover:bg-indigo-400 text-white',
    ghost: 'border border-white/15 hover:bg-white/5 text-white',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
    subtle: 'bg-white/10 hover:bg-white/15 text-white',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles = {
    neutral: 'bg-white/10 text-white/70',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
    info: 'bg-indigo-500/15 text-indigo-300',
  }[tone];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        styles,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/50">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-white/[0.06]',
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
