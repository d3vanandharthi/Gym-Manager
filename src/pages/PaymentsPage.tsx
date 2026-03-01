import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Payment, Plan, Member, Invoice } from '../types';
import StatsCard from '../components/StatsCard';
import { CreditCard, Plus, IndianRupee, X, AlertCircle, Trash2, TrendingUp, Receipt, Package, Edit2, Save, Download, FileText, ShoppingCart, Minus, ShoppingBag } from 'lucide-react';

type Tab = 'payments' | 'invoices' | 'plans' | 'pos';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('payments');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [summary, setSummary] = useState<any>(null);

    // Plan form
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [planForm, setPlanForm] = useState({ name: '', durationMonths: '', price: '' });

    const [form, setForm] = useState({ memberId: '', planId: '', amount: '', method: 'Cash', notes: '' });

    // POS State
    const posProducts = [
        { id: 'p1', name: 'Protein Shake', price: 150, category: 'Drink' },
        { id: 'p2', name: 'Water Bottle 1L', price: 50, category: 'Drink' },
        { id: 'p3', name: 'Energy Drink', price: 100, category: 'Drink' },
        { id: 'p4', name: 'Gym T-Shirt', price: 500, category: 'Merch' },
        { id: 'p5', name: 'Towel Rental', price: 30, category: 'Misc' },
        { id: 'p6', name: 'Protein Bar', price: 80, category: 'Food' },
    ];
    const [cart, setCart] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
    const [posMemberId, setPosMemberId] = useState('');
    const [posMethod, setPosMethod] = useState('Cash');
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [p, pl, m, s, inv] = await Promise.all([api.getPayments(), api.getPlans(), api.getMembers(), api.getRevenueSummary(), api.getInvoices()]);
            setPayments(p); setPlans(pl); setMembers(m); setSummary(s); setInvoices(inv);
        } catch (err) { console.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const showNotif = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handlePlanSelect = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        setForm({ ...form, planId, amount: plan ? String(plan.price) : form.amount });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.addPayment({ memberId: form.memberId, planId: form.planId || undefined, amount: parseFloat(form.amount), method: form.method, notes: form.notes });
            showNotif('Payment recorded', 'success');
            setShowForm(false);
            setForm({ memberId: '', planId: '', amount: '', method: 'Cash', notes: '' });
            loadData();
        } catch (err) { showNotif('Failed to record payment', 'error'); }
    };

    const handleDeletePayment = async (id: string) => {
        if (window.confirm('Delete this payment?')) {
            try {
                await api.deletePayment(id);
                showNotif('Payment deleted', 'success');
                loadData();
            } catch (err) { showNotif('Failed to delete', 'error'); }
        }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.addPlan({ name: planForm.name, durationMonths: parseInt(planForm.durationMonths), price: parseFloat(planForm.price) });
            showNotif('Plan saved', 'success');
            setShowPlanForm(false);
            setPlanForm({ name: '', durationMonths: '', price: '' });
            loadData();
        } catch (err) { showNotif('Failed to save plan', 'error'); }
    };

    const handleDeletePlan = async (id: string) => {
        if (window.confirm('Delete this plan?')) {
            try {
                await api.deletePlan(id);
                showNotif('Plan deleted', 'success');
                loadData();
            } catch (err) { showNotif('Failed to delete', 'error'); }
        }
    };

    const handleDownloadInvoice = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/invoices/${id}/html`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load invoice');
            const html = await res.text();
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(html);
                newWindow.document.close();
            }
        } catch (err) {
            console.error('Download error:', err);
        }
    };

    // POS Functions
    const addToCart = (product: { id: string, name: string, price: number }) => {
        setCart(prev => {
            const ext = prev.find(item => item.id === product.id);
            if (ext) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateCartQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) return { ...item, qty: Math.max(0, item.qty + delta) };
            return item;
        }).filter(item => item.qty > 0));
    };

    const addCustomItem = () => {
        if (!customItemName || !customItemPrice) return;
        const price = parseFloat(customItemPrice);
        if (isNaN(price) || price <= 0) return;
        addToCart({ id: 'custom-' + Date.now(), name: customItemName, price });
        setCustomItemName(''); setCustomItemPrice('');
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const handlePosCheckout = async () => {
        if (cartTotal <= 0) return showNotif('Cart is empty', 'error');
        if (!posMemberId) return showNotif('Select a member for billing', 'error');

        const notes = 'POS: ' + cart.map(i => `${i.qty}x ${i.name}`).join(', ');
        try {
            await api.addPayment({ memberId: posMemberId, planId: undefined, amount: cartTotal, method: posMethod, notes });
            showNotif('POS Sale Recorded', 'success');
            setCart([]); setPosMemberId(''); setCustomItemName(''); setCustomItemPrice('');
            loadData();
            setActiveTab('invoices'); // Auto switch to invoices to print receipt
        } catch (err) { showNotif('Sale failed', 'error'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start animate-fade-in-up">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payments & Billing</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage payments, plans, and revenue</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Record Payment
                </button>
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

            {/* Revenue Stats */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    <StatsCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="violet" trend={`${summary.totalPayments} payments`} />
                    <StatsCard title="This Month" value={`₹${summary.thisMonthRevenue.toLocaleString()}`} icon={TrendingUp} color="emerald" trend={`${summary.thisMonthPayments} payments`} />
                    <StatsCard title="Last Month" value={`₹${summary.lastMonthRevenue.toLocaleString()}`} icon={Receipt} color="amber" />
                    <StatsCard title="Active Plans" value={plans.length} icon={Package} color="indigo" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {(['payments', 'pos', 'invoices', 'plans'] as Tab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 capitalize flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        {tab === 'pos' && <ShoppingBag className="w-4 h-4" />}
                        {tab === 'payments' ? `Payments (${payments.length})` :
                            tab === 'invoices' ? `Invoices (${invoices.length})` :
                                tab === 'pos' ? 'POS' :
                                    `Plans (${plans.length})`}
                    </button>
                ))}
            </div>

            {/* Payment Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="surface p-6 max-w-md w-full relative animate-scale-in" style={{ boxShadow: 'var(--shadow-lg)' }}>
                        <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-muted)' }}>
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Record Payment</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Member</label>
                                <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                                    <option value="">Select member...</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Plan (optional)</label>
                                <select value={form.planId} onChange={e => handlePlanSelect(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                                    <option value="">Custom amount</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price} ({p.duration_months} mo)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
                                <input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Method</label>
                                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl outline-none input-field">
                                    {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl outline-none input-field" placeholder="Optional notes..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
                <div className="surface overflow-hidden animate-fade-in-up">
                    {/* Method breakdown bar */}
                    {summary?.methods?.length > 0 && (
                        <div className="px-6 pt-5 pb-3">
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Payment Methods</p>
                            <div className="flex rounded-full overflow-hidden h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                {summary.methods.map((m: any, i: number) => {
                                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
                                    const pct = summary.totalRevenue > 0 ? (m.total / summary.totalRevenue) * 100 : 0;
                                    return <div key={m.method} style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} title={`${m.method}: ₹${m.total}`} />;
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2">
                                {summary.methods.map((m: any, i: number) => {
                                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
                                    return (
                                        <div key={m.method} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                            {m.method} (₹{m.total.toLocaleString()})
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Date', 'Member', 'Plan', 'Amount', 'Method', 'Notes', ''].map(h => (
                                        <th key={h} className={`px-6 py-4 text-sm font-medium ${h === '' ? 'w-12' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No payments yet</p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Click "Record Payment" to get started</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map(p => (
                                        <tr key={p.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(p.paid_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.member_name || '—'}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.plan_name || 'Custom'}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold" style={{ color: '#6366f1' }}>₹{p.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{p.method}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                ><Trash2 className="w-3.5 h-3.5" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
                <div className="surface overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Invoice #', 'Date', 'Member', 'Plan', 'Total', 'Status', ''].map(h => (
                                        <th key={h} className={`px-6 py-4 text-sm font-medium ${h === '' ? 'w-12' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No invoices yet</p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Invoices are generated automatically on payment</p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.invoice_number}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(inv.issued_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.member_name}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.plan_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold" style={{ color: '#6366f1' }}>₹{inv.total.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Paid • {inv.method}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDownloadInvoice(inv.id)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.12)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title="Download/Print Invoice"
                                                ><Download className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PLANS TAB */}
            {activeTab === 'plans' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="flex justify-end">
                        <button onClick={() => setShowPlanForm(true)} className="btn-primary flex items-center gap-2 text-sm">
                            <Plus className="w-4 h-4" /> Add Plan
                        </button>
                    </div>

                    {/* New Plan Form */}
                    {showPlanForm && (
                        <div className="surface p-5 animate-scale-in">
                            <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>New Plan</h4>
                            <form onSubmit={handleSavePlan} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                                    <input type="text" required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg outline-none input-field text-sm" placeholder="e.g. Quarterly" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Duration (months)</label>
                                    <input type="number" required value={planForm.durationMonths} onChange={e => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg outline-none input-field text-sm" placeholder="3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price (₹)</label>
                                    <input type="number" required value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg outline-none input-field text-sm" placeholder="1500" />
                                </div>
                                <div className="sm:col-span-3 flex gap-3 justify-end">
                                    <button type="button" onClick={() => setShowPlanForm(false)} className="btn-secondary text-sm">Cancel</button>
                                    <button type="submit" className="btn-primary text-sm flex items-center gap-1"><Save className="w-4 h-4" /> Save Plan</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {plans.map(plan => (
                            <div key={plan.id} className="surface p-5 group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}>
                                        <Package className="w-5 h-5" style={{ color: '#6366f1' }} />
                                    </div>
                                    <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{plan.name}</h4>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <span className="text-2xl font-bold" style={{ color: '#6366f1' }}>₹{plan.price.toLocaleString()}</span>
                                    <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/ {plan.duration_months}mo</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {plans.length === 0 && !showPlanForm && (
                        <div className="surface py-16 text-center">
                            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No plans yet</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add a membership plan to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* POS TAB */}
            {activeTab === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="surface p-5">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <ShoppingBag className="w-5 h-5 text-indigo-500" /> Quick Add Items
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {posProducts.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)}
                                        className="p-4 rounded-xl text-left border transition-all hover:-translate-y-1"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                    >
                                        <p className="font-medium text-sm leading-tight mb-1">{p.name}</p>
                                        <p className="text-xs font-semibold" style={{ color: '#10b981' }}>₹{p.price}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="surface p-5">
                            <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Add Custom Item</h4>
                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                <input type="text" placeholder="Item Name (e.g. Wrap)" value={customItemName} onChange={e => setCustomItemName(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm input-field" />
                                <div className="relative w-full sm:w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>₹</span>
                                    <input type="number" placeholder="0.00" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm input-field" />
                                </div>
                                <button onClick={addCustomItem} className="btn-secondary whitespace-nowrap px-5">Add</button>
                            </div>
                        </div>
                    </div>

                    <div className="surface p-5 flex flex-col h-full sticky top-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                            <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Current Order</span>
                            {cart.length > 0 && <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-500 text-white">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
                        </h3>

                        <div className="flex-1 overflow-y-auto mb-4 min-h-[150px]">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--text-muted)' }}>
                                    <ShoppingBag className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-sm">Cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                            <div>
                                                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{item.price} each</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateCartQty(item.id, -1)} className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"><Minus className="w-3 h-3" /></button>
                                                <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                                                <button onClick={() => updateCartQty(item.id, 1)} className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"><Plus className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                                <span className="text-xl font-bold" style={{ color: '#10b981' }}>₹{cartTotal.toLocaleString()}</span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Member</label>
                                    <select value={posMemberId} onChange={e => setPosMemberId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm input-field">
                                        <option value="">Select a member...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Payment Method</label>
                                    <select value={posMethod} onChange={e => setPosMethod(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm input-field">
                                        {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button onClick={handlePosCheckout} disabled={cart.length === 0}
                                className={`w-full py-3 rounded-lg font-medium text-sm text-white transition-all ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                Checkout & Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
