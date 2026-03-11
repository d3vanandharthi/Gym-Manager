import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
    LayoutDashboard, Users, CreditCard, Settings,
    LogOut, Smartphone, Moon, Sun, CalendarDays, Dumbbell
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
    Sidebar,
    SidebarBody,
    SidebarLink,
    useSidebar,
    SidebarLinkConfig,
} from './ui/sidebar';
import { cn } from '@/src/lib/utils';

// ─── Sidebar content (must live inside SidebarProvider) ─────────────────────

function SidebarContent() {
    const { open } = useSidebar();
    const { logout, user } = useAuth();

    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const [whatsappStatus, setWhatsappStatus] = useState<{ ready: boolean }>({ ready: false });

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        const check = async () => {
            try { const s = await api.getWhatsAppStatus(); setWhatsappStatus(s); } catch { }
        };
        check();
        const t = setInterval(check, 5000);
        return () => clearInterval(t);
    }, []);

    const userRole = user?.role || 'staff';
    const canSeeSettings = ['owner', 'admin', 'trainer'].includes(userRole);

    const mainLinks: SidebarLinkConfig[] = [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Members',   href: '/members',   icon: <Users size={18} /> },
        { label: 'Classes',   href: '/classes',   icon: <CalendarDays size={18} /> },
        { label: 'Payments',  href: '/payments',  icon: <CreditCard size={18} /> },
        ...(canSeeSettings ? [{ label: 'Settings', href: '/settings', icon: <Settings size={18} /> }] : []),
    ];

    const roleBadgeStyle: Record<string, React.CSSProperties> = {
        owner:   { backgroundColor: 'rgba(217,119,6,0.2)',  color: '#d97706' },
        admin:   { backgroundColor: 'rgba(13,148,136,0.2)', color: '#2dd4bf' },
        trainer: { backgroundColor: 'rgba(5,150,105,0.2)',  color: '#34d399' },
        staff:   { backgroundColor: 'rgba(168,162,158,0.2)',color: '#a8a29e' },
    };

    return (
        <div className="flex flex-col h-full justify-between">

            {/* ── Top: Logo + Nav ── */}
            <div className="flex flex-col gap-1 flex-1 overflow-hidden">

                {/* Logo */}
                <div
                    className="flex items-center gap-3 mb-5 pb-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div
                        className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488, #059669)',
                            boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
                        }}
                    >
                        <Dumbbell size={18} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                key="logo-text"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <p className="text-white font-bold text-sm leading-tight tracking-tight">
                                    Gym Manager
                                </p>
                                <p className="text-[10px] text-white/30 leading-tight">
                                    Membership System
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Section label */}
                <AnimatePresence>
                    {open && (
                        <motion.p
                            key="main-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-semibold tracking-[0.18em] uppercase px-2 mb-1 text-white/25"
                        >
                            Main
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Nav links */}
                <div className="flex flex-col gap-0.5">
                    {mainLinks.map(link => (
                        <SidebarLink key={link.href} link={link} />
                    ))}
                </div>

                {/* WhatsApp chip */}
                <div
                    className="mt-4 flex items-center gap-2 px-2 py-2 rounded-lg overflow-hidden"
                    style={{
                        backgroundColor: whatsappStatus.ready ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)',
                        border: `1px solid ${whatsappStatus.ready ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.2)'}`,
                    }}
                >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${whatsappStatus.ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <Smartphone
                        size={15}
                        className="flex-shrink-0"
                        style={{ color: whatsappStatus.ready ? '#34d399' : '#fbbf24' }}
                    />
                    <AnimatePresence>
                        {open && (
                            <motion.span
                                key="wa-text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs font-medium whitespace-nowrap overflow-hidden"
                                style={{ color: whatsappStatus.ready ? '#34d399' : '#fbbf24' }}
                            >
                                {whatsappStatus.ready ? 'WhatsApp Connected' : 'WhatsApp Offline'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Bottom: User + actions ── */}
            <div
                className="pt-3 flex flex-col gap-1"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
                {/* User profile */}
                {user && (
                    <div
                        className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1 overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                        >
                            {(user.fullName || user.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <AnimatePresence>
                            {open && (
                                <motion.div
                                    key="user-info"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="flex-1 min-w-0 overflow-hidden"
                                >
                                    <p className="text-white text-xs font-medium truncate">
                                        {user.fullName || user.full_name}
                                    </p>
                                    <span
                                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block"
                                        style={roleBadgeStyle[user.role] || roleBadgeStyle.staff}
                                    >
                                        {user.role}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Dark mode */}
                <SidebarLink
                    link={{
                        label: darkMode ? 'Light Mode' : 'Dark Mode',
                        href: '',
                        icon: darkMode
                            ? <Sun size={18} className="text-amber-400" />
                            : <Moon size={18} />,
                        onClick: () => setDarkMode(!darkMode),
                    }}
                />

                {/* Logout */}
                <SidebarLink
                    link={{
                        label: 'Logout',
                        href: '',
                        icon: <LogOut size={18} className="text-red-400" />,
                        onClick: logout,
                    }}
                />
            </div>
        </div>
    );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function Layout() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => { setOpen(false); }, [location.pathname]);

    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar open={open} setOpen={setOpen} animate={true}>
                <SidebarBody className="h-full">
                    <SidebarContent />
                </SidebarBody>
            </Sidebar>

            {/* Page content */}
            <main
                className="flex-1 overflow-auto"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <div className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
