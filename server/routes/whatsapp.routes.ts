import { Router, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// WhatsApp Client Setup
let qrCodeDataUrl: string | null = null;
let isWhatsAppReady = false;

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(ROOT_DIR, '.wwebjs_auth') }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800',
        ],
        userDataDir: undefined,
    },
});

whatsappClient.on('qr', async (qr: string) => {
    console.log('QR RECEIVED. Scan it to log in.');
    qrCodeDataUrl = await qrcode.toDataURL(qr);
    isWhatsAppReady = false;
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isWhatsAppReady = true;
    qrCodeDataUrl = null;
});

whatsappClient.on('authenticated', () => {
    console.log('WhatsApp Client is authenticated!');
});

whatsappClient.on('auth_failure', (msg: any) => {
    console.error('WhatsApp auth failed:', msg);
    isWhatsAppReady = false;
    qrCodeDataUrl = null;
});

whatsappClient.on('disconnected', (reason: any) => {
    console.log('WhatsApp Client was disconnected', reason);
    isWhatsAppReady = false;
});

whatsappClient.initialize().catch((err: any) => {
    console.error('Failed to initialize WhatsApp client:', err);
});

export { whatsappClient, isWhatsAppReady };

const router = Router();

// GET WhatsApp connection status
router.get('/status', (req: Request, res: Response) => {
    res.json({
        ready: isWhatsAppReady,
        qrCode: qrCodeDataUrl
    });
});

// POST reinitialize WhatsApp client (logout + fresh QR)
router.post('/reinitialize', async (req: Request, res: Response) => {
    try {
        isWhatsAppReady = false;
        qrCodeDataUrl = null;
        await whatsappClient.destroy();
        await whatsappClient.initialize();
        res.json({ success: true, message: 'WhatsApp client reinitialized' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST send single WhatsApp message
router.post('/send', async (req: Request, res: Response) => {
    const { to, message, memberId, templateId } = req.body;

    if (!isWhatsAppReady) {
        return res.status(500).json({ error: 'WhatsApp client is not ready. Please scan the QR code.' });
    }

    try {
        const formattedPhone = to.replace(/\D/g, '') + '@c.us';
        await whatsappClient.sendMessage(formattedPhone, message);

        // Log the message
        db.prepare(
            'INSERT INTO message_log (id, member_id, phone, template_id, message, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(uuidv4(), memberId || null, to, templateId || null, message, 'sent');

        // Log activity
        db.prepare(
            'INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)'
        ).run('whatsapp_sent', `WhatsApp message sent to ${to}`, memberId || null);

        res.json({ success: true });
    } catch (error: any) {
        // Log failed message
        db.prepare(
            'INSERT INTO message_log (id, member_id, phone, template_id, message, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(uuidv4(), memberId || null, to, templateId || null, message, 'failed');

        console.error('WhatsApp error:', error);
        res.status(500).json({ error: error.message || 'Failed to send WhatsApp message' });
    }
});

// POST send bulk WhatsApp messages
router.post('/send-bulk', async (req: Request, res: Response) => {
    const { memberIds, templateId } = req.body;

    if (!isWhatsAppReady) {
        return res.status(500).json({ error: 'WhatsApp client is not ready.' });
    }

    const template = db.prepare('SELECT * FROM message_templates WHERE id = ?').get(templateId) as any;
    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    const results: { memberId: string; status: string; error?: string }[] = [];

    for (const memberId of memberIds) {
        const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as any;
        if (!member) continue;

        const message = template.content
            .replace(/{name}/g, member.name)
            .replace(/{expiry_date}/g, member.expiry_date)
            .replace(/{phone}/g, member.phone);

        try {
            const formattedPhone = member.phone.replace(/\D/g, '') + '@c.us';
            await whatsappClient.sendMessage(formattedPhone, message);

            db.prepare(
                'INSERT INTO message_log (id, member_id, phone, template_id, message, status) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(uuidv4(), memberId, member.phone, templateId, message, 'sent');

            results.push({ memberId, status: 'sent' });
        } catch (error: any) {
            db.prepare(
                'INSERT INTO message_log (id, member_id, phone, template_id, message, status) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(uuidv4(), memberId, member.phone, templateId, message, 'failed');

            results.push({ memberId, status: 'failed', error: error.message });
        }

        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json({ results });
});

// GET message templates
router.get('/templates', (req: Request, res: Response) => {
    const templates = db.prepare('SELECT * FROM message_templates ORDER BY created_at DESC').all();
    res.json(templates);
});

// POST create/update template
router.post('/templates', (req: Request, res: Response) => {
    const { id, name, content } = req.body;
    const templateId = id || uuidv4();

    db.prepare(
        'INSERT OR REPLACE INTO message_templates (id, name, content) VALUES (?, ?, ?)'
    ).run(templateId, name, content);

    res.json({ id: templateId, name, content });
});

// DELETE template
router.delete('/templates/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM message_templates WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

// GET message log
router.get('/log', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = db.prepare(`
    SELECT ml.*, m.name as member_name
    FROM message_log ml
    LEFT JOIN members m ON ml.member_id = m.id
    ORDER BY ml.sent_at DESC
    LIMIT ?
  `).all(limit);
    res.json(logs);
});

export default router;
