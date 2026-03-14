import React, { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, User, Phone, Mail, Users2, Droplets, MapPin, Heart, Dumbbell, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/src/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberFormProps {
    formData: any;
    onChange: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isEditing: boolean;
}

// ─── Floating underline input ─────────────────────────────────────────────────

function FloatingInput({
    id, label, icon: Icon, value, onChange, type = 'text', required = false, disabled = false
}: {
    id: string; label: string; icon?: any; value: string;
    onChange: (val: string) => void; type?: string; required?: boolean; disabled?: boolean;
}) {
    const [focused, setFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
        <div className="relative z-0 group">
            <input
                type={type}
                id={id}
                value={value}
                disabled={disabled}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder=" "
                required={required}
                className="block py-3 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    color: 'var(--text-primary)',
                    borderColor: focused ? 'var(--accent)' : 'var(--border-color)',
                }}
            />
            <label
                htmlFor={id}
                className={cn(
                    "absolute text-sm duration-300 transform origin-[0] transition-all pointer-events-none",
                    hasValue || focused
                        ? "-translate-y-6 scale-75 top-3"
                        : "translate-y-0 scale-100 top-3"
                )}
                style={{ color: focused ? 'var(--accent)' : 'var(--text-muted)' }}
            >
                {Icon && <Icon className="inline-block mr-1.5 -mt-0.5" size={13} />}
                {label}{required ? ' *' : ''}
            </label>
            {/* Animated underline */}
            <div
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                style={{
                    width: focused ? '100%' : '0%',
                    backgroundColor: 'var(--accent)',
                }}
            />
        </div>
    );
}

// ─── Floating underline textarea ──────────────────────────────────────────────

function FloatingTextarea({ id, label, icon: Icon, value, onChange }: {
    id: string; label: string; icon?: any; value: string; onChange: (val: string) => void;
}) {
    const [focused, setFocused] = useState(false);
    const hasValue = value && value.length > 0;
    return (
        <div className="relative z-0">
            <textarea
                id={id}
                value={value}
                rows={2}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder=" "
                className="block py-3 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 resize-none peer transition-colors"
                style={{ color: 'var(--text-primary)', borderColor: focused ? 'var(--accent)' : 'var(--border-color)' }}
            />
            <label
                htmlFor={id}
                className={cn(
                    "absolute text-sm duration-300 transform origin-[0] transition-all pointer-events-none",
                    hasValue || focused ? "-translate-y-6 scale-75 top-3" : "translate-y-0 scale-100 top-3"
                )}
                style={{ color: focused ? 'var(--accent)' : 'var(--text-muted)' }}
            >
                {Icon && <Icon className="inline-block mr-1.5 -mt-0.5" size={13} />}
                {label}
            </label>
            <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                style={{ width: focused ? '100%' : '0%', backgroundColor: 'var(--accent)' }} />
        </div>
    );
}

// ─── Calendar Date Picker ─────────────────────────────────────────────────────

function DatePickerField({ label, icon: Icon, value, onChange, required = false }: {
    label: string; icon?: any; value: string; onChange: (val: string) => void; required?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const date = value ? new Date(value + 'T00:00:00') : undefined;

    const handleSelect = (d: Date | undefined) => {
        if (d) {
            onChange(format(d, 'yyyy-MM-dd'));
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            <p className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                {Icon && <Icon size={12} />}
                {label}{required ? ' *' : ''}
            </p>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm text-left transition-all border",
                            "hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                        )}
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderColor: open ? 'var(--accent)' : 'var(--border-color)',
                            color: date ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: open ? '0 0 0 3px var(--accent-glow)' : undefined,
                        }}
                    >
                        <CalendarIcon size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        {date ? format(date, 'dd MMM yyyy') : 'Pick a date'}
                    </button>
                </PopoverTrigger>
                <PopoverContent align="center" sideOffset={4} collisionPadding={16} className="w-auto max-w-[320px]">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─── Duration Select (1-24 months) ───────────────────────────────────────────

function DurationSelect({ value, onChange }: { value: string; onChange: (months: string) => void }) {
    return (
        <div className="relative">
            <p className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Clock size={12} />
                Membership Duration *
            </p>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className="w-full text-sm border rounded-lg px-3.5 py-2.5 h-auto focus:ring-2 transition-all"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-color)',
                        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                    }}
                >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                        <SelectItem
                            key={m}
                            value={String(m)}
                            className="cursor-pointer text-sm"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {m === 1 ? '1 Month' : m === 12 ? '12 Months (1 Year)' : m === 24 ? '24 Months (2 Years)' : `${m} Months`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── GenderSelect ─────────────────────────────────────────────────────────────

function GenderSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    return (
        <div className="relative">
            <p className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Users2 size={12} /> Gender
            </p>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className="w-full text-sm border rounded-lg px-3.5 py-2.5 h-auto"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-color)',
                        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    {['Male', 'Female', 'Other'].map(g => (
                        <SelectItem key={g} value={g.toLowerCase()} style={{ color: 'var(--text-primary)' }}>{g}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── BloodGroupSelect ─────────────────────────────────────────────────────────

function BloodGroupSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    return (
        <div className="relative">
            <p className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Droplets size={12} /> Blood Group
            </p>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className="w-full text-sm border rounded-lg px-3.5 py-2.5 h-auto"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-color)',
                        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <SelectItem key={bg} value={bg} style={{ color: 'var(--text-primary)' }}>{bg}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color }: { icon: any; label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: color ? `${color}20` : 'var(--accent-light)' }}>
                <Icon size={14} style={{ color: color || 'var(--accent)' }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: color || 'var(--accent)' }}>
                {label}
            </p>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
        </div>
    );
}

