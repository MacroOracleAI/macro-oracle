const axios = require('axios');
const { setCache } = require('../cache/db');

const BCB_SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';
const BCB_FOCUS = 'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata';

const COPOM_2026 = [
  { reuniao: 'R1/2026', data_inicio: '2026-01-28', data_fim: '2026-01-29' },
  { reuniao: 'R2/2026', data_inicio: '2026-03-18', data_fim: '2026-03-19' },
  { reuniao: 'R3/2026', data_inicio: '2026-05-06', data_fim: '2026-05-07' },
  { reuniao: 'R4/2026', data_inicio: '2026-06-17', data_fim: '2026-06-18' },
  { reuniao: 'R5/2026', data_inicio: '2026-07-29', data_fim: '2026-07-30' },
  { reuniao: 'R6/2026', data_inicio: '2026-09-16', data_fim: '2026-09-17' },
  { reuniao: 'R7/2026', data_inicio: '2026-10-28', data_fim: '2026-10-29' },
  { reuniao: 'R8/2026', data_inicio: '2026-12-09', data_fim: '2026-12-10' },
];

async function fetchSelicExpectativas() {
  const url = `${BCB_FOCUS}/ExpectativasMercadoSelic?$top=10&$orderby=Data%20desc&$format=json`;
  const res = await axios.get(url);
  const data = res.data.value;
  setCache('selic:expectativas', data, 6 * 3600);
  return data;
}

async function fetchIpcaHistorico() {
  const url = `${BCB_SGS}.433/dados/ultimos/12?formato=json`;
  const res = await axios.get(url);
  const data = res.data;
  setCache('ipca:historico', data, 24 * 3600);
  return data;
}

async function fetchIpcaExpectativas() {
  const ano = new Date().getFullYear();
  const url = `${BCB_FOCUS}/ExpectativasMercadoAnuais?$filter=Indicador%20eq%20'IPCA'%20and%20DataReferencia%20eq%20'${ano}'&$top=5&$orderby=Data%20desc&$format=json`;
  const res = await axios.get(url);
  const data = res.data.value;
  setCache('ipca:expectativas', data, 6 * 3600);
  return data;
}

async function fetchFocusSnapshot() {
  const indicadores = ['IPCA', 'Selic', 'PIB Total', 'Taxa de câmbio'];
  const ano = new Date().getFullYear();
  const resultados = {};
  for (const ind of indicadores) {
    const url = `${BCB_FOCUS}/ExpectativasMercadoAnuais?$filter=Indicador%20eq%20'${encodeURIComponent(ind)}'%20and%20DataReferencia%20eq%20'${ano}'&$top=1&$orderby=Data%20desc&$format=json`;
    const res = await axios.get(url);
    if (res.data.value.length > 0) {
      resultados[ind] = res.data.value[0];
    }
  }
  setCache('focus:snapshot', resultados, 6 * 3600);
  return resultados;
}

function getProximoCopom() {
  const hoje = new Date().toISOString().split('T')[0];
  return COPOM_2026.find(r => r.data_fim >= hoje) || COPOM_2026[COPOM_2026.length - 1];
}

module.exports = {
  fetchSelicExpectativas,
  fetchIpcaHistorico,
  fetchIpcaExpectativas,
  fetchFocusSnapshot,
  getProximoCopom,
  COPOM_2026,
};
