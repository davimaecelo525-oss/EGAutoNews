const $ = (selector) => document.querySelector(selector);
const state = { companies: [], query: '', region: '' };
const categories = ['Agência veicular', 'Autopeças', 'Oficina', 'Outras'];

function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function formatCep(value = '') { const digits = String(value).replace(/\D/g, '').slice(0, 8); return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value || ''; }
function parseSchedule(value = '') { try { const parsed = JSON.parse(value || ''); if (parsed && typeof parsed === 'object') return Object.entries(parsed).map(([day, item]) => `${({ segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo' })[day] || day}: ${item?.status === 'closed' || item?.closed ? 'Fechado' : `${item?.open || ''}${item?.open && item?.close ? ' às ' : ''}${item?.close || ''}`.trim()}`); } catch {} return String(value).split(/\n|;/).map((item) => item.trim()).filter(Boolean); }
function scheduleHtml(daysHours) { const rows = parseSchedule(daysHours); return rows.length ? rows.map((row) => `<li>${escapeHtml(row)}</li>`).join('') : '<span class="feira-sem-dado">Horário de atendimento não informado</span>'; }

function cardHtml(company) {
  const image = company.photoUrl || '../images/foto.avif';
  const location = [company.boothLocation, company.region].filter(Boolean).join(' · ');
  const description = String(company.description || 'Conheça os serviços desta empresa parceira.').replace(/\s+/g, ' ').trim();
  const shortDescription = description.length > 125 ? `${description.slice(0, 122).trimEnd()}…` : description;
  const detailUrl = `../feirantes/feirante.html?id=${encodeURIComponent(company.id)}`;
  const locationText = location || (company.cep ? `CEP ${formatCep(company.cep)}` : 'Localização a confirmar');
  return `<article class="parceiro-card">
    <a class="parceiro-card-media" href="${detailUrl}" aria-label="Conhecer empresa ${escapeHtml(company.businessName)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(company.businessName)}" loading="lazy" onerror="this.onerror=null;this.src='../images/foto.avif';"><span class="parceiro-card-categoria">${escapeHtml(company.category)}</span><span class="parceiro-card-seta" aria-hidden="true">→</span></a>
    <div class="parceiro-card-corpo"><h3>${escapeHtml(company.businessName)}</h3><p class="parceiro-card-descricao">${escapeHtml(shortDescription)}</p><p class="parceiro-card-local"><span aria-hidden="true">⌖</span><span>${escapeHtml(locationText)}</span></p><a class="parceiro-card-cta" href="${detailUrl}">Conhecer empresa <span aria-hidden="true">→</span></a></div>
  </article>`;
}

function populateRegions() { const regions = [...new Set(state.companies.map((company) => company.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')); $('#feirasRegiao').innerHTML = '<option value="">Todas as regiões</option>' + regions.map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join(''); }

function render() {
  const query = state.query.toLocaleLowerCase('pt-BR');
  const visible = state.companies.filter((company) => { const searchable = [company.businessName, company.description, company.category, company.region, company.boothLocation, company.cep].join(' ').toLocaleLowerCase('pt-BR'); return (!query || searchable.includes(query)) && (!state.region || company.region === state.region); });
  $('#feirasResumo').textContent = `${visible.length} empresa${visible.length === 1 ? '' : 's'} encontrada${visible.length === 1 ? '' : 's'}`;
  $('#empresasCategorias').innerHTML = visible.length ? categories.map((category) => { const items = visible.filter((company) => company.category === category); return `<section class="empresa-categoria-bloco"><header><h3>${escapeHtml(category)}</h3><span>${items.length} empresa${items.length === 1 ? '' : 's'}</span></header>${items.length ? `<div class="feiras-grid">${items.map(cardHtml).join('')}</div>` : '<p class="empresa-categoria-vazia">Nenhuma empresa cadastrada nesta categoria.</p>'}</section>`; }).join('') : '';
  $('#feirasVazio').classList.toggle('hidden', visible.length > 0);
}

async function loadCompanies() {
  try { const response = await fetch('/api/companies', { cache: 'no-store' }); if (!response.ok) throw new Error('Empresas indisponíveis'); const data = await response.json(); state.companies = Array.isArray(data.companies) ? data.companies : []; populateRegions(); render(); }
  catch (error) { console.warn('Empresas públicas:', error); $('#feirasResumo').textContent = 'Não foi possível atualizar agora'; $('#feirasErro').classList.remove('hidden'); }
}

$('#feirasBusca').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('#feirasRegiao').addEventListener('change', (event) => { state.region = event.target.value; render(); });
loadCompanies();
