import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Smartphone, Menu, X, Moon, Sun, Shield, CalendarDays } from 'lucide-react';

export default function Layout() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const [whatsappStatus, setWhatsappStatus] = useState<{ ready: boolean; qrCode: string | null }>({ ready: false, qrCode: null });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await api.getWhatsAppStatus();
                setWhatsappStatus(status);
            } catch (err) { /* ignore */ }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const userRole = user?.role || 'staff';
    const canSeeSettings = ['owner', 'admin', 'trainer'].includes(userRole);

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
        { to: '/members', label: 'Members', icon: Users, visible: true },
        { to: '/classes', label: 'Classes', icon: CalendarDays, visible: true },
        { to: '/payments', label: 'Payments', icon: CreditCard, visible: true },
        { to: '/settings', label: 'Settings', icon: Settings, visible: canSeeSettings },
    ].filter(item => item.visible);

    const roleBadge = (role: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            owner: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
            admin: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
            trainer: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
            staff: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
        };
        const c = colors[role] || colors.staff;
        return (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
                {role}
            </span>
        );
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: 'var(--bg-sidebar)' }}>

                {/* Logo */}
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-tight">Gym Manager</h1>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Membership System</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white/80 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    <p className="px-3 mb-2 text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Menu</p>
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'text-white shadow-lg'
                                    : 'text-white/50 hover:text-white/80'
                                }`
                            }
                            style={({ isActive }) => isActive ? {
                                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                            } : {}}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* User info */}
                    {user && (
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                {(user.fullName || user.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{user.fullName || user.full_name}</p>
                                <div className="mt-0.5">{roleBadge(user.role)}</div>
                            </div>
                        </div>
                    )}

                    {/* WhatsApp status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all`} style={{
                        backgroundColor: whatsappStatus.ready ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: whatsappStatus.ready ? '#34d399' : '#fbbf24',
                        border: `1px solid ${whatsappStatus.ready ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                    }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${whatsappStatus.ready ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                        <Smartphone className="w-3.5 h-3.5" />
                        {whatsappStatus.ready ? 'WhatsApp Connected' : 'WhatsApp Offline'}
                    </div>

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)', e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)', e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)', e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)', e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar (mobile) */}
                <header className="sticky top-0 z-30 lg:hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between px-4 h-14">
                        <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)' }}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Gym Manager</h1>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} style={{ color: 'var(--text-secondary)' }}>
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
