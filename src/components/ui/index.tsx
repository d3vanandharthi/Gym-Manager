import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

/* ─────────────────────── BUTTON ─────────────────────── */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
        const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
        const variants: Record<string, string> = {
            primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_1px_2px_rgba(13,148,136,0.2)] hover:shadow-[0_4px_12px_rgba(13,148,136,0.3)]',
            secondary: 'bg-transparent border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
            ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
            danger: 'bg-[var(--danger)] text-white hover:bg-red-700 shadow-[0_1px_2px_rgba(220,38,38,0.2)]',
        };
        const sizes: Record<string, string> = {
            sm: 'text-xs px-2.5 py-1.5 rounded-md',
            md: 'text-sm px-3.5 py-2 rounded-lg',
            lg: 'text-sm px-5 py-2.5 rounded-lg',
        };
        return (
            <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

/* ─────────────────────── BADGE ─────────────────────── */
export interface BadgeProps {
    variant?: 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'muted';
    dot?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant = 'default', dot = false, children, className }: BadgeProps) {
    const variants: Record<string, string> = {
        default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
        success: 'bg-[var(--success-bg)] text-[var(--success)]',
        danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
        warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
        accent: 'bg-[var(--accent-light)] text-[var(--accent)]',
        muted: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
    };
    const dotColors: Record<string, string> = {
        default: 'bg-[var(--text-muted)]',
        success: 'bg-[var(--success)]',
        danger: 'bg-[var(--danger)]',
        warning: 'bg-[var(--warning)]',
        accent: 'bg-[var(--accent)]',
        muted: 'bg-[var(--text-muted)]',
    };
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md', variants[variant], className)}>
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
            {children}
        </span>
    );
}

/* ─────────────────────── CARD ─────────────────────── */
export interface CardProps {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    style?: React.CSSProperties;
}

export function Card({ padding = 'md', hover = true, children, className, ...props }: CardProps) {
    const pads: Record<string, string> = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
    return (
        <div
            className={cn(
                'bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-card)] transition-all duration-150',
                hover && 'hover:shadow-[var(--shadow-md)] dark:hover:border-[rgba(13,148,136,0.25)]',
                pads[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/* ─────────────────────── INPUT ─────────────────────── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, icon, error, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div>
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150 outline-none',
                            'focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-glow)]',
                            'placeholder:text-[var(--text-muted)]',
                            icon && 'pl-10',
                            error && 'border-[var(--danger)] focus:ring-[rgba(220,38,38,0.15)]',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

/* ─────────────────────── SELECT ─────────────────────── */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, className, id, children, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div>
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150 outline-none',
                        'focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-glow)]',
                        error && 'border-[var(--danger)]',
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
            </div>
        );
    }
);
Select.displayName = 'Select';

/* ─────────────────────── TEXTAREA ─────────────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div>
                {label && (
                    <label htmlFor={textareaId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        'w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150 outline-none resize-none',
                        'focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-glow)]',
                        'placeholder:text-[var(--text-muted)]',
                        error && 'border-[var(--danger)]',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

/* ─────────────────────── MODAL ─────────────────────── */
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
    React.useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    const sizes: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* Panel */}
            <div
                className={cn(
                    'relative w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-lg)] animate-scale-in',
                    sizes[size]
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || description) && (
                    <div className="px-6 pt-6 pb-0">
                        {title && <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>}
                        {description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

/* ─────────────────────── TABS ─────────────────────── */
export interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

export interface TabsProps {
    tabs: Tab[];
    active: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
    return (
        <div className={cn('flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)]', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-1.5',
                        active === tab.id
                            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    )}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[1.25rem] text-center',
                            active === tab.id ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        )}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────── EMPTY STATE ─────────────────────── */
export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
                {icon}
            </div>
            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h4>
            {description && <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/* ─────────────────────── SKELETON ─────────────────────── */
export interface SkeletonProps {
    className?: string;
    lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
    if (lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className={cn('skeleton h-4 rounded', i === lines - 1 && 'w-3/4', className)} />
                ))}
            </div>
        );
    }
    return <div className={cn('skeleton h-4 rounded', className)} />;
}

/* ─────────────────────── TOAST / NOTIFICATION ─────────────────────── */
export interface ToastProps {
    message: string;
    type: 'success' | 'error';
    icon?: React.ReactNode;
}

export function Toast({ message, type, icon }: ToastProps) {
    return (
        <div
            className="p-3.5 rounded-xl flex items-center gap-3 animate-fade-in-up border"
            style={{
                backgroundColor: type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: type === 'success' ? 'var(--success)' : 'var(--danger)',
                borderColor: type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)',
            }}
        >
            {icon}
            <p className="font-medium text-sm">{message}</p>
        </div>
    );
}

/* ─────────────────────── PAGE HEADER ─────────────────────── */
export interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                {description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
            </div>
            {action && <div className="flex items-center gap-2 w-full sm:w-auto">{action}</div>}
        </div>
    );
}

/* ─────────────────────── ICON BUTTON ─────────────────────── */
export interface IconButtonProps {
    variant?: 'ghost' | 'danger' | 'success' | 'accent';
    size?: 'sm' | 'md';
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    title?: string;
    disabled?: boolean;
}

export function IconButton({ variant = 'ghost', size = 'md', className, children, ...props }: IconButtonProps) {
    const variants: Record<string, string> = {
        ghost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
        danger: 'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)]',
        success: 'text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success-bg)]',
        accent: 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]',
    };
    const sizes: Record<string, string> = {
        sm: 'p-1 rounded-md',
        md: 'p-2 rounded-lg',
    };
    return (
        <button className={cn('transition-all duration-150', variants[variant], sizes[size], className)} {...props}>
            {children}
        </button>
    );
}