// ─── MemberForm ───────────────────────────────────────────────────────────────

export default function MemberForm({ formData, onChange, onSubmit, onCancel, isEditing }: MemberFormProps) {
    const [durationMonths, setDurationMonths] = useState('1');

    // Set initial duration from existing expiry if editing
    useEffect(() => {
        if (isEditing && formData.joinDate && formData.expiryDate) {
            const join = new Date(formData.joinDate);
            const expiry = new Date(formData.expiryDate);
            const months = Math.round((expiry.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            if (months >= 1 && months <= 24) setDurationMonths(String(months));
        }
    }, []);

    const handleChange = (field: string, value: string) => onChange({ ...formData, [field]: value });

    // When join date or duration changes → auto-compute expiry
    const handleJoinDateChange = (val: string) => {
        const newData = { ...formData, joinDate: val };
        if (val && durationMonths) {
            const expiry = addMonths(new Date(val + 'T00:00:00'), parseInt(durationMonths));
            newData.expiryDate = format(expiry, 'yyyy-MM-dd');
        }
        onChange(newData);
    };

    const handleDurationChange = (months: string) => {
        setDurationMonths(months);
        if (formData.joinDate && months) {
            const expiry = addMonths(new Date(formData.joinDate + 'T00:00:00'), parseInt(months));
            onChange({ ...formData, expiryDate: format(expiry, 'yyyy-MM-dd') });
        }
    };

    return (
        <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={onCancel}
                    className="p-2 rounded-lg transition-all hover:bg-[var(--bg-tertiary)] hover:scale-105 active:scale-95"
                    style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isEditing ? 'Edit Member' : 'Add New Member'}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {isEditing ? 'Update member information' : 'Fill in details to add a new member'}
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* ── Personal Information ── */}
                <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                    <SectionHeader icon={User} label="Personal Information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <FloatingInput id="name" label="Full Name" icon={User} value={formData.name}
                                onChange={v => handleChange('name', v)} required />
                        </div>
                        <FloatingInput id="phone" label="Phone Number" icon={Phone} value={formData.phone}
                            onChange={v => handleChange('phone', v)} type="tel" required />
                        <FloatingInput id="email" label="Email Address" icon={Mail} value={formData.email}
                            onChange={v => handleChange('email', v)} type="email" />
                        <DatePickerField
                            label="Date of Birth"
                            icon={CalendarIcon}
                            value={formData.dob}
                            onChange={v => handleChange('dob', v)}
                        />
                        <GenderSelect value={formData.gender} onChange={v => handleChange('gender', v)} />
                        <BloodGroupSelect value={formData.bloodGroup} onChange={v => handleChange('bloodGroup', v)} />
                        <div className="sm:col-span-2">
                            <FloatingTextarea id="address" label="Address" icon={MapPin} value={formData.address}
                                onChange={v => handleChange('address', v)} />
                        </div>
                    </div>
                </div>

                {/* ── Emergency Contact ── */}
                <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                    <SectionHeader icon={Heart} label="Emergency Contact" color="#ef4444" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FloatingInput id="emergencyContact" label="Contact Name" icon={User} value={formData.emergencyContact}
                            onChange={v => handleChange('emergencyContact', v)} />
                        <FloatingInput id="emergencyPhone" label="Contact Phone" icon={Phone} value={formData.emergencyPhone}
                            onChange={v => handleChange('emergencyPhone', v)} type="tel" />
                    </div>
                </div>

                {/* ── Membership ── */}
                <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                    <SectionHeader icon={Dumbbell} label="Membership Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Start Date — Calendar Picker */}
                        <DatePickerField
                            label="Membership Start Date"
                            icon={CalendarIcon}
                            value={formData.joinDate}
                            onChange={handleJoinDateChange}
                            required
                        />

                        {/* Duration Dropdown — auto-computes expiry */}
                        <DurationSelect value={durationMonths} onChange={handleDurationChange} />

                        {/* Computed Expiry — read only display */}
                        {formData.expiryDate && (
                            <div className="sm:col-span-2">
                                <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
                                    style={{ backgroundColor: 'var(--accent-light)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                    <CalendarIcon size={15} style={{ color: 'var(--accent)' }} />
                                    <span style={{ color: 'var(--text-muted)' }}>Membership expires on:</span>
                                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                                        {format(new Date(formData.expiryDate + 'T00:00:00'), 'dd MMMM yyyy')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-8">
                    <button type="button" onClick={onCancel}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-tertiary)] active:scale-[0.98]"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        Cancel
                    </button>
                    <button type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488, #059669)',
                            boxShadow: '0 4px 15px rgba(13,148,136,0.35)',
                        }}>
                        <Dumbbell size={15} />
                        {isEditing ? 'Update Member' : 'Add Member'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
