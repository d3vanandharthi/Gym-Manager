import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: { value: string; positive: boolean };
}

export default function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
    return (
        <div
            className="p-5 rounded-xl border transition-all duration-150 hover:shadow-md"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-card)',
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div
                    className="p-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--accent-light)' }}
                >
                    <Icon className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
                </div>
                {trend && (
                    <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{
                            backgroundColor: trend.positive ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: trend.positive ? 'var(--success)' : 'var(--danger)',
                        }}
                    >
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
            <p
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}
            >
                {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {title}
            </p>
        </div>
    );
}
