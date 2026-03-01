import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface MemberFormProps {
    formData: any;
    onChange: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isEditing: boolean;
}

export default function MemberForm({ formData, onChange, onSubmit, onCancel, isEditing }: MemberFormProps) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...formData, [field]: value });
    };

    const fieldStyle = {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
    };

    const labelStyle = { color: 'var(--text-secondary)' };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onCancel}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isEditing ? 'Edit Member' : 'Add New Member'}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {isEditing ? 'Update member details' : 'Enter the details for the new member'}
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div
                    className="rounded-xl border p-6 space-y-6"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}
                >
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Full Name *</label>
                                <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Phone *</label>
                                <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Email</label>
                                <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Gender</label>
                                <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Blood Group</label>
                                <select value={formData.bloodGroup} onChange={e => handleChange('bloodGroup', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}>
                                    <option value="">Select Blood Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg =>
                                        <option key={bg} value={bg}>{bg}</option>
                                    )}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Address</label>
                                <textarea value={formData.address} onChange={e => handleChange('address', e.target.value)} rows={2}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150 resize-none"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Emergency Contact</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Contact Name</label>
                                <input type="text" value={formData.emergencyContact} onChange={e => handleChange('emergencyContact', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Contact Phone</label>
                                <input type="tel" value={formData.emergencyPhone} onChange={e => handleChange('emergencyPhone', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Membership */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Membership Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Join Date *</label>
                                <input type="date" value={formData.joinDate} onChange={e => handleChange('joinDate', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>Expiry Date *</label>
                                <input type="date" value={formData.expiryDate} onChange={e => handleChange('expiryDate', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                                    style={fieldStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        Cancel
                    </button>
                    <button type="submit"
                        className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: 'var(--accent)', boxShadow: '0 1px 2px rgba(13,148,136,0.2)' }}>
                        {isEditing ? 'Update Member' : 'Add Member'}
                    </button>
                </div>
            </form>
        </div>
    );
}
