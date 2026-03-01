import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Member, MessageTemplate } from '../types';
import MemberForm from '../components/MemberForm';
import { Search, Plus, Trash2, Edit, MessageCircle, AlertCircle, Users, Send, CheckSquare, Square, Cake } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkResults, setBulkResults] = useState<{ sent: number; failed: number } | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'birthday'>('all');

    const emptyForm = {
        name: '', phone: '', email: '', dob: '', address: '', emergencyContact: '', emergencyPhone: '', gender: '', bloodGroup: '',
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchMembers(); loadTemplates(); }, []);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchMembers = async () => {
        try {
            const data = await api.getMembers();
            const updated = data.map(m => {
                const isExpired = isPast(new Date(m.expiryDate)) && !isToday(new Date(m.expiryDate));
                return { ...m, status: (isExpired ? 'expired' : 'active') as 'active' | 'expired' };
            });
            setMembers(updated);
        } catch (err) { console.error('Failed to fetch members'); }
        finally { setLoading(false); }
    };

    const loadTemplates = async () => {
        try { const t = await api.getTemplates(); setTemplates(t); } catch (err) { /* ignore */ }
    };

    const isBirthdayToday = (dob: string | undefined) => {
        if (!dob) return false;
        const today = new Date();
        const d = parseISO(dob);
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMember) {
                await api.updateMember(editingMember.id, formData);
                showNotification('Member updated', 'success');
            } else {
                await api.addMember(formData);
                showNotification('Member added', 'success');
            }
            setIsAdding(false); setEditingMember(null); setFormData(emptyForm);
            fetchMembers();
        } catch (err) { showNotification('Failed to save member', 'error'); }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.deleteMember(id); showNotification('Member deleted', 'success'); fetchMembers();
            } catch (err) { showNotification('Failed to delete', 'error'); }
        }
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setFormData({
            name: member.name, phone: member.phone, email: member.email, dob: member.dob || '',
            joinDate: member.joinDate, expiryDate: member.expiryDate,
            address: member.address || '', emergencyContact: member.emergencyContact || '',
            emergencyPhone: member.emergencyPhone || '', gender: member.gender || '', bloodGroup: member.bloodGroup || ''
        });
        setIsAdding(true);
    };

    const handleSendWhatsApp = async (member: Member) => {
        try {
            const message = `Hello ${member.name}, your gym membership expired on ${member.expiryDate}. Please renew it to continue enjoying our services.`;
            await api.sendWhatsApp(member.phone, message, member.id);
            showNotification(`WhatsApp sent to ${member.name}`, 'success');
        } catch (err: any) { showNotification(err.message || 'Failed', 'error'); }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredMembers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMembers.map(m => m.id)));
        }
    };

    const handleBulkSend = async () => {
        if (!selectedTemplate || selectedIds.size === 0) return;
        setBulkSending(true);
        setBulkResults(null);
        try {
            const result = await api.sendBulkWhatsApp(Array.from(selectedIds), selectedTemplate);
            const sent = result.results.filter((r: any) => r.status === 'sent').length;
            const failed = result.results.filter((r: any) => r.status === 'failed').length;
            setBulkResults({ sent, failed });
            showNotification(`Sent ${sent} messages, ${failed} failed`, sent > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
        } catch (err: any) { showNotification(err.message || 'Bulk send failed', 'error'); }
        finally { setBulkSending(false); }
    };

    const filteredMembers = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
        if (!matchSearch) return false;
        if (statusFilter === 'active') return m.status === 'active';
        if (statusFilter === 'expired') return m.status === 'expired';
        if (statusFilter === 'birthday') return isBirthdayToday(m.dob);
        return true;
    });

    if (isAdding) {
        return <MemberForm formData={formData} onChange={setFormData} onSubmit={handleSubmit}
            onCancel={() => { setIsAdding(false); setEditingMember(null); setFormData(emptyForm); }} isEditing={!!editingMember} />;
    }

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Members</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{members.length} total members</p>
            </div>

            {notification && (
                <div className="p-3.5 rounded-xl flex items-center gap-3 animate-fade-in-up border" style={{
                    backgroundColor: notification.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    borderColor: notification.type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)',
                }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="font-medium text-sm">{notification.message}</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-1 sm:max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search by name or phone..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedIds.size > 0 && (
                        <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all" style={{
                            backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(5,150,105,0.2)'
                        }}>
                            <Send className="w-4 h-4" /> Bulk Send ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white w-full sm:w-auto justify-center transition-all active:scale-[0.98]"
                        style={{ backgroundColor: 'var(--accent)', boxShadow: '0 1px 2px rgba(13,148,136,0.2)' }}
                    >
                        <Plus className="w-4 h-4" /> Add Member
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 rounded-xl animate-fade-in-up" style={{ backgroundColor: 'var(--bg-tertiary)', animationDelay: '150ms' }}>
                {(['all', 'active', 'expired', 'birthday'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all capitalize flex items-center justify-center gap-1"
                        style={{
                            backgroundColor: statusFilter === f ? 'var(--bg-secondary)' : 'transparent',
                            color: statusFilter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: statusFilter === f ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        {f === 'birthday' && <Cake className="w-3 h-3" />}
                        {f === 'all' ? `All (${members.length})` : f === 'active' ? `Active (${members.filter(m => m.status === 'active').length})` : f === 'expired' ? `Expired (${members.filter(m => m.status === 'expired').length})` : `Birthday 🎂`}
                    </button>
                ))}
            </div>

            {/* Bulk Send Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => { setShowBulkModal(false); setBulkResults(null); }}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative p-6 max-w-md w-full animate-scale-in rounded-xl border"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Send Bulk WhatsApp</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                            Sending to <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size} members</strong>
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Template</label>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                <option value="">Choose a template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        {selectedTemplate && (
                            <div className="p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {templates.find(t => t.id === selectedTemplate)?.content}
                            </div>
                        )}
                        {bulkResults && (
                            <div className="p-3 rounded-lg mb-4 text-sm" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                                ✅ {bulkResults.sent} sent, {bulkResults.failed} failed
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => { setShowBulkModal(false); setBulkResults(null); }}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={handleBulkSend} disabled={!selectedTemplate || bulkSending}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                                style={{ backgroundColor: 'var(--accent)' }}>
                                {bulkSending ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Send All</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Table */}
            <div className="rounded-xl border overflow-hidden animate-fade-in-up"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)', animationDelay: '200ms' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th className="px-4 py-3.5 w-10">
                                    <button onClick={toggleSelectAll} style={{ color: 'var(--text-muted)' }}>
                                        {selectedIds.size === filteredMembers.length && filteredMembers.length > 0
                                            ? <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                            : <Square className="w-4 h-4" />}
                                    </button>
                                </th>
                                {['Name', 'Contact', 'Membership', 'Status', 'Actions'].map(h => (
                                    <th key={h} className={`px-4 py-3.5 text-xs font-medium uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                        Loading members...
                                    </div>
                                </td></tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No members found</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{statusFilter === 'birthday' ? 'No birthday today!' : 'Add your first member to get started'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map(member => (
                                    <tr key={member.id} className="group transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="px-4 py-3.5">
                                            <button onClick={() => toggleSelect(member.id)} style={{ color: 'var(--text-muted)' }}>
                                                {selectedIds.has(member.id)
                                                    ? <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                                    : <Square className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                                                {isBirthdayToday(member.dob) && <span title="Birthday today!">🎂</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{member.phone}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Joined: {member.joinDate}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Expires: {member.expiryDate}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold" style={{
                                                backgroundColor: member.status === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                color: member.status === 'active' ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.status === 'active' ? 'var(--success)' : 'var(--danger)' }} />
                                                {member.status === 'active' ? 'Active' : 'Expired'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleSendWhatsApp(member)} title="Send WhatsApp"
                                                    className="p-1.5 rounded-md transition-colors hover:bg-[var(--success-bg)]" style={{ color: 'var(--success)' }}>
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEdit(member)} title="Edit"
                                                    className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-muted)' }}>
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(member.id)} title="Delete"
                                                    className="p-1.5 rounded-md transition-colors hover:bg-[var(--danger-bg)]" style={{ color: 'var(--danger)' }}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
