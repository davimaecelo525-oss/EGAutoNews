const form = document.querySelector('#formulario-cadastro');
const errorBox = document.querySelector('#mensagem-erro');
const statusBox = document.querySelector('#status-envio');
const successBox = document.querySelector('#sucesso');
const proofBox = document.querySelector('#comprovante-inscricao');
const submitButton = form.querySelector('button[type="submit"]');

function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
function showStatus(message) { statusBox.textContent = message; statusBox.hidden = false; }

function formatCnpj(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function isValidCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const checkDigit = (base) => {
    let factor = base.length - 7;
    let total = 0;
    for (const digit of base) { total += Number(digit) * factor; factor = factor === 2 ? 9 : factor - 1; }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(digits.slice(0, 12)) === Number(digits[12]) && checkDigit(digits.slice(0, 13)) === Number(digits[13]);
}

function formatPhone(value) { return String(value || '').replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); }
function formatCep(value) { return String(value || '').replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'); }

const cnpjInput = form.querySelector('[name="cnpj"]');
cnpjInput.addEventListener('input', () => { cnpjInput.value = formatCnpj(cnpjInput.value); });
const cepInput = form.querySelector('[name="cep"]');
cepInput.addEventListener('input', () => { cepInput.value = formatCep(cepInput.value); });
const phoneInput = form.querySelector('[name="phone"]');
phoneInput.addEventListener('input', () => { phoneInput.value = formatPhone(phoneInput.value); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  statusBox.hidden = true;
  if (location.protocol === 'file:') return showError('Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.');
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  data.cnpj = String(data.cnpj || '').replace(/\D/g, '');
  data.phone = String(data.phone || '').replace(/\D/g, '');
  data.cep = String(data.cep || '').replace(/\D/g, '');
  data.consentGiven = form.consentGiven.checked;
  if (!isValidCnpj(data.cnpj)) return showError('Informe um CNPJ válido. Cadastros de empresa não aceitam CPF.');
  if (!data.consentGiven) return showError('É necessário aceitar o uso dos dados para análise da inscrição.');
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando inscrição...';
  showStatus('Enviando sua inscrição. Aguarde...');
  try {
    const response = await fetch('/api/cadastros', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.');
    const code = result.registration?.id ? `#${result.registration.id}` : 'confirmado';
    proofBox.textContent = `Inscrição enviada com sucesso! Recebemos os dados da sua empresa e entraremos em contato em breve. Protocolo de atendimento: ${code}.`;
    form.hidden = true;
    successBox.hidden = false;
    statusBox.hidden = true;
  } catch (error) { showError(error.message || 'Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.'); }
  finally { submitButton.disabled = false; submitButton.textContent = 'Enviar cadastro da empresa'; }
});

document.querySelector('#novo-cadastro').addEventListener('click', () => { form.reset(); successBox.hidden = true; form.hidden = false; statusBox.hidden = true; errorBox.hidden = true; });
