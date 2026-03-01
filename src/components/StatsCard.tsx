import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
}

const iconColors: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
    emerald: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
    rose: { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e' },
    amber: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    violet: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' },
};

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
    const c = iconColors[color];

    return (
        <div
            className="surface p-5 group cursor-default"
            style={{ transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    {trend && (
                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{trend}</p>
                    )}
                </div>
                <div
                    className="p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: c.bg, color: c.text }}
                >
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
