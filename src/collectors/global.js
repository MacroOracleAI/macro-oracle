const FOMC_2026 = [
  { reuniao: 'FOMC1/2026', data_inicio: '2026-01-27', data_fim: '2026-01-28', descricao: 'FOMC Meeting' },
  { reuniao: 'FOMC2/2026', data_inicio: '2026-03-17', data_fim: '2026-03-18', descricao: 'FOMC Meeting + SEP' },
  { reuniao: 'FOMC3/2026', data_inicio: '2026-05-05', data_fim: '2026-05-07', descricao: 'FOMC Meeting' },
  { reuniao: 'FOMC4/2026', data_inicio: '2026-06-16', data_fim: '2026-06-17', descricao: 'FOMC Meeting + SEP' },
  { reuniao: 'FOMC5/2026', data_inicio: '2026-07-28', data_fim: '2026-07-29', descricao: 'FOMC Meeting' },
  { reuniao: 'FOMC6/2026', data_inicio: '2026-09-15', data_fim: '2026-09-16', descricao: 'FOMC Meeting + SEP' },
  { reuniao: 'FOMC7/2026', data_inicio: '2026-11-03', data_fim: '2026-11-04', descricao: 'FOMC Meeting' },
  { reuniao: 'FOMC8/2026', data_inicio: '2026-12-15', data_fim: '2026-12-16', descricao: 'FOMC Meeting + SEP' },
];

const ECB_2026 = [
  { reuniao: 'ECB1/2026', data: '2026-01-30', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB2/2026', data: '2026-03-05', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB3/2026', data: '2026-04-16', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB4/2026', data: '2026-06-04', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB5/2026', data: '2026-07-23', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB6/2026', data: '2026-09-10', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB7/2026', data: '2026-10-29', descricao: 'ECB Monetary Policy Decision' },
  { reuniao: 'ECB8/2026', data: '2026-12-17', descricao: 'ECB Monetary Policy Decision' },
];

const BOJ_2026 = [
  { reuniao: 'BoJ1/2026', data: '2026-01-24', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ2/2026', data: '2026-03-19', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ3/2026', data: '2026-05-01', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ4/2026', data: '2026-06-17', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ5/2026', data: '2026-07-31', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ6/2026', data: '2026-09-23', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ7/2026', data: '2026-10-29', descricao: 'BoJ Monetary Policy Meeting' },
  { reuniao: 'BoJ8/2026', data: '2026-12-19', descricao: 'BoJ Monetary Policy Meeting' },
];

function getCalendarioGlobal() {
  const hoje = new Date().toISOString().split('T')[0];
  const eventos = [
    ...FOMC_2026.map(e => ({ ...e, banco: 'Fed', pais: 'US', data: e.data_fim })),
    ...ECB_2026.map(e => ({ ...e, banco: 'ECB', pais: 'EU' })),
    ...BOJ_2026.map(e => ({ ...e, banco: 'BoJ', pais: 'JP' })),
  ]
    .filter(e => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
  return eventos;
}

function getProximoFomc() {
  const hoje = new Date().toISOString().split('T')[0];
  return FOMC_2026.find(e => e.data_fim >= hoje) || FOMC_2026[FOMC_2026.length - 1];
}

module.exports = { FOMC_2026, ECB_2026, BOJ_2026, getCalendarioGlobal, getProximoFomc };
