import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import WhatsAppModal from './WhatsAppModal';
import { Badge } from './ui/index';
import {
    LayoutDashboard, Users, CreditCard, Settings, LogOut, Smartphone,
    Menu, X, Moon, Sun, CalendarDays, ChevronDown
} from 'lucide-react';

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

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    const userRole = user?.role || 'staff';
    const canSeeSettings = ['owner', 'admin', 'trainer'].includes(userRole);

    const mainNav = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/members', label: 'Members', icon: Users },
        { to: '/classes', label: 'Classes', icon: CalendarDays },
        { to: '/payments', label: 'Payments', icon: CreditCard },
    ];

    const systemNav = [
        ...(canSeeSettings ? [{ to: '/settings', label: 'Settings', icon: Settings }] : []),
    ];

    const roleBadgeColor: Record<string, { bg: string; text: string }> = {
        owner: { bg: 'rgba(217,119,6,0.15)', text: '#d97706' },
        admin: { bg: 'rgba(13,148,136,0.15)', text: '#0d9488' },
        trainer: { bg: 'rgba(5,150,105,0.15)', text: '#059669' },
        staff: { bg: 'rgba(168,162,158,0.15)', text: '#a8a29e' },
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-out lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ backgroundColor: 'var(--bg-sidebar)' }}
            >
                {/* Logo */}
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-base tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Gym Manager</h1>
                            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Membership System</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/30 hover:text-white/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
                    {/* Main section */}
                    <div className="space-y-0.5">
                        <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            Main
                        </p>
                        {mainNav.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                                    ${isActive
                                        ? 'text-white'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                                    }`
                                }
                                style={({ isActive }) => isActive ? {
                                    backgroundColor: 'rgba(13, 148, 136, 0.15)',
                                    color: '#5eead4',
                                } : {}}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon className={`w-[18px] h-[18px] transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-105'}`} />
                                        {label}
                                        {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-teal-400" />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* System section */}
                    {systemNav.length > 0 && (
                        <div className="space-y-0.5">
                            <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                System
                            </p>
                            {systemNav.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) =>
                                        `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                                        ${isActive
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                                        }`
                                    }
                                    style={({ isActive }) => isActive ? {
                                        backgroundColor: 'rgba(13, 148, 136, 0.15)',
                                        color: '#5eead4',
                                    } : {}}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon className={`w-[18px] h-[18px] transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-105'}`} />
                                            {label}
                                            {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-teal-400" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                {/* Bottom panel */}
                <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* WhatsApp status */}
                    <div
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                            backgroundColor: whatsappStatus.ready ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                            color: whatsappStatus.ready ? '#34d399' : '#fbbf24',
                            border: `1px solid ${whatsappStatus.ready ? 'rgba(5,150,105,0.15)' : 'rgba(217,119,6,0.15)'}`,
                        }}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${whatsappStatus.ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <Smartphone className="w-3.5 h-3.5" />
                        {whatsappStatus.ready ? 'WhatsApp Connected' : 'WhatsApp Offline'}
                    </div>

                    {/* User profile */}
                    {user && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                            >
                                {(user.fullName || user.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{user.fullName || user.full_name}</p>
                                <span
                                    className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block"
                                    style={{
                                        backgroundColor: (roleBadgeColor[user.role] || roleBadgeColor.staff).bg,
                                        color: (roleBadgeColor[user.role] || roleBadgeColor.staff).text,
                                    }}
                                >
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Dark mode + Logout */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {darkMode ? 'Light' : 'Dark'}
                        </button>
                        <button
                            onClick={logout}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-white/35 hover:text-red-400 hover:bg-red-400/[0.08]"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile header */}
                <header
                    className="sticky top-0 z-30 lg:hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
                >
                    <div className="flex items-center justify-between px-4 h-14">
                        <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)' }}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                                <Users className="w-3.5 h-3.5 text-white" />
                            </div>
                            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Gym Manager</h1>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} style={{ color: 'var(--text-secondary)' }}>
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
