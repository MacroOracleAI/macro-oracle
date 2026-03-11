require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');
const {
  fetchSelicExpectativas,
  fetchIpcaHistorico,
  fetchIpcaExpectativas,
  fetchFocusSnapshot,
} = require('./collectors/bcb');
const brazilRoutes = require('./routes/brazil');
const globalRoutes = require('./routes/global');

const app = express();
const PORT = process.env.PORT || 3000;
const WALLET = process.env.WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    service: 'Macro Oracle',
    version: '1.0.0',
    status: 'online',
    pricing: {
      'GET /brazil/selic': '$0.02',
      'GET /brazil/ipca': '$0.02',
      'GET /brazil/copom-calendar': '$0.03',
      'GET /brazil/focus-snapshot': '$0.05',
      'GET /brazil/surprise-index': '$0.05',
      'GET /global/calendar': '$0.03',
      'GET /global/fomc': '$0.04',
      'GET /global/surprise-matrix': '$0.06',
    },
    network: 'base-mainnet',
    payment: 'x402 USDC',
    wallet: WALLET,
  });
});

const PRICES = {
  '/brazil/selic':          '0.02',
  '/brazil/ipca':           '0.02',
  '/brazil/copom-calendar': '0.03',
  '/brazil/focus-snapshot': '0.05',
  '/brazil/surprise-index': '0.05',
  '/global/calendar':       '0.03',
  '/global/fomc':           '0.04',
  '/global/surprise-matrix':'0.06',
};

function x402Middleware(req, res, next) {
  const price = PRICES[req.path];
  if (!price) return next();
  const paymentHeader = req.headers['x-payment'];
  if (!paymentHeader) {
    return res.status(402).json({
      error: 'Payment Required',
      x402Version: 1,
      accepts: [{
        scheme: 'exact',
        network: 'eip155:8453',
        maxAmountRequired: (parseFloat(price) * 1e6).toString(),
        resource: `${req.protocol}://${req.get('host')}${req.path}`,
        description: `Macro Oracle: ${req.path}`,
        mimeType: 'application/json',
        payTo: WALLET,
        maxTimeoutSeconds: 300,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        extra: { name: 'USDC', version: '2' },
      }],
    });
  }
  next();
}

app.get('/.well-known/agent-marketplace.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../.well-known/agent-marketplace.json'));
});
app.use(x402Middleware);
app.use('/brazil', brazilRoutes);
app.use('/global', globalRoutes);

cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Atualizando cache BCB Focus...');
  try {
    await fetchSelicExpectativas();
    await fetchIpcaExpectativas();
    await fetchFocusSnapshot();
    console.log('[CRON] Cache Focus atualizado');
  } catch (err) {
    console.error('[CRON] Erro:', err.message);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    await fetchIpcaHistorico();
    console.log('[CRON] IPCA historico atualizado');
  } catch (err) {
    console.error('[CRON] Erro:', err.message);
  }
});

async function init() {
  console.log('[INIT] Aquecendo cache...');
  try {
    await fetchSelicExpectativas();
    await fetchIpcaHistorico();
    await fetchIpcaExpectativas();
    await fetchFocusSnapshot();
    console.log('[INIT] Cache pronto');
  } catch (err) {
    console.error('[INIT] Erro:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`[SERVER] Macro Oracle rodando na porta ${PORT}`);
  await init();
});

module.exports = app;
