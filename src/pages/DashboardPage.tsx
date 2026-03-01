import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats, ActivityItem, Member } from '../types';
import StatsCard from '../components/StatsCard';
import { Users, UserCheck, UserX, AlertTriangle, IndianRupee, Activity, Clock, MessageCircle, CalendarCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
            <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Overview of your gym</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
                    <StatsCard title="Total Members" value={stats.totalMembers} icon={Users} />
                    <StatsCard title="Active" value={stats.activeMembers} icon={UserCheck} />
                    <StatsCard title="Expired" value={stats.expiredMembers} icon={UserX} />
                    <StatsCard title="Today's Check-ins" value={todayCheckins} icon={CalendarCheck} />
                    <StatsCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue.toLocaleString()}`} icon={IndianRupee} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div
                    className="lg:col-span-2 p-6 rounded-xl border animate-fade-in-up"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-card)',
                        animationDelay: '200ms',
                    }}
                >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue</h3>
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        boxShadow: 'var(--shadow-lg)',
                                    }}
                                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                            No revenue data yet. Record payments to see the chart.
                        </div>
                    )}
                </div>

                {/* Expiring Soon */}
                <div
                    className="p-6 rounded-xl border animate-fade-in-up"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-card)',
                        animationDelay: '300ms',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Expiring Soon</h3>
                    </div>
                    {expiring.length > 0 ? (
                        <div className="space-y-3">
                            {expiring.map(m => (
                                <div key={m.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.phone}</p>
                                    </div>
                                    <span
                                        className="text-xs font-medium px-2.5 py-1 rounded-md"
                                        style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}
                                    >
                                        {m.expiryDate}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members expiring this week 🎉</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Feed */}
            <div
                className="p-6 rounded-xl border animate-fade-in-up"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                    animationDelay: '400ms',
                }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                </div>
                {activity.length > 0 ? (
                    <div className="space-y-1">
                        {activity.map(a => (
                            <div key={a.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{activityIcon(a.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                                </div>
                                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(a.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                )}
            </div>
        </div>
    );
}
