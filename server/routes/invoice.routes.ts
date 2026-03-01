import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Helper: get next invoice number
function getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const nextNum = db.prepare("SELECT value FROM invoice_settings WHERE key = 'next_invoice_number'").get() as any;
    const num = nextNum ? parseInt(nextNum.value) : 1;
    const invoiceNumber = `INV-${year}-${String(num).padStart(4, '0')}`;
    db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'next_invoice_number'").run(String(num + 1));
    return invoiceNumber;
}

// Helper: get invoice settings
function getSettings(): Record<string, string> {
    const rows = db.prepare('SELECT key, value FROM invoice_settings').all() as any[];
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => settings[r.key] = r.value);
    return settings;
}

// Helper: create an invoice for a payment
export function createInvoiceForPayment(paymentId: string): any {
    const payment = db.prepare(`
    SELECT p.*, m.name as member_name, m.phone as member_phone, m.email as member_email,
      pl.name as plan_name
    FROM payments p
    JOIN members m ON p.member_id = m.id
    LEFT JOIN plans pl ON p.plan_id = pl.id
    WHERE p.id = ?
  `).get(paymentId) as any;

    if (!payment) return null;

    const settings = getSettings();
    const gstEnabled = settings.gst_enabled === 'true';
    const gstRate = parseFloat(settings.gst_rate || '18');

    let subtotal: number, gstAmount: number, total: number;
    if (gstEnabled) {
        // Amount is inclusive of GST; back-calculate
        total = payment.amount;
        subtotal = Math.round((total / (1 + gstRate / 100)) * 100) / 100;
        gstAmount = Math.round((total - subtotal) * 100) / 100;
    } else {
        subtotal = payment.amount;
        gstAmount = 0;
        total = payment.amount;
    }

    const id = uuidv4();
    const invoiceNumber = getNextInvoiceNumber();

    db.prepare(`
    INSERT INTO invoices (id, invoice_number, payment_id, member_id, member_name, member_phone, member_email, plan_name, subtotal, gst_rate, gst_amount, total, method, notes, gym_name, gym_address, gym_gstin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id, invoiceNumber, paymentId, payment.member_id,
        payment.member_name, payment.member_phone || '', payment.member_email || '',
        payment.plan_name || 'Custom', subtotal, gstEnabled ? gstRate : 0, gstAmount, total,
        payment.method, payment.notes || '',
        settings.gym_name || 'Gym Manager', settings.gym_address || '', settings.gym_gstin || ''
    );

    return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
}

// GET /api/invoices — list invoices with optional month filter
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
    const { month, memberId, limit } = req.query;

    let sql = 'SELECT * FROM invoices WHERE 1=1';
    const params: any[] = [];

    if (month) { sql += " AND strftime('%Y-%m', issued_at) = ?"; params.push(month); }
    if (memberId) { sql += ' AND member_id = ?'; params.push(memberId); }

    sql += ' ORDER BY issued_at DESC';
    if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }

    const invoices = db.prepare(sql).all(...params);
    res.json(invoices);
});

// GET /api/invoices/:id — single invoice
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
});

// GET /api/invoices/:id/html — invoice as printable HTML (for PDF)
router.get('/:id/html', requireAuth, (req: AuthRequest, res: Response) => {
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${inv.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
    .brand h1 { font-size: 28px; color: #6366f1; font-weight: 800; }
    .brand p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 14px; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-meta .number { font-size: 22px; font-weight: 700; color: #1e293b; }
    .invoice-meta .date { font-size: 13px; color: #64748b; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; margin-bottom: 8px; }
    .party p { font-size: 14px; color: #475569; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .totals { display: flex; justify-content: flex-end; }
    .totals table { max-width: 300px; }
    .totals td { padding: 8px 16px; font-size: 14px; }
    .totals tr:last-child td { font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #6366f1; padding-top: 12px; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${inv.gym_name}</h1>
      ${inv.gym_address ? `<p>${inv.gym_address}</p>` : ''}
      ${inv.gym_gstin ? `<p>GSTIN: ${inv.gym_gstin}</p>` : ''}
    </div>
    <div class="invoice-meta">
      <h2>Invoice</h2>
      <div class="number">${inv.invoice_number}</div>
      <div class="date">Date: ${new Date(inv.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h3>Bill To</h3>
      <p><strong>${inv.member_name}</strong></p>
      ${inv.member_phone ? `<p>${inv.member_phone}</p>` : ''}
      ${inv.member_email ? `<p>${inv.member_email}</p>` : ''}
    </div>
    <div class="party">
      <h3>Payment Details</h3>
      <p>Method: <strong>${inv.method}</strong></p>
      <p>Status: <strong style="color: #10b981;">Paid</strong></p>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>${inv.plan_name || 'Gym Membership'} ${inv.notes ? `<br><small style="color:#94a3b8">${inv.notes}</small>` : ''}</td><td>₹${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
    </tbody>
  </table>
  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td>₹${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      ${inv.gst_rate > 0 ? `<tr><td>GST (${inv.gst_rate}%)</td><td>₹${inv.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
      <tr><td>Total</td><td>₹${inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>
  <div class="footer">
    <p>Thank you for your business! This is a computer-generated invoice.</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;">Print / Save as PDF</button>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// GET /api/invoices/settings — invoice settings
router.get('/settings/all', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const rows = db.prepare('SELECT key, value FROM invoice_settings').all() as any[];
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => settings[r.key] = r.value);
    res.json(settings);
});

// PUT /api/invoices/settings — update settings
router.put('/settings', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const { gymName, gymAddress, gymGstin, gstEnabled, gstRate } = req.body;

    if (gymName !== undefined) db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'gym_name'").run(gymName);
    if (gymAddress !== undefined) db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'gym_address'").run(gymAddress);
    if (gymGstin !== undefined) db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'gym_gstin'").run(gymGstin);
    if (gstEnabled !== undefined) db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'gst_enabled'").run(String(gstEnabled));
    if (gstRate !== undefined) db.prepare("UPDATE invoice_settings SET value = ? WHERE key = 'gst_rate'").run(String(gstRate));

    res.json({ message: 'Settings updated' });
});

export default router;
