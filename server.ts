import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { isPast, isToday } from 'date-fns';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ members: [], settings: {} }, null, 2));
}

const readData = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// WhatsApp Client Setup
let qrCodeDataUrl: string | null = null;
let isWhatsAppReady = false;

const whatsappClient = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
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

whatsappClient.on('disconnected', (reason: any) => {
  console.log('WhatsApp Client was disconnected', reason);
  isWhatsAppReady = false;
});

whatsappClient.initialize().catch((err: any) => {
  console.error('Failed to initialize WhatsApp client:', err);
});

// Automated WhatsApp Job
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily check for expired memberships...');
  const data = readData();

  if (!isWhatsAppReady) {
    console.log('WhatsApp client is not ready. Skipping automated messages.');
    return;
  }
  
  for (const member of data.members) {
    const expiryDate = new Date(member.expiryDate);
    // Check if expired today or recently and hasn't been notified
    if (isPast(expiryDate) && !isToday(expiryDate)) {
      console.log(`Member ${member.name} is expired. Sending WhatsApp notification to ${member.phone}.`);
      try {
        const formattedPhone = member.phone.replace(/\D/g, '') + '@c.us';
        await whatsappClient.sendMessage(formattedPhone, `Hello ${member.name}, your gym membership expired on ${member.expiryDate}. Please renew it to continue enjoying our services.`);
        console.log(`Automated WhatsApp sent to ${member.name}`);
      } catch (error) {
        console.error(`Failed to send automated WhatsApp to ${member.name}:`, error);
      }
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/members', (req, res) => {
    const data = readData();
    res.json(data.members || []);
  });

  app.post('/api/members', (req, res) => {
    const data = readData();
    const newMember = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    data.members = data.members || [];
    data.members.push(newMember);
    writeData(data);
    res.status(201).json(newMember);
  });

  app.put('/api/members/:id', (req, res) => {
    const data = readData();
    const index = data.members.findIndex((m: any) => m.id === req.params.id);
    if (index !== -1) {
      data.members[index] = { ...data.members[index], ...req.body };
      writeData(data);
      res.json(data.members[index]);
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  app.delete('/api/members/:id', (req, res) => {
    const data = readData();
    data.members = data.members.filter((m: any) => m.id !== req.params.id);
    writeData(data);
    res.status(204).send();
  });

  // WhatsApp Integration
  app.get('/api/whatsapp/status', (req, res) => {
    res.json({
      ready: isWhatsAppReady,
      qrCode: qrCodeDataUrl
    });
  });

  app.post('/api/send-whatsapp', async (req, res) => {
    const { to, message } = req.body;

    if (!isWhatsAppReady) {
      return res.status(500).json({ error: 'WhatsApp client is not ready. Please scan the QR code.' });
    }

    try {
      const formattedPhone = to.replace(/\D/g, '') + '@c.us';
      await whatsappClient.sendMessage(formattedPhone, message);
      res.json({ success: true });
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      res.status(500).json({ error: error.message || 'Failed to send WhatsApp message' });
    }
  });

  // Simple auth endpoint (hardcoded for offline desktop app)
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // For a local offline app, we can just use a simple hardcoded check or store in data.json
    // Let's use a simple check for now, or allow any login if it's just a local tool
    if (username === 'admin' && password === 'admin') {
      res.json({ token: 'fake-jwt-token-for-local-app', user: { username: 'admin' } });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Use admin/admin' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
