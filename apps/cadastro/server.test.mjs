import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCnpj, validate } from './server.js';

const validPayload = {
  fullName: 'Responsável da Empresa',
  cnpj: '11.222.333/0001-81',
  email: 'contato@empresa.com.br',
  phone: '61999999999',
  businessName: 'Auto Center Brasília',
  region: 'Brasília',
  category: 'Oficina',
  description: 'Revisão, manutenção e diagnóstico automotivo.',
  consentGiven: true
};

test('aceita um CNPJ válido de empresa', () => {
  assert.equal(isValidCnpj(validPayload.cnpj), true);
  assert.equal(validate(validPayload), null);
});

test('rejeita CPF e CNPJ inválido no cadastro empresarial', () => {
  assert.equal(isValidCnpj('123.456.789-09'), false);
  assert.match(validate({ ...validPayload, cnpj: '123.456.789-09' }), /CNPJ válido/);
});

test('rejeita categoria fora das quatro categorias de serviço', () => {
  assert.match(validate({ ...validPayload, category: 'Hortifruti' }), /categoria de serviço válida/);
});
