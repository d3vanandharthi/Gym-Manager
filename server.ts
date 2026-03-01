import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cron from 'node-cron';
import { isPast, isToday } from 'date-fns';

// Database (initializes tables + migration on import)
import db from './server/db.js';

// Routes
import authRoutes from './server/routes/auth.routes.js';
import memberRoutes from './server/routes/member.routes.js';
import paymentRoutes from './server/routes/payment.routes.js';
import whatsappRoutes, { whatsappClient, isWhatsAppReady } from './server/routes/whatsapp.routes.js';
import dashboardRoutes from './server/routes/dashboard.routes.js';
import classRoutes from './server/routes/class.routes.js';
import bookingRoutes from './server/routes/booking.routes.js';
import checkinRoutes from './server/routes/checkin.routes.js';
import invoiceRoutes from './server/routes/invoice.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Daily cron: send expiry reminders at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily check for expired memberships...');

  if (!isWhatsAppReady) {
    console.log('WhatsApp client is not ready. Skipping automated messages.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const expiredMembers = db.prepare(
    'SELECT * FROM members WHERE expiry_date < ?'
  ).all(today) as any[];

  const template = db.prepare(
    "SELECT content FROM message_templates WHERE id = 'tpl-expiry'"
  ).get() as any;

  for (const member of expiredMembers) {
    try {
      const message = template
        ? template.content.replace(/{name}/g, member.name).replace(/{expiry_date}/g, member.expiry_date)
        : `Hello ${member.name}, your gym membership expired on ${member.expiry_date}. Please renew it.`;

      const formattedPhone = member.phone.replace(/\D/g, '') + '@c.us';
      await whatsappClient.sendMessage(formattedPhone, message);
      console.log(`Automated WhatsApp sent to ${member.name}`);
    } catch (error) {
      console.error(`Failed to send to ${member.name}:`, error);
    }
  }
});

// Daily cron: send birthday wishes at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily birthday check...');

  if (!isWhatsAppReady) {
    console.log('WhatsApp client is not ready. Skipping birthday messages.');
    return;
  }

  const today = new Date();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');

  // Find members whose DOB month and day match today
  const birthdayMembers = db.prepare(
    "SELECT * FROM members WHERE strftime('%m', dob) = ? AND strftime('%d', dob) = ? AND dob IS NOT NULL AND dob != ''"
  ).all(todayMonth, todayDay) as any[];

  const template = db.prepare(
    "SELECT content FROM message_templates WHERE id = 'tpl-birthday'"
  ).get() as any;

  for (const member of birthdayMembers) {
    try {
      const message = template
        ? template.content.replace(/{name}/g, member.name).replace(/{expiry_date}/g, member.expiry_date).replace(/{phone}/g, member.phone)
        : `Happy Birthday ${member.name}! 🎂🎉 Wishing you a fantastic day from your gym family!`;

      const formattedPhone = member.phone.replace(/\D/g, '') + '@c.us';
      await whatsappClient.sendMessage(formattedPhone, message);

      // Log the birthday message
      const { v4: uuidv4 } = await import('uuid');
      db.prepare(
        'INSERT INTO message_log (id, member_id, phone, message, status) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), member.id, member.phone, message, 'sent');

      db.prepare(
        'INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)'
      ).run('whatsapp_sent', `Birthday wish sent to ${member.name} 🎂`, member.id);

      console.log(`Birthday wish sent to ${member.name}`);
    } catch (error) {
      console.error(`Failed to send birthday wish to ${member.name}:`, error);
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mount API routes
  app.use('/api', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/checkin', checkinRoutes);
  app.use('/api/invoices', invoiceRoutes);

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
