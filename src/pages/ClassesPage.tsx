import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GymClass, ClassBooking, AttendanceRecord, Member, User } from '../types';
import { CalendarDays, Plus, Edit, Trash2, Save, AlertCircle, Clock, Users, Search, UserCheck, QrCode, X, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'schedule' | 'manage' | 'checkin';

export default function ClassesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'owner' || user?.role === 'admin';

    const [activeTab, setActiveTab] = useState<Tab>('schedule');
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [trainers, setTrainers] = useState<User[]>([]);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Schedule tab state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
    const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
    const [bookedCount, setBookedCount] = useState(0);
    const [bookingMemberId, setBookingMemberId] = useState('');

    // Manage tab state
    const [showAddClass, setShowAddClass] = useState(false);
    const [editingClass, setEditingClass] = useState<GymClass | null>(null);
    const [newClass, setNewClass] = useState({ name: '', trainerId: '', dayOfWeek: 'monday', startTime: '06:00', endTime: '07:00', maxCapacity: 30 });

    // Check-in tab state
    const [checkinSearch, setCheckinSearch] = useState('');
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
    const [checkinLoading, setCheckinLoading] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [cls, mems] = await Promise.all([api.getClasses(), api.getMembers()]);
            setClasses(cls);
            setMembers(mems);
            if (isAdmin) {
                try { const users = await api.getUsers(); setTrainers(users.filter((u: User) => u.role === 'trainer')); } catch { }
            }
            loadTodayAttendance();
        } catch { }
    };

    const loadTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const att = await api.getAttendance({ date: today, limit: 50 });
            setTodayAttendance(att);
        } catch { }
    };

    const loadClassBookings = async (cls: GymClass) => {
        try {
            const data = await api.getClassSchedule(cls.id, selectedDate);
            setClassBookings(data.bookings);
            setBookedCount(data.booked);
        } catch { }
    };

    const showNotif = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Schedule helpers
    const selectedDay = useMemo(() => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[new Date(selectedDate + 'T12:00:00').getDay()];
    }, [selectedDate]);

    const filteredClasses = useMemo(() =>
        classes.filter(c => c.day_of_week === selectedDay || c.day_of_week === 'daily'),
        [classes, selectedDay]
    );

    const handleSelectClass = (cls: GymClass) => {
        setSelectedClass(cls);
        loadClassBookings(cls);
    };

    const handleBookMember = async () => {
        if (!selectedClass || !bookingMemberId) return;
        try {
            await api.createBooking(selectedClass.id, bookingMemberId, selectedDate);
            showNotif('Booking created!', 'success');
            setBookingMemberId('');
            loadClassBookings(selectedClass);
        } catch (err: any) { showNotif(err.message, 'error'); }
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await api.cancelBooking(bookingId);
            showNotif('Booking cancelled', 'success');
            if (selectedClass) loadClassBookings(selectedClass);
        } catch (err: any) { showNotif(err.message, 'error'); }
    };

    const handleCheckinBooking = async (bookingId: string) => {
        try {
            await api.checkinBooking(bookingId);
            showNotif('Checked in!', 'success');
            if (selectedClass) loadClassBookings(selectedClass);
            loadTodayAttendance();
        } catch (err: any) { showNotif(err.message, 'error'); }
    };

    // Manage
    const handleSaveClass = async () => {
        const data = editingClass ? {
            name: editingClass.name, trainerId: editingClass.trainer_id,
            dayOfWeek: editingClass.day_of_week, startTime: editingClass.start_time,
            endTime: editingClass.end_time, maxCapacity: editingClass.max_capacity,
        } : newClass;

        try {
            if (editingClass) {
                await api.updateClass(editingClass.id, data);
            } else {
                await api.createClass(data as any);
            }
            showNotif(editingClass ? 'Class updated' : 'Class created', 'success');
            setShowAddClass(false);
            setEditingClass(null);
            setNewClass({ name: '', trainerId: '', dayOfWeek: 'monday', startTime: '06:00', endTime: '07:00', maxCapacity: 30 });
            loadData();
        } catch (err: any) { showNotif(err.message, 'error'); }
    };

    const handleDeleteClass = async (id: string) => {
        if (!window.confirm('Delete this class?')) return;
        try {
            await api.deleteClass(id);
            showNotif('Class deleted', 'success');
            loadData();
        } catch (err: any) { showNotif(err.message, 'error'); }
    };

    // Check-in
    const filteredMembers = useMemo(() => {
        if (!checkinSearch.trim()) return [];
        const q = checkinSearch.toLowerCase();
        return members.filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q)).slice(0, 10);
    }, [members, checkinSearch]);

    const handleQuickCheckin = async (memberId: string) => {
        setCheckinLoading(memberId);
        try {
            const result = await api.quickCheckin(memberId);
            if (result.duplicate) {
                showNotif(`${result.attendance ? 'Already checked in today' : 'Already checked in'}`, 'error');
            } else {
                showNotif(`${result.memberName} checked in!`, 'success');
            }
            setCheckinSearch('');
            loadTodayAttendance();
        } catch (err: any) { showNotif(err.message, 'error'); }
        setCheckinLoading(null);
    };

    const dayLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);
    const formatTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const capacityColor = (booked: number, max: number) => {
        const pct = booked / max;
        if (pct >= 1) return { bg: 'var(--danger-bg)', text: 'var(--danger)', label: 'Full' };
        if (pct >= 0.7) return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: `${booked}/${max}` };
        return { bg: 'var(--success-bg)', text: 'var(--success)', label: `${booked}/${max}` };
    };

    const tabs = [
        { id: 'schedule' as Tab, label: 'Schedule', icon: CalendarDays },
        ...(isAdmin ? [{ id: 'manage' as Tab, label: `Manage (${classes.length})`, icon: Edit }] : []),
        { id: 'checkin' as Tab, label: `Check-in (${todayAttendance.length})`, icon: UserCheck },
    ];

    const classForm = editingClass || newClass;
    const isEditing = !!editingClass;

    const navigateDate = (delta: number) => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
        setSelectedClass(null);
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Classes</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Schedule, manage classes, and check in members</p>
            </div>

            {notification && (
                <div className="p-4 rounded-xl flex items-center gap-3 animate-fade-in-up" style={{
                    backgroundColor: notification.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{notification.message}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl animate-fade-in-up" style={{ backgroundColor: 'var(--bg-tertiary)', animationDelay: '100ms' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                        style={{
                            backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ═════════ SCHEDULE TAB ═════════ */}
            {activeTab === 'schedule' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {/* Left: Date selector + class list */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Date navigator */}
                        <div className="surface p-4 flex items-center justify-between">
                            <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg transition-all hover:bg-[var(--bg-tertiary)]"><ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
                            <div className="text-center">
                                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedClass(null); }}
                                    className="text-xs mt-1 input-field px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <button onClick={() => navigateDate(1)} className="p-2 rounded-lg transition-all hover:bg-[var(--bg-tertiary)]"><ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
                        </div>

                        {/* Class cards */}
                        {filteredClasses.length === 0 ? (
                            <div className="surface p-12 text-center">
                                <CalendarDays className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No classes on {dayLabel(selectedDay)}</p>
                                {isAdmin && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Go to Manage tab to add classes</p>}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredClasses.map(cls => {
                                    const cap = capacityColor(cls.booked_count || 0, cls.max_capacity);
                                    const isSelected = selectedClass?.id === cls.id;
                                    return (
                                        <div key={cls.id} onClick={() => handleSelectClass(cls)}
                                            className="surface p-4 cursor-pointer transition-all"
                                            style={{
                                                borderLeft: `4px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                                                boxShadow: isSelected ? '0 0 0 1px var(--accent-glow)' : undefined,
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{cls.name}</h4>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                                                            {cls.trainer_name && ` • ${cls.trainer_name}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: cap.bg, color: cap.text }}>
                                                    {cap.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Booking panel */}
                    <div className="space-y-4">
                        {selectedClass ? (
                            <div className="surface p-5 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedClass.name}</h3>
                                    <button onClick={() => setSelectedClass(null)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
                                </div>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                    {formatTime(selectedClass.start_time)} – {formatTime(selectedClass.end_time)} • {bookedCount}/{selectedClass.max_capacity} booked
                                </p>

                                {/* Add booking */}
                                <div className="flex gap-2 mb-4">
                                    <select value={bookingMemberId} onChange={e => setBookingMemberId(e.target.value)}
                                        className="flex-1 text-sm input-field px-3 py-2 rounded-lg">
                                        <option value="">Select member...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                    <button onClick={handleBookMember} disabled={!bookingMemberId}
                                        className="btn-primary text-sm px-3 py-2" style={{ opacity: bookingMemberId ? 1 : 0.5 }}>Book</button>
                                </div>

                                {/* Bookings list */}
                                <div className="space-y-2">
                                    {classBookings.length === 0 ? (
                                        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No bookings yet</p>
                                    ) : classBookings.map(b => (
                                        <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.member_name}</p>
                                                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                                    backgroundColor: b.status === 'checked_in' ? 'var(--success-bg)' : b.status === 'cancelled' ? 'var(--danger-bg)' : 'var(--accent-light)',
                                                    color: b.status === 'checked_in' ? 'var(--success)' : b.status === 'cancelled' ? 'var(--danger)' : 'var(--accent)',
                                                }}>{b.status}</span>
                                            </div>
                                            {b.status === 'booked' && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleCheckinBooking(b.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>Check In</button>
                                                    <button onClick={() => handleCancelBooking(b.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>Cancel</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="surface p-8 text-center">
                                <CalendarDays className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--border-color)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a class to view bookings</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═════════ MANAGE TAB ═════════ */}
            {activeTab === 'manage' && isAdmin && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="surface p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}><CalendarDays className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Classes</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create, edit, and remove gym classes</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowAddClass(!showAddClass); setEditingClass(null); }} className="btn-primary flex items-center gap-1.5 text-sm py-2">
                                <Plus className="w-4 h-4" /> Add Class
                            </button>
                        </div>

                        {/* Add / Edit Form */}
                        {(showAddClass || editingClass) && (
                            <div className="rounded-xl p-5 mb-5 space-y-4 animate-scale-in" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-glow)' }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Class Name *</label>
                                        <input type="text" value={isEditing ? editingClass!.name : newClass.name}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, name: e.target.value }) : setNewClass({ ...newClass, name: e.target.value })}
                                            placeholder="Morning Yoga" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Trainer</label>
                                        <select value={isEditing ? editingClass!.trainer_id || '' : newClass.trainerId}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, trainer_id: e.target.value || null }) : setNewClass({ ...newClass, trainerId: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm input-field">
                                            <option value="">No trainer</option>
                                            {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.fullName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Day</label>
                                        <select value={isEditing ? editingClass!.day_of_week : newClass.dayOfWeek}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, day_of_week: e.target.value }) : setNewClass({ ...newClass, dayOfWeek: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm input-field">
                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily'].map(d =>
                                                <option key={d} value={d}>{dayLabel(d)}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Capacity</label>
                                        <input type="number" value={isEditing ? editingClass!.max_capacity : newClass.maxCapacity}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, max_capacity: Number(e.target.value) }) : setNewClass({ ...newClass, maxCapacity: Number(e.target.value) })}
                                            min={1} className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Start Time</label>
                                        <input type="time" value={isEditing ? editingClass!.start_time : newClass.startTime}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, start_time: e.target.value }) : setNewClass({ ...newClass, startTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>End Time</label>
                                        <input type="time" value={isEditing ? editingClass!.end_time : newClass.endTime}
                                            onChange={e => isEditing ? setEditingClass({ ...editingClass!, end_time: e.target.value }) : setNewClass({ ...newClass, endTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => { setShowAddClass(false); setEditingClass(null); }} className="btn-secondary text-sm py-1.5 px-4">Cancel</button>
                                    <button onClick={handleSaveClass} className="btn-primary flex items-center gap-1 text-sm py-1.5 px-4">
                                        <Save className="w-3.5 h-3.5" /> {isEditing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Classes table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                        {['Class', 'Day', 'Time', 'Trainer', 'Capacity', 'Actions'].map(h => (
                                            <th key={h} className={`px-4 py-3 text-sm font-medium ${h === 'Actions' ? 'text-right' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-12 text-center">
                                            <CalendarDays className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--border-color)' }} />
                                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No classes yet. Click "Add Class" to create one.</p>
                                        </td></tr>
                                    ) : classes.map(cls => (
                                        <tr key={cls.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cls.name}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                                                    {dayLabel(cls.day_of_week)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{cls.trainer_name || '—'}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{cls.max_capacity}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => { setEditingClass(cls); setShowAddClass(false); }}
                                                        className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--accent-light)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    ><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteClass(cls.id)}
                                                        className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    ><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════ CHECK-IN TAB ═════════ */}
            {activeTab === 'checkin' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
                    {/* Left: search + check-in */}
                    <div className="space-y-4">
                        <div className="surface p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}><UserCheck className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Check-in</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Search by name or phone number</p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input type="text" value={checkinSearch} onChange={e => setCheckinSearch(e.target.value)}
                                    placeholder="Search member name or phone..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm input-field"
                                    autoFocus />
                            </div>

                            {/* Results */}
                            {filteredMembers.length > 0 && (
                                <div className="space-y-2">
                                    {filteredMembers.map(m => {
                                        const isExpired = new Date(m.expiryDate) < new Date();
                                        const alreadyCheckedIn = todayAttendance.some(a => a.member_id === m.id);
                                        return (
                                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl transition-all" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: isExpired ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            {m.phone} {isExpired && <span style={{ color: 'var(--danger)' }}>• Expired</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                {alreadyCheckedIn ? (
                                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>✓ Checked In</span>
                                                ) : (
                                                    <button onClick={() => handleQuickCheckin(m.id)}
                                                        disabled={checkinLoading === m.id}
                                                        className="btn-primary text-xs px-3 py-1.5">
                                                        {checkinLoading === m.id ? 'Checking...' : 'Check In'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {checkinSearch.trim() && filteredMembers.length === 0 && (
                                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No members found</p>
                            )}
                        </div>
                    </div>

                    {/* Right: today's log */}
                    <div className="surface p-6">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Today's Check-ins ({todayAttendance.length})
                        </h3>
                        {todayAttendance.length === 0 ? (
                            <div className="text-center py-10">
                                <UserCheck className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--border-color)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No check-ins yet today</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {todayAttendance.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                                {(a.member_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.member_name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {a.class_name && ` • ${a.class_name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{
                                            backgroundColor: a.method === 'qr' ? 'rgba(245,158,11,0.12)' : a.method === 'booking' ? 'var(--accent-light)' : 'var(--success-bg)',
                                            color: a.method === 'qr' ? '#f59e0b' : a.method === 'booking' ? 'var(--accent)' : 'var(--success)',
                                        }}>{a.method}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
