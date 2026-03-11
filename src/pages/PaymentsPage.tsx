import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Payment, Plan, Member, Invoice } from '../types';
import StatsCard from '../components/StatsCard';
import { CreditCard, Plus, IndianRupee, X, AlertCircle, Trash2, TrendingUp, Receipt, Package, Save, Download, FileText, ShoppingCart, Minus, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

type TabId = 'payments' | 'invoices' | 'plans' | 'pos';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('payments');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [summary, setSummary] = useState<any>(null);
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
        const resolved = planId === '__custom__' ? '' : planId;
        const plan = plans.find(p => p.id === resolved);
        setForm({ ...form, planId: resolved, amount: plan ? String(plan.price) : form.amount });
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
        try { await api.deletePayment(id); showNotif('Payment deleted', 'success'); loadData(); }
        catch (err) { showNotif('Failed to delete', 'error'); }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.addPlan({ name: planForm.name, durationMonths: parseInt(planForm.durationMonths), price: parseFloat(planForm.price) });
            showNotif('Plan saved', 'success');
            setShowPlanForm(false); setPlanForm({ name: '', durationMonths: '', price: '' }); loadData();
        } catch (err) { showNotif('Failed to save plan', 'error'); }
    };

    const handleDeletePlan = async (id: string) => {
        try { await api.deletePlan(id); showNotif('Plan deleted', 'success'); loadData(); }
        catch (err) { showNotif('Failed to delete', 'error'); }
    };

    const handleDownloadInvoice = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/invoices/${id}/html`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to load invoice');
            const html = await res.text();
            const newWindow = window.open('', '_blank');
            if (newWindow) { newWindow.document.write(html); newWindow.document.close(); }
        } catch (err) { console.error('Download error:', err); }
    };

    const addToCart = (product: { id: string, name: string, price: number }) => {
        setCart(prev => {
            const ext = prev.find(item => item.id === product.id);
            if (ext) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateCartQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));
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
            loadData(); setActiveTab('invoices');
        } catch (err) { showNotif('Sale failed', 'error'); }
    };

    const fieldStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start animate-fade-in-up">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payments & Billing</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage payments, plans, and revenue</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--accent)', boxShadow: '0 1px 2px rgba(13,148,136,0.2)' }}>
                    <Plus className="w-4 h-4" /> Record Payment
                </button>
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

            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    <StatsCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} icon={IndianRupee} />
                    <StatsCard title="This Month" value={`₹${summary.thisMonthRevenue.toLocaleString()}`} icon={TrendingUp} />
                    <StatsCard title="Last Month" value={`₹${summary.lastMonthRevenue.toLocaleString()}`} icon={Receipt} />
                    <StatsCard title="Active Plans" value={plans.length} icon={Package} />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {(['payments', 'pos', 'invoices', 'plans'] as TabId[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                        }}>
                        {tab === 'pos' && <ShoppingBag className="w-4 h-4" />}
                        {tab === 'payments' ? `Payments (${payments.length})` :
                            tab === 'invoices' ? `Invoices (${invoices.length})` :
                                tab === 'pos' ? 'POS' : `Plans (${plans.length})`}
                    </button>
                ))}
            </div>

            {/* ── Record Payment Modal ── */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md animate-scale-in rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-light)' }}>
                                <CreditCard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Record Payment</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Add a membership or custom payment</p>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                                style={{ color: 'var(--text-muted)' }}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Member Select */}
                            <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <User size={12} /> Member *
                                </p>
                                <Select required value={form.memberId} onValueChange={v => setForm({ ...form, memberId: v })}>
                                    <SelectTrigger className="w-full text-sm h-auto px-3.5 py-2.5 rounded-lg border"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: form.memberId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        <SelectValue placeholder="Select member..." />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', zIndex: 60 }}>
                                        {members.map(m => (
                                            <SelectItem key={m.id} value={m.id} style={{ color: 'var(--text-primary)' }}>
                                                {m.name} · {m.phone}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Plan Select */}
                            <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <Package size={12} /> Plan
                                </p>
                                <Select value={form.planId || '__custom__'} onValueChange={v => handlePlanSelect(v)}>
                                    <SelectTrigger className="w-full text-sm h-auto px-3.5 py-2.5 rounded-lg border"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                        <SelectValue placeholder="Custom amount (no plan)" />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', zIndex: 60 }}>
                                        <SelectItem value="__custom__" style={{ color: 'var(--text-muted)' }}>Custom amount</SelectItem>
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.id} style={{ color: 'var(--text-primary)' }}>
                                                {p.name} — ₹{p.price} ({p.duration_months} mo)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="relative z-0">
                                <div className="flex items-center border-b-2 transition-colors pb-1"
                                    style={{ borderColor: 'var(--border-color)' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                                >
                                    <span className="text-base font-medium mr-1" style={{ color: 'var(--text-muted)' }}>₹</span>
                                    <input
                                        type="number" required
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        placeholder="0"
                                        className="flex-1 py-2 bg-transparent text-lg font-semibold outline-none"
                                        style={{ color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Amount (₹) *</p>
                            </div>

                            {/* Payment Method Chips */}
                            <div>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Payment Method</p>
                                <div className="flex gap-2 flex-wrap">
                                    {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(method => (
                                        <button
                                            key={method} type="button"
                                            onClick={() => setForm({ ...form, method })}
                                            className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border"
                                            style={{
                                                backgroundColor: form.method === method ? 'var(--accent)' : 'var(--bg-tertiary)',
                                                color: form.method === method ? '#ffffff' : 'var(--text-secondary)',
                                                borderColor: form.method === method ? 'var(--accent)' : 'var(--border-color)',
                                                boxShadow: form.method === method ? '0 2px 8px rgba(13,148,136,0.3)' : 'none',
                                            }}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="relative z-0">
                                <input
                                    type="text" id="pay-notes"
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder=" "
                                    className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer transition-colors"
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                                />
                                <label htmlFor="pay-notes"
                                    className="absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-6 peer-focus:scale-75 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Notes (optional)
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[var(--bg-tertiary)]"
                                    style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #059669)', boxShadow: '0 4px 15px rgba(13,148,136,0.35)' }}>
                                    <CreditCard size={15} />
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
                <div className="rounded-xl border overflow-hidden animate-fade-in-up"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                    {summary?.methods?.length > 0 && (
                        <div className="px-6 pt-5 pb-3">
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Payment Methods</p>
                            <div className="flex rounded-full overflow-hidden h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                {summary.methods.map((m: any, i: number) => {
                                    const colors = ['#0d9488', '#059669', '#d97706', '#dc2626'];
                                    const pct = summary.totalRevenue > 0 ? (m.total / summary.totalRevenue) * 100 : 0;
                                    return <div key={m.method} style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} title={`${m.method}: ₹${m.total}`} />;
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2">
                                {summary.methods.map((m: any, i: number) => {
                                    const colors = ['#0d9488', '#059669', '#d97706', '#dc2626'];
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
                                        <th key={h} className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${h === '' ? 'w-12' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Loading...
                                        </div>
                                    </td></tr>
                                ) : payments.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                                        <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No payments yet</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click "Record Payment" to get started</p>
                                    </td></tr>
                                ) : (
                                    payments.map(p => (
                                        <tr key={p.id} className="group transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="px-6 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(p.paid_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-3.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.member_name || '—'}</td>
                                            <td className="px-6 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.plan_name || 'Custom'}</td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>₹{p.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{p.method}</span>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm" style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                                            <td className="px-6 py-3.5">
                                                <button onClick={() => handleDeletePayment(p.id)}
                                                    className="p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--danger-bg)]"
                                                    style={{ color: 'var(--danger)' }}><Trash2 className="w-3.5 h-3.5" /></button>
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
                <div className="rounded-xl border overflow-hidden animate-fade-in-up"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Invoice #', 'Date', 'Member', 'Plan', 'Total', 'Status', ''].map(h => (
                                        <th key={h} className={`px-6 py-3.5 text-xs font-medium uppercase tracking-wider ${h === '' ? 'w-12' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                                        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No invoices yet</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invoices are generated automatically on payment</p>
                                    </td></tr>
                                ) : invoices.map(inv => (
                                    <tr key={inv.id} className="group transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="px-6 py-3.5 text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</td>
                                        <td className="px-6 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(inv.issued_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-3.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.member_name}</td>
                                        <td className="px-6 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.plan_name}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>₹{inv.total.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>Paid • {inv.method}</span>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <button onClick={() => handleDownloadInvoice(inv.id)}
                                                className="p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-light)]"
                                                style={{ color: 'var(--accent)' }} title="Download/Print Invoice">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PLANS TAB */}
            {activeTab === 'plans' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="flex justify-end">
                        <button onClick={() => setShowPlanForm(true)}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                            style={{ backgroundColor: 'var(--accent)' }}>
                            <Plus className="w-4 h-4" /> Add Plan
                        </button>
                    </div>
                    {showPlanForm && (
                        <div className="rounded-xl border p-5 animate-scale-in"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                            <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>New Plan</h4>
                            <form onSubmit={handleSavePlan} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
                                    <input type="text" required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle} placeholder="e.g. Quarterly" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duration (months)</label>
                                    <input type="number" required value={planForm.durationMonths} onChange={e => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle} placeholder="3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Price (₹)</label>
                                    <input type="number" required value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle} placeholder="1500" />
                                </div>
                                <div className="sm:col-span-3 flex gap-3 justify-end">
                                    <button type="button" onClick={() => setShowPlanForm(false)}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
                                    <button type="submit"
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-1 transition-all"
                                        style={{ backgroundColor: 'var(--accent)' }}><Save className="w-4 h-4" /> Save Plan</button>
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {plans.map(plan => (
                            <div key={plan.id} className="rounded-xl border p-5 group transition-all hover:shadow-md"
                                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-light)' }}>
                                        <Package className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <button onClick={() => handleDeletePlan(plan.id)}
                                        className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 hover:bg-[var(--danger-bg)]"
                                        style={{ color: 'var(--danger)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{plan.name}</h4>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <span className="text-2xl font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>₹{plan.price.toLocaleString()}</span>
                                    <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/ {plan.duration_months}mo</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {plans.length === 0 && !showPlanForm && (
                        <div className="rounded-xl border py-16 text-center"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>No plans yet</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add a membership plan to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* POS TAB */}
            {activeTab === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Quick Add Items
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {posProducts.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)}
                                        className="p-4 rounded-lg text-left border transition-all hover:-translate-y-0.5 hover:shadow-md"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                        <p className="font-medium text-sm leading-tight mb-1">{p.name}</p>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>₹{p.price}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                            <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Add Custom Item</h4>
                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                <input type="text" placeholder="Item Name" value={customItemName} onChange={e => setCustomItemName(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle} />
                                <div className="relative w-full sm:w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>₹</span>
                                    <input type="number" placeholder="0" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle} />
                                </div>
                                <button onClick={addCustomItem}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                                    style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Add</button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border p-5 flex flex-col sticky top-6"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                        <h3 className="font-semibold text-lg mb-4 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                            <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Current Order</span>
                            {cart.length > 0 && (
                                <span className="text-xs font-medium px-2 py-1 rounded-md text-white" style={{ backgroundColor: 'var(--accent)' }}>
                                    {cart.reduce((s, i) => s + i.qty, 0)}
                                </span>
                            )}
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
                                                <button onClick={() => updateCartQty(item.id, -1)}
                                                    className="p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-secondary)' }}>
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-4 text-center" style={{ color: 'var(--text-primary)' }}>{item.qty}</span>
                                                <button onClick={() => updateCartQty(item.id, 1)}
                                                    className="p-1 rounded transition-colors hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-secondary)' }}>
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="pt-4 mt-auto" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                                <span className="text-xl font-bold" style={{ color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Member</label>
                                    <select value={posMemberId} onChange={e => setPosMemberId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle}>
                                        <option value="">Select a member...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Payment Method</label>
                                    <select value={posMethod} onChange={e => setPosMethod(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={fieldStyle}>
                                        {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handlePosCheckout} disabled={cart.length === 0}
                                className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: cart.length === 0 ? 'var(--text-muted)' : 'var(--accent)' }}>
                                Checkout & Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
