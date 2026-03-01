import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Member, MessageTemplate } from '../types';
import MemberForm from '../components/MemberForm';
import { Search, Plus, Trash2, Edit, MessageCircle, AlertCircle, Users, Send, CheckSquare, Square, Cake } from 'lucide-react';
import { format, isPast, isToday, differenceInDays, parseISO } from 'date-fns';

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(true);

    // Bulk messaging
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkResults, setBulkResults] = useState<{ sent: number; failed: number } | null>(null);

    // Filter
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

    // Bulk select
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
            const sent = result.results.filter(r => r.status === 'sent').length;
            const failed = result.results.filter(r => r.status === 'failed').length;
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
                <div className="p-4 rounded-xl flex items-center gap-3 animate-fade-in-up" style={{
                    backgroundColor: notification.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{notification.message}</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search by name or phone..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none input-field" />
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedIds.size > 0 && (
                        <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{
                            backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)'
                        }}>
                            <Send className="w-4 h-4" /> Bulk Send ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Plus className="w-5 h-5" /> Add Member
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 rounded-xl animate-fade-in-up" style={{ backgroundColor: 'var(--bg-tertiary)', animationDelay: '150ms' }}>
                {(['all', 'active', 'expired', 'birthday'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all capitalize flex items-center justify-center gap-1"
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
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="surface p-6 max-w-md w-full animate-scale-in" style={{ boxShadow: 'var(--shadow-lg)' }}>
                        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Send Bulk WhatsApp
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                            Sending to <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size} members</strong>
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Select Template</label>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                                <option value="">Choose a template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        {selectedTemplate && (
                            <div className="p-3 rounded-xl mb-4 text-sm whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {templates.find(t => t.id === selectedTemplate)?.content}
                            </div>
                        )}
                        {bulkResults && (
                            <div className="p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                                ✅ {bulkResults.sent} sent, {bulkResults.failed} failed
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => { setShowBulkModal(false); setBulkResults(null); }} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleBulkSend} disabled={!selectedTemplate || bulkSending}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
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
            <div className="surface overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th className="px-4 py-4 w-10">
                                    <button onClick={toggleSelectAll} style={{ color: 'var(--text-muted)' }}>
                                        {selectedIds.size === filteredMembers.length && filteredMembers.length > 0
                                            ? <CheckSquare className="w-4 h-4" style={{ color: '#6366f1' }} />
                                            : <Square className="w-4 h-4" />}
                                    </button>
                                </th>
                                {['Name', 'Contact', 'Membership', 'Status', 'Actions'].map(h => (
                                    <th key={h} className={`px-4 py-4 text-sm font-medium ${h === 'Actions' ? 'text-right' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No members found</p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{statusFilter === 'birthday' ? 'No birthday today!' : 'Add your first member to get started'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map(member => (
                                    <tr key={member.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td className="px-4 py-4">
                                            <button onClick={() => toggleSelect(member.id)} style={{ color: 'var(--text-muted)' }}>
                                                {selectedIds.has(member.id)
                                                    ? <CheckSquare className="w-4 h-4" style={{ color: '#6366f1' }} />
                                                    : <Square className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                                                {isBirthdayToday(member.dob) && <span title="Birthday today!">🎂</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{member.phone}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Joined: {member.joinDate}</div>
                                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Expires: {member.expiryDate}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{
                                                backgroundColor: member.status === 'active' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                color: member.status === 'active' ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.status === 'active' ? 'var(--success)' : 'var(--danger)' }} />
                                                {member.status === 'active' ? 'Active' : 'Expired'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleSendWhatsApp(member)} title="Send WhatsApp"
                                                    className="p-2 rounded-lg transition-all" style={{ color: '#10b981' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--success-bg)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                ><MessageCircle className="w-4 h-4" /></button>
                                                <button onClick={() => handleEdit(member)} title="Edit"
                                                    className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                ><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(member.id)} title="Delete"
                                                    className="p-2 rounded-lg transition-all" style={{ color: '#ef4444' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                ><Trash2 className="w-4 h-4" /></button>
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
