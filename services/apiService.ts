export const API_BASE_URL = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'API request failed');
  }
  return response.json();
}

export async function getPvms() {
  return fetch(`${API_BASE_URL}/pvms`).then(handleResponse);
}

export async function createPvm(pvm: Partial<import('../types').PVM>) {
  return fetch(`${API_BASE_URL}/pvms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pvm),
  }).then(handleResponse);
}

export async function updatePvm(id: number, updates: Partial<import('../types').PVM>) {
  return fetch(`${API_BASE_URL}/pvms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then(handleResponse);
}

export async function deletePvm(id: number) {
  return fetch(`${API_BASE_URL}/pvms/${id}`, { method: 'DELETE' }).then(handleResponse);
}

export async function getRuns() {
  return fetch(`${API_BASE_URL}/runs`).then(handleResponse);
}

export async function createRun(run: Partial<import('../types').RunRecord>) {
  return fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(run),
  }).then(handleResponse);
}

export async function updateRun(id: string, updates: Partial<import('../types').RunRecord>) {
  return fetch(`${API_BASE_URL}/runs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then(handleResponse);
}

export async function deleteRun(id: string) {
  return fetch(`${API_BASE_URL}/runs/${id}`, { method: 'DELETE' }).then(handleResponse);
}
