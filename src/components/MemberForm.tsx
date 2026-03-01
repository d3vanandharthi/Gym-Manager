import React from 'react';

interface MemberFormProps {
    formData: {
        name: string;
        phone: string;
        email: string;
        dob: string;
        joinDate: string;
        expiryDate: string;
        address?: string;
        emergencyContact?: string;
        emergencyPhone?: string;
        gender?: string;
        bloodGroup?: string;
    };
    onChange: (data: MemberFormProps['formData']) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isEditing: boolean;
}

export default function MemberForm({ formData, onChange, onSubmit, onCancel, isEditing }: MemberFormProps) {
    return (
        <div className="surface p-6 max-w-2xl mx-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isEditing ? 'Edit Member' : 'Add New Member'}
                </h2>
                <button onClick={onCancel} className="text-sm font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                        <input type="text" required value={formData.name}
                            onChange={e => onChange({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>WhatsApp Number</label>
                        <input type="text" required value={formData.phone}
                            onChange={e => onChange({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="+91 9876543210" />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Include country code</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                        <input type="email" value={formData.email}
                            onChange={e => onChange({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
                        <input type="date" value={formData.dob}
                            onChange={e => onChange({ ...formData, dob: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Join Date</label>
                        <input type="date" required value={formData.joinDate}
                            onChange={e => onChange({ ...formData, joinDate: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Expiry Date</label>
                        <input type="date" required value={formData.expiryDate}
                            onChange={e => onChange({ ...formData, expiryDate: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" />
                    </div>

                    <div className="md:col-span-2 pt-2 pb-1 border-t border-[var(--border-color)]">
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Additional Details (Optional)</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Address</label>
                        <textarea value={formData.address || ''}
                            onChange={e => onChange({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field resize-none h-20" placeholder="Full residential address" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Gender</label>
                        <select value={formData.gender || ''}
                            onChange={e => onChange({ ...formData, gender: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Blood Group</label>
                        <select value={formData.bloodGroup || ''}
                            onChange={e => onChange({ ...formData, bloodGroup: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                            <option value="">Select blood group</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Emergency Contact Name</label>
                        <input type="text" value={formData.emergencyContact || ''}
                            onChange={e => onChange({ ...formData, emergencyContact: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="Relative/Friend's Name" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Emergency Phone</label>
                        <input type="text" value={formData.emergencyPhone || ''}
                            onChange={e => onChange({ ...formData, emergencyPhone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="Contact number" />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Member'}</button>
                </div>
            </form >
        </div >
    );
}
