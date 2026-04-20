const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Persiste sessão no Supabase Storage — QR só necessário uma vez
class SupabaseStore {
  async sessionExists({ session }) {
    const { data } = await supabase.storage
      .from('whatsapp-sessions')
      .list('', { search: `${session}.zip` });
    return !!(data && data.length > 0);
  }

  async save({ session, data }) {
    await supabase.storage
      .from('whatsapp-sessions')
      .upload(`${session}.zip`, data, { upsert: true });
  }

  async extract({ session }) {
    const { data, error } = await supabase.storage
      .from('whatsapp-sessions')
      .download(`${session}.zip`);
    if (error) return null;
    return Buffer.from(await data.arrayBuffer());
  }

  async delete({ session }) {
    await supabase.storage
      .from('whatsapp-sessions')
      .remove([`${session}.zip`]);
  }
}

let qrCodeData = null;
let isReady = false;

const client = new Client({
  authStrategy: new RemoteAuth({
    clientId: 'checklist',
    store: new SupabaseStore(),
    backupSyncIntervalMs: 300000,
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.NODE_ENV === 'production' 
      ? '/usr/bin/google-chrome-stable' 
      : undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-features=TranslateUI',
      '--disable-setuid-sandbox',
    ],
  },
});
client.on('loading_screen', (percent, message) => {
  console.log(`📡 Carregando WhatsApp: ${percent}% - ${message}`);
});

client.on('auth_failure', (msg) => {
  console.error('❌ AUTH FAILURE:', msg);
});

client.initialize().catch(err => {
  console.error('❌ ERRO CRÍTICO NO INITIALIZE:', err);
});
client.on('qr', async (qr) => {
  qrCodeData = await QRCode.toDataURL(qr);
  isReady = false;
  console.log('QR code gerado');
});

client.on('ready', () => {
  isReady = true;
  qrCodeData = null;
  console.log('WhatsApp conectado!');
});

client.on('remote_session_saved', () => {
  console.log('Sessão salva no Supabase Storage');
});

client.on('disconnected', () => {
  isReady = false;
  console.log('WhatsApp desconectado');
});

async function getAdminNumbers() {
  const { data, error } = await supabase
    .from('admin_whatsapp')
    .select('numero')
    .eq('ativo', true);
  if (error || !data) return [];
  return data.map((row) => row.numero);
}

function formatNumber(numero) {
  const digits = numero.replace(/\D/g, '');
  return digits.endsWith('@c.us') ? digits : `${digits}@c.us`;
}

// ── Rotas ────────────────────────────────────────────────────

app.get('/status', (req, res) => {
  res.json({ connected: isReady, hasQr: !!qrCodeData });
});

app.get('/qr', (req, res) => {
  if (isReady) return res.json({ connected: true, qr: null });
  if (!qrCodeData) return res.json({ connected: false, qr: null, message: 'Aguardando QR...' });
  res.json({ connected: false, qr: qrCodeData });
});

app.post('/send', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message é obrigatório' });
  if (!isReady) return res.status(503).json({ error: 'WhatsApp não conectado' });

  const numbers = await getAdminNumbers();
  if (numbers.length === 0) return res.status(404).json({ error: 'Nenhum número admin cadastrado' });

  console.log(`Enviando para ${numbers.length} número(s)`);
  const results = await Promise.allSettled(
    numbers.map((n) => client.sendMessage(formatNumber(n), message))
  );

  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`Falha ${numbers[i]}:`, r.reason?.message);
  });

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`Enviado: ${sent}/${numbers.length}`);
  res.json({ sent, total: numbers.length });
});

// ── Start ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`WhatsApp service rodando na porta ${PORT}`);
  client.initialize().catch((err) => console.error('Erro ao inicializar:', err));
});
