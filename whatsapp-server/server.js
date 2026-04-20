const express = require('express');
// 1. Unificamos os imports aqui no topo
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── PERSISTÊNCIA NO SUPABASE ────────────────────────────────
// Isso evita que sua mãe tenha que ler o QR Code todo dia!
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

// 2. Inicializamos o cliente apenas UMA vez usando a estratégia RemoteAuth
const client = new Client({
    authStrategy: new RemoteAuth({
        store: new SupabaseStore(),
        backupSyncIntervalMs: 300000 // Salva o backup a cada 5 min
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ]
        // Dica: Removi o executablePath para o Docker usar o Chrome interno dele
    }
});

// ── EVENTOS DO WHATSAPP ──────────────────────────────────────

client.on('loading_screen', (percent, message) => {
  console.log(`📡 Carregando WhatsApp: ${percent}% - ${message}`);
});

client.on('qr', async (qr) => {
  qrCodeData = await QRCode.toDataURL(qr);
  isReady = false;
  console.log('✅ QR code gerado! Acesse a rota /qr para escanear.');
});

client.on('ready', () => {
  isReady = true;
  qrCodeData = null;
  console.log('🚀 WhatsApp conectado e pronto!');
});

client.on('remote_session_saved', () => {
  console.log('💾 Sessão salva com sucesso no Supabase Storage!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', () => {
  isReady = false;
  console.log('⚠️ WhatsApp desconectado');
});

// Inicializa o serviço
client.initialize().catch(err => {
  console.error('❌ ERRO CRÍTICO NO INITIALIZE:', err);
});

// ── FUNÇÕES AUXILIARES ───────────────────────────────────────

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

// ── ROTAS API ────────────────────────────────────────────────

app.get('/status', (req, res) => {
  res.json({ connected: isReady, hasQr: !!qrCodeData });
});

app.get('/qr', (req, res) => {
  if (isReady) return res.send('<h1>WhatsApp já está conectado!</h1>');
  if (!qrCodeData) return res.send('<h1>Aguardando geração do QR Code... Atualize em instantes.</h1>');
  
  // Retorna uma página simples para ver o QR Code
  res.send(`<img src="${qrCodeData}" style="display:block;margin:auto;">`);
});

app.post('/send', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message é obrigatório' });
  if (!isReady) return res.status(503).json({ error: 'WhatsApp não conectado' });

  const numbers = await getAdminNumbers();
  if (numbers.length === 0) return res.status(404).json({ error: 'Nenhum número admin cadastrado no Supabase' });

  console.log(`Enviando para ${numbers.length} número(s)`);
  const results = await Promise.allSettled(
    numbers.map((n) => client.sendMessage(formatNumber(n), message))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  res.json({ sent, total: numbers.length });
});

// ── START ────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});