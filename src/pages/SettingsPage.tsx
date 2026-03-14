import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessageTemplate, MessageLog, User } from '../types';
import { useAuth } from '../context/AuthContext';
import WhatsAppModal from '../components/WhatsAppModal';
import { Smartphone, MessageSquare, Plus, Edit, Trash2, Save, AlertCircle, FileText, Clock, CheckCircle, XCircle, History, Users, Shield, UserPlus, ToggleLeft, ToggleRight, Receipt } from 'lucide-react';

type Tab = 'connection' | 'templates' | 'log' | 'invoices' | 'staff';

export default function SettingsPage() {
    const { user: currentUser } = useAuth();
    const [whatsappStatus, setWhatsappStatus] = useState<{ ready: boolean; qrCode: string | null }>({ ready: false, qrCode: null });
    const [showQrModal, setShowQrModal] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [newTemplate, setNewTemplate] = useState<{ name: string; content: string } | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [messageLog, setMessageLog] = useState<MessageLog[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('connection');

    // Staff management
    const [staffUsers, setStaffUsers] = useState<User[]>([]);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'staff', phone: '', email: '' });
    const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<string | null>(null);
    const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);

    // Invoice Settings
    const [invoiceSettings, setInvoiceSettings] = useState({
        gymName: '', gymAddress: '', gymGstin: '', gstEnabled: 'true', gstRate: '18'
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [status, tpls, logs] = await Promise.all([api.getWhatsAppStatus(), api.getTemplates(), api.getMessageLog(50)]);
            setWhatsappStatus(status); setTemplates(tpls); setMessageLog(logs);
            if (isOwnerOrAdmin) {
                try {
                    const [users, invSettings] = await Promise.all([api.getUsers(), api.getInvoiceSettings()]);
                    setStaffUsers(users);
                    setInvoiceSettings({
                        gymName: invSettings.gym_name || '',
                        gymAddress: invSettings.gym_address || '',
                        gymGstin: invSettings.gym_gstin || '',
                        gstEnabled: invSettings.gst_enabled || 'true',
                        gstRate: invSettings.gst_rate || '18'
                    });
                } catch { }
            }
        } catch (err) { /* ignore */ }
    };

    const showNotif = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveTemplate = async (template: { id?: string; name: string; content: string }) => {
        try {
            await api.saveTemplate(template);
            showNotif('Template saved', 'success');
            setEditingTemplate(null); setNewTemplate(null);
            loadData();
        } catch (err) { showNotif('Failed to save', 'error'); }
    };

    const handleDeleteTemplate = async (id: string) => {
        setPendingDeleteTemplateId(id);
    };

    const confirmDeleteTemplate = async () => {
        if (!pendingDeleteTemplateId) return;
        try { await api.deleteTemplate(pendingDeleteTemplateId); showNotif('Template deleted', 'success'); loadData(); }
        catch (err) { showNotif('Failed', 'error'); }
        finally { setPendingDeleteTemplateId(null); }
    };

    const handleSaveInvoiceSettings = async () => {
        setSavingSettings(true);
        try {
            await api.updateInvoiceSettings(invoiceSettings);
            showNotif('Invoice settings saved', 'success');
        } catch (err) {
            showNotif('Failed to save settings', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.password || !newUser.fullName) {
            showNotif('Username, password, and full name are required', 'error');
            return;
        }
        try {
            await api.createUser(newUser);
            showNotif(`User "${newUser.fullName}" created`, 'success');
            setShowAddUser(false);
            setNewUser({ username: '', password: '', fullName: '', role: 'staff', phone: '', email: '' });
            loadData();
        } catch (err: any) { showNotif(err.message || 'Failed to create user', 'error'); }
    };

    const handleToggleActive = async (u: User) => {
        try {
            await api.updateUser(u.id, { isActive: !u.is_active });
            showNotif(`User ${u.is_active ? 'deactivated' : 'activated'}`, 'success');
            loadData();
        } catch (err: any) { showNotif(err.message || 'Failed', 'error'); }
    };

    const handleDeleteUser = async (u: User) => {
        setPendingDeleteUser(u);
    };

    const confirmDeleteUser = async () => {
        if (!pendingDeleteUser) return;
        try {
            await api.deleteUser(pendingDeleteUser.id);
            showNotif('User deleted', 'success');
            loadData();
        } catch (err: any) { showNotif(err.message || 'Failed', 'error'); }
        finally { setPendingDeleteUser(null); }
    };

    const roleBadge = (role: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            owner: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
            admin: { bg: 'rgba(13,148,136,0.12)', text: '#0d9488' },
            trainer: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
            staff: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
        };
        const c = colors[role] || colors.staff;
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ backgroundColor: c.bg, color: c.text }}>{role}</span>;
    };

    const tabs = [
        { id: 'connection' as Tab, label: 'Connection', icon: Smartphone },
        { id: 'templates' as Tab, label: `Templates (${templates.length})`, icon: MessageSquare },
        { id: 'log' as Tab, label: `Message Log (${messageLog.length})`, icon: History },
        ...(isOwnerOrAdmin ? [{ id: 'invoices' as Tab, label: 'Invoices', icon: Receipt }, { id: 'staff' as Tab, label: `Staff (${staffUsers.length})`, icon: Users }] : []),
    ];

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage WhatsApp, templates, message history{isOwnerOrAdmin ? ', and staff' : ''}</p>
            </div>

            {/* Delete Template Confirm */}
            {pendingDeleteTemplateId && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="w-full max-w-sm rounded-2xl p-6 animate-scale-in" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--danger-bg)' }}><Trash2 className="w-5 h-5" style={{ color: 'var(--danger)' }} /></div>
                            <div><p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Delete Template?</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This cannot be undone.</p></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setPendingDeleteTemplateId(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={confirmDeleteTemplate}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                                style={{ backgroundColor: 'var(--danger)' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Confirm */}
            {pendingDeleteUser && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="w-full max-w-sm rounded-2xl p-6 animate-scale-in" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--danger-bg)' }}><Trash2 className="w-5 h-5" style={{ color: 'var(--danger)' }} /></div>
                            <div><p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Delete "{pendingDeleteUser.full_name || pendingDeleteUser.fullName}"?</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This user will permanently lose access.</p></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setPendingDeleteUser(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={confirmDeleteUser}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                                style={{ backgroundColor: 'var(--danger)' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

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
            <div className="flex gap-1 p-1 rounded-xl animate-fade-in-up overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)', animationDelay: '100ms' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-w-fit"
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

            {showQrModal && <WhatsAppModal onClose={() => { setShowQrModal(false); loadData(); }} />}

            {/* CONNECTION TAB */}
            {activeTab === 'connection' && (
                <div className="max-w-2xl space-y-4 animate-fade-in-up">
                    <div className="surface p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp Connection</h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Link your WhatsApp for automated messages</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: whatsappStatus.ready ? '#10b981' : '#f59e0b' }} />
                                <span className="text-sm font-medium" style={{ color: whatsappStatus.ready ? '#10b981' : '#f59e0b' }}>
                                    {whatsappStatus.ready ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            {!whatsappStatus.ready && (
                                <button onClick={() => setShowQrModal(true)} className="btn-primary text-sm py-2">Connect</button>
                            )}
                        </div>
                    </div>
                    <div className="surface p-6">
                        <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>WhatsApp Features</h4>
                        <div className="space-y-3">
                            {[
                                { icon: '💬', title: 'Single Messages', desc: 'Send reminders to individual members from the Members page' },
                                { icon: '📨', title: 'Bulk Messaging', desc: 'Select multiple members and send template-based messages' },
                                { icon: '🎂', title: 'Birthday Wishes', desc: 'Automatic birthday messages for members with DOB set' },
                                { icon: '⏰', title: 'Expiry Reminders', desc: 'Daily automated reminders for expiring memberships' },
                            ].map(f => (
                                <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    <span className="text-lg">{f.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
                <div className="max-w-2xl space-y-4 animate-fade-in-up">
                    <div className="surface p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Message Templates</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Variables: {'{name}'}, {'{expiry_date}'}, {'{phone}'}</p>
                                </div>
                            </div>
                            <button onClick={() => setNewTemplate({ name: '', content: '' })} className="btn-primary flex items-center gap-1.5 text-sm py-2">
                                <Plus className="w-4 h-4" /> New
                            </button>
                        </div>
                        <div className="space-y-3">
                            {newTemplate && (
                                <div className="rounded-xl p-4 space-y-3 animate-scale-in" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-glow)' }}>
                                    <input type="text" placeholder="Template name..." value={newTemplate.name}
                                        onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    <textarea placeholder="Message content..." value={newTemplate.content}
                                        onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                        rows={3} className="w-full px-3 py-2 rounded-lg text-sm input-field resize-none" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setNewTemplate(null)} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                                        <button onClick={() => handleSaveTemplate(newTemplate)} className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
                                            <Save className="w-3.5 h-3.5" /> Save
                                        </button>
                                    </div>
                                </div>
                            )}
                            {templates.map(tpl => (
                                <div key={tpl.id} className="rounded-xl p-4 transition-all" style={{ border: '1px solid var(--border-color)' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                >
                                    {editingTemplate?.id === tpl.id ? (
                                        <div className="space-y-3">
                                            <input type="text" value={editingTemplate.name}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                            <textarea value={editingTemplate.content}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                                rows={3} className="w-full px-3 py-2 rounded-lg text-sm input-field resize-none" />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setEditingTemplate(null)} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                                                <button onClick={() => handleSaveTemplate({ id: editingTemplate.id, name: editingTemplate.name, content: editingTemplate.content })}
                                                    className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
                                                    <Save className="w-3.5 h-3.5" /> Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tpl.name}</h4>
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditingTemplate(tpl)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--accent-light)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    ><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{tpl.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {templates.length === 0 && !newTemplate && (
                                <div className="text-center py-10">
                                    <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--border-color)' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No templates yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MESSAGE LOG TAB */}
            {activeTab === 'log' && (
                <div className="surface overflow-hidden animate-fade-in-up">
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Time', 'Member', 'Phone', 'Message', 'Status'].map(h => (
                                        <th key={h} className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {messageLog.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <History className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No messages sent yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    messageLog.map(log => (
                                        <tr key={log.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                    {new Date(log.sent_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{log.member_name || '—'}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{log.phone}</td>
                                            <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{log.message}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg" style={{
                                                    backgroundColor: log.status === 'sent' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                    color: log.status === 'sent' ? 'var(--success)' : 'var(--danger)',
                                                }}>
                                                    {log.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="sm:hidden">
                        {messageLog.length === 0 ? (
                            <div className="py-16 text-center px-4">
                                <History className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No messages sent yet</p>
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                {messageLog.map(log => (
                                    <div key={log.id} className="p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{log.member_name || '—'}</span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{
                                                backgroundColor: log.status === 'sent' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                color: log.status === 'sent' ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                {log.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="text-xs mb-1 truncate" style={{ color: 'var(--text-muted)' }}>{log.message}</div>
                                        <div className="text-[11px] flex gap-2" style={{ color: 'var(--text-muted)' }}>
                                            <span>{log.phone}</span>
                                            <span>•</span>
                                            <span>{new Date(log.sent_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* INVOICE SETTINGS TAB */}
            {activeTab === 'invoices' && isOwnerOrAdmin && (
                <div className="max-w-2xl space-y-4 animate-fade-in-up">
                    <div className="surface p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Invoice Settings</h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Configure details that appear on printed invoices</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Gym Name</label>
                                <input type="text" value={invoiceSettings.gymName} onChange={e => setInvoiceSettings({ ...invoiceSettings, gymName: e.target.value })}
                                    placeholder="Your Gym Name" className="w-full px-4 py-2.5 rounded-xl text-sm input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Gym Address</label>
                                <textarea value={invoiceSettings.gymAddress} onChange={e => setInvoiceSettings({ ...invoiceSettings, gymAddress: e.target.value })}
                                    placeholder="Full address for invoice header" className="w-full px-4 py-2.5 rounded-xl text-sm input-field resize-none h-20" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>GSTIN (Optional)</label>
                                    <input type="text" value={invoiceSettings.gymGstin} onChange={e => setInvoiceSettings({ ...invoiceSettings, gymGstin: e.target.value })}
                                        placeholder="Business GST number" className="w-full px-4 py-2.5 rounded-xl text-sm input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Default GST Rate (%)</label>
                                    <input type="number" value={invoiceSettings.gstRate} onChange={e => setInvoiceSettings({ ...invoiceSettings, gstRate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm input-field" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <input type="checkbox" id="gst-enable" checked={invoiceSettings.gstEnabled === 'true'}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, gstEnabled: e.target.checked ? 'true' : 'false' })}
                                    className="w-4 h-4 rounded" />
                                <div>
                                    <label htmlFor="gst-enable" className="font-medium text-sm block" style={{ color: 'var(--text-primary)' }}>Enable GST Back-calculation</label>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>If enabled, collected payments will automatically have GST separated on invoices based on the default rate.</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <button onClick={handleSaveInvoiceSettings} disabled={savingSettings} className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STAFF MANAGEMENT TAB */}
            {activeTab === 'staff' && isOwnerOrAdmin && (
                <div className="space-y-4 animate-fade-in-up">
                    {/* Add User Form */}
                    <div className="surface p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Staff Management</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage who can access Gym Manager</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary flex items-center gap-1.5 text-sm py-2">
                                <UserPlus className="w-4 h-4" /> Add Staff
                            </button>
                        </div>

                        {showAddUser && (
                            <div className="rounded-xl p-5 mb-5 space-y-4 animate-scale-in" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-glow)' }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Username *</label>
                                        <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                            placeholder="john_doe" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Password *</label>
                                        <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="Min 4 chars" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                                        <input type="text" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                            placeholder="John Doe" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Role</label>
                                        <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg text-sm input-field">
                                            <option value="staff">Staff</option>
                                            <option value="trainer">Trainer</option>
                                            {currentUser?.role === 'owner' && <option value="admin">Admin</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                                        <input type="text" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                            placeholder="+91 XXXXX" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                                        <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="john@gym.com" className="w-full px-3 py-2 rounded-lg text-sm input-field" />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowAddUser(false)} className="btn-secondary text-sm py-1.5 px-4">Cancel</button>
                                    <button onClick={handleCreateUser} className="btn-primary flex items-center gap-1 text-sm py-1.5 px-4">
                                        <Save className="w-3.5 h-3.5" /> Create User
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Staff Table */}
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                        {['User', 'Role', 'Contact', 'Status', 'Actions'].map(h => (
                                            <th key={h} className={`px-4 py-3 text-sm font-medium ${h === 'Actions' ? 'text-right' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffUsers.map(u => (
                                        <tr key={u.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                                                        {(u.full_name || u.fullName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.full_name || u.fullName}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{roleBadge(u.role)}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</div>
                                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email || '—'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg" style={{
                                                    backgroundColor: u.is_active ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                    color: u.is_active ? 'var(--success)' : 'var(--danger)',
                                                }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.is_active ? 'var(--success)' : 'var(--danger)' }} />
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {u.role !== 'owner' && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'}
                                                            className="p-2 rounded-lg transition-all" style={{ color: u.is_active ? '#f59e0b' : '#10b981' }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                        </button>
                                                        {currentUser?.role === 'owner' && (
                                                            <button onClick={() => handleDeleteUser(u)} title="Delete"
                                                                className="p-2 rounded-lg transition-all" style={{ color: '#ef4444' }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            ><Trash2 className="w-4 h-4" /></button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="sm:hidden">
                            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                {staffUsers.map(u => (
                                    <div key={u.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                                                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                                                {(u.full_name || u.fullName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.full_name || u.fullName}</span>
                                                    {roleBadge(u.role)}
                                                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0" style={{
                                                        backgroundColor: u.is_active ? 'var(--success-bg)' : 'var(--danger-bg)',
                                                        color: u.is_active ? 'var(--success)' : 'var(--danger)',
                                                    }}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                                                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.phone || ''} {u.email ? `• ${u.email}` : ''}</div>
                                            </div>
                                        </div>
                                        {u.role !== 'owner' && (
                                            <div className="flex gap-2 mt-3 ml-[52px]">
                                                <button onClick={() => handleToggleActive(u)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                    style={{ backgroundColor: u.is_active ? 'rgba(245,158,11,0.12)' : 'var(--success-bg)', color: u.is_active ? '#f59e0b' : 'var(--success)' }}>
                                                    {u.is_active ? <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</> : <><ToggleLeft className="w-3.5 h-3.5" /> Activate</>}
                                                </button>
                                                {currentUser?.role === 'owner' && (
                                                    <button onClick={() => handleDeleteUser(u)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                        style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
