import React, { useEffect, useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useSpring, useTransform } from 'motion/react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: { value: string; positive: boolean };
    color?: string;
}

function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(0, { stiffness: 100, damping: 30, mass: 1 });
    const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
    const [rendered, setRendered] = useState('0');

    useEffect(() => {
        spring.set(value);
        const unsubscribe = display.on('change', (v) => setRendered(v));
        return unsubscribe;
    }, [value, spring, display]);

    return <>{rendered}</>;
}

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
    const numericValue = typeof value === 'number' ? value : null;
    const stringValue = typeof value === 'string' ? value : null;

    // Mini bar chart data (random for visual effect)
    const barsRef = useRef(Array.from({ length: 7 }, () => 20 + Math.random() * 60));
    const bars = barsRef.current;

    return (
        <motion.div
            className="relative overflow-hidden p-5 rounded-xl border transition-all duration-150 group cursor-default"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-card)',
            }}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Animated gradient background on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(135deg, ${color || 'rgba(13,148,136,0.05)'} 0%, transparent 60%)`,
                }}
            />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: 'var(--accent-light)' }}
                    >
                        <Icon className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
                    </div>
                    {trend && (
                        <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5"
                            style={{
                                backgroundColor: trend.positive ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: trend.positive ? 'var(--success)' : 'var(--danger)',
                            }}
                        >
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p
                            className="text-2xl font-bold tracking-tight"
                            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}
                        >
                            {numericValue !== null ? (
                                <AnimatedNumber value={numericValue} />
                            ) : (
                                stringValue
                            )}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {title}
                        </p>
                    </div>

                    {/* Mini animated bar chart */}
                    <div className="flex items-end gap-[3px] h-8 opacity-40 group-hover:opacity-70 transition-opacity">
                        {bars.map((height, i) => (
                            <motion.div
                                key={i}
                                className="w-[4px] rounded-full"
                                style={{ backgroundColor: 'var(--accent)' }}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20,
                                    delay: i * 0.05,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
