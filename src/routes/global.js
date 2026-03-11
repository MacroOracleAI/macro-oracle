const express = require('express');
const router = express.Router();
const { getCalendarioGlobal, getProximoFomc, FOMC_2026, ECB_2026, BOJ_2026 } = require('../collectors/global');
const { getCache } = require('../cache/db');

// GET /global/calendar
router.get('/calendar', (req, res) => {
  try {
    const eventos = getCalendarioGlobal();
    const proximos30 = eventos.slice(0, 10);
    res.json({
      indicator: 'Global Macro Calendar',
      source: 'Fed + ECB + BoJ (hardcoded 2026)',
      updated_at: new Date().toISOString(),
      proximos_eventos: proximos30,
      total_proximos: proximos30.length,
      signal_for_agents: proximos30[0]
        ? `Proximo evento: ${proximos30[0].banco} em ${proximos30[0].data} | ${proximos30[0].descricao}`
        : 'Nenhum evento global nos proximos 30 dias',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /global/fomc
router.get('/fomc', (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const proximo = getProximoFomc();
    const passados = FOMC_2026.filter(e => e.data_fim < hoje);
    const proximos = FOMC_2026.filter(e => e.data_fim >= hoje);
    res.json({
      indicator: 'FOMC Calendar',
      source: 'Federal Reserve (hardcoded 2026)',
      updated_at: new Date().toISOString(),
      proximo_fomc: proximo,
      proximas_reunioes: proximos,
      reunioes_passadas: passados,
      fed_funds_rate_atual: '4.25-4.50%',
      signal_for_agents: `Proximo FOMC: ${proximo.reuniao} em ${proximo.data_fim} | ${proximo.descricao}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /global/surprise-matrix
router.get('/surprise-matrix', (req, res) => {
  try {
    let brSurprise = getCache('surprise:br');
    const matrix = {
      US: { status: 'pending', note: 'NFP/CPI data integration coming soon' },
      EU: { status: 'pending', note: 'ECB data integration coming soon' },
      BR: brSurprise
        ? {
            status: 'live',
            z_score: brSurprise.z_score,
            polymarket_relevance: brSurprise.polymarket_relevance,
            surpresa: brSurprise.surpresa,
          }
        : { status: 'pending', note: 'Call /brazil/surprise-index first' },
      JP: { status: 'pending', note: 'BoJ data integration coming soon' },
    };
    res.json({
      indicator: 'Global Surprise Matrix',
      source: 'BCB + Hardcoded calendars',
      updated_at: new Date().toISOString(),
      matrix,
      signal_for_agents: brSurprise
        ? `BR surprise z-score: ${brSurprise.z_score} | US/EU/JP: pending`
        : 'BR surprise pending — call /brazil/surprise-index to populate',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
