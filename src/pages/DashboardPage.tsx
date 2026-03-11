import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats, ActivityItem, Member } from '../types';
import StatsCard from '../components/StatsCard';
import { Users, UserCheck, UserX, AlertTriangle, IndianRupee, Activity, Clock, MessageCircle, CalendarCheck, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [expiring, setExpiring] = useState<Member[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [todayCheckins, setTodayCheckins] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try {
            const [s, a, e, r, tc] = await Promise.all([
                api.getDashboardStats(),
                api.getActivity(10),
                api.getExpiringMembers(),
                api.getRevenueChart(),
                api.getTodayCheckinCount(),
            ]);
            setStats(s);
            setActivity(a);
            setExpiring(e);
            setRevenueData(r);
            setTodayCheckins(tc.count);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const activityIcon = (type: string) => {
        switch (type) {
            case 'member_added': return <UserCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />;
            case 'member_deleted': return <UserX className="w-4 h-4" style={{ color: 'var(--danger)' }} />;
            case 'payment_received': return <IndianRupee className="w-4 h-4" style={{ color: 'var(--accent)' }} />;
            case 'whatsapp_sent': return <MessageCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />;
            default: return <Activity className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
                </div>
                <div className="skeleton h-80 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Overview of your gym</p>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard title="Total Members" value={stats.totalMembers} icon={Users} />
                    <StatsCard title="Active" value={stats.activeMembers} icon={UserCheck} />
                    <StatsCard title="Expired" value={stats.expiredMembers} icon={UserX} />
                    <StatsCard title="Today's Check-ins" value={todayCheckins} icon={CalendarCheck} />
                    <StatsCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue.toLocaleString()}`} icon={IndianRupee} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Upgraded to Area Chart */}
                <motion.div
                    className="lg:col-span-2 p-6 rounded-xl border"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-card)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Revenue</h3>
                        </div>
                    </div>
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        boxShadow: 'var(--shadow-lg)',
                                        padding: '10px 14px',
                                    }}
                                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#0d9488"
                                    strokeWidth={2.5}
                                    fill="url(#revenueGradient)"
                                    dot={{ r: 4, fill: '#0d9488', stroke: 'var(--bg-secondary)', strokeWidth: 2 }}
                                    activeDot={{
                                        r: 6,
                                        fill: '#0d9488',
                                        stroke: 'var(--bg-secondary)',
                                        strokeWidth: 3,
                                        style: { filter: 'drop-shadow(0 0 6px rgba(13, 148, 136, 0.5))' },
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                            No revenue data yet. Record payments to see the chart.
                        </div>
                    )}
                </motion.div>

                {/* Expiring Soon */}
                <motion.div
                    className="p-6 rounded-xl border"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-card)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)' }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                        </div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Expiring Soon</h3>
                    </div>
                    {expiring.length > 0 ? (
                        <div className="space-y-1">
                            <AnimatePresence>
                                {expiring.map((m, i) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--warning-bg), var(--warning-bg))',
                                                    color: 'var(--warning)',
                                                    border: '1px solid var(--warning)',
                                                }}
                                            >
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.phone}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="text-xs font-medium px-2.5 py-1 rounded-md"
                                            style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}
                                        >
                                            {m.expiryDate}
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members expiring this week 🎉</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Activity Feed */}
            <motion.div
                className="p-6 rounded-xl border"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                </div>
                {activity.length > 0 ? (
                    <div className="space-y-1">
                        <AnimatePresence>
                            {activity.map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                    style={{ borderBottom: '1px solid var(--border-color)' }}
                                >
                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{activityIcon(a.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                                    </div>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                )}
            </motion.div>
        </div>
    );
}
