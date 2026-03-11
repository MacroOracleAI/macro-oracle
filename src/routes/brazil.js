const express = require('express');
const router = express.Router();
const { getCache } = require('../cache/db');
const {
  fetchSelicExpectativas,
  fetchIpcaHistorico,
  fetchIpcaExpectativas,
  fetchFocusSnapshot,
  getProximoCopom,
  COPOM_2026,
} = require('../collectors/bcb');

// GET /brazil/selic
router.get('/selic', async (req, res) => {
  try {
    let data = getCache('selic:expectativas');
    if (!data) data = await fetchSelicExpectativas();
    const proximo = getProximoCopom();
    res.json({
      indicator: 'SELIC',
      source: 'BCB Focus',
      updated_at: new Date().toISOString(),
      proximo_copom: proximo,
      expectativas: data.slice(0, 5),
      signal_for_agents: `Mediana SELIC esperada para ${data[0]?.Reuniao}: ${data[0]?.Mediana}%`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /brazil/ipca
router.get('/ipca', async (req, res) => {
  try {
    let historico = getCache('ipca:historico');
    if (!historico) historico = await fetchIpcaHistorico();
    let expectativas = getCache('ipca:expectativas');
    if (!expectativas) expectativas = await fetchIpcaExpectativas();
    const ultimo = historico[historico.length - 1];
    res.json({
      indicator: 'IPCA',
      source: 'BCB SGS + Focus',
      updated_at: new Date().toISOString(),
      ultimo_realizado: { data: ultimo.data, valor: parseFloat(ultimo.valor) },
      historico_12m: historico.map(h => ({ data: h.data, valor: parseFloat(h.valor) })),
      expectativas_anuais: expectativas.slice(0, 3),
      signal_for_agents: `IPCA realizado ${ultimo.data}: ${ultimo.valor}%. Expectativa Focus ano: ${expectativas[0]?.Mediana}%`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /brazil/copom-calendar
router.get('/copom-calendar', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const proximas = COPOM_2026.filter(r => r.data_fim >= hoje);
    const passadas = COPOM_2026.filter(r => r.data_fim < hoje);
    res.json({
      indicator: 'COPOM Calendar',
      source: 'BCB (hardcoded 2026)',
      updated_at: new Date().toISOString(),
      proximo: proximas[0] || null,
      proximas_reunioes: proximas,
      reunioes_passadas: passadas,
      signal_for_agents: proximas[0]
        ? `Proxima reuniao COPOM: ${proximas[0].reuniao} em ${proximas[0].data_fim}`
        : 'Nenhuma reuniao COPOM restante em 2026',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /brazil/focus-snapshot
router.get('/focus-snapshot', async (req, res) => {
  try {
    let data = getCache('focus:snapshot');
    if (!data) data = await fetchFocusSnapshot();
    res.json({
      indicator: 'Focus Snapshot',
      source: 'BCB Focus',
      updated_at: new Date().toISOString(),
      snapshot: data,
      signal_for_agents: `Focus ${new Date().getFullYear()}: IPCA=${data['IPCA']?.Mediana}% | SELIC=${data['Selic']?.Mediana}% | PIB=${data['PIB Total']?.Mediana}% | USD/BRL=${data['Taxa de cambio']?.Mediana}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /brazil/surprise-index
router.get('/surprise-index', async (req, res) => {
  try {
    let historico = getCache('ipca:historico');
    if (!historico) historico = await fetchIpcaHistorico();
    let expectativas = getCache('ipca:expectativas');
    if (!expectativas) expectativas = await fetchIpcaExpectativas();
    const valores = historico.map(h => parseFloat(h.valor));
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvioPadrao = Math.sqrt(valores.map(v => Math.pow(v - media, 2)).reduce((a, b) => a + b, 0) / valores.length);
    const ultimo = parseFloat(historico[historico.length - 1].valor);
    const consenso = expectativas[0]?.Mediana ? parseFloat(expectativas[0].Mediana) / 12 : media;
    const surpresa = ultimo - consenso;
    const zScore = desvioPadrao > 0 ? surpresa / desvioPadrao : 0;
    res.json({
      indicator: 'Surprise Index BR',
      source: 'BCB SGS + Focus',
      updated_at: new Date().toISOString(),
      ultimo_ipca: ultimo,
      consenso_estimado: parseFloat(consenso.toFixed(4)),
      surpresa: parseFloat(surpresa.toFixed(4)),
      z_score: parseFloat(zScore.toFixed(4)),
      polymarket_relevance: Math.abs(zScore) > 1.5 ? 'HIGH' : Math.abs(zScore) > 0.5 ? 'MEDIUM' : 'LOW',
      signal_for_agents: `Surpresa IPCA: ${surpresa > 0 ? '+' : ''}${surpresa.toFixed(4)}pp | z-score: ${zScore.toFixed(2)} | Relevancia Polymarket: ${Math.abs(zScore) > 1.5 ? 'HIGH' : 'LOW'}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
