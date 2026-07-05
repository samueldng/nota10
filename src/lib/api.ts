import type { Professor, Turma, Aluno, RegistroLancado, LogAuditoria } from './mockData';
import * as mock from './mockData';

// We fall back to mock data if there's no DATABASE_URL or if the API requests fail in dev mode.
const isDev = process.env.NODE_ENV === 'development';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API returned status ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getProfessores(): Promise<Professor[]> {
  try {
    return await fetchJson<Professor[]>('/api/professores');
  } catch (err) {
    console.warn("API getProfessores failed, falling back to mock data:", err);
    return mock.professores;
  }
}

export async function createProfessor(prof: Omit<Professor, 'id'>): Promise<Professor> {
  try {
    return await fetchJson<Professor>('/api/professores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prof),
    });
  } catch (err) {
    console.error("API createProfessor failed:", err);
    throw err;
  }
}

export async function updateProfessor(prof: Professor): Promise<Professor> {
  try {
    return await fetchJson<Professor>('/api/professores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prof),
    });
  } catch (err) {
    console.error("API updateProfessor failed:", err);
    throw err;
  }
}

export async function getTurmas(): Promise<Turma[]> {
  try {
    return await fetchJson<Turma[]>('/api/turmas');
  } catch (err) {
    console.warn("API getTurmas failed, falling back to mock data:", err);
    return mock.turmas;
  }
}

export async function createTurma(turma: Omit<Turma, 'id' | 'alunosCount'>): Promise<Turma> {
  try {
    return await fetchJson<Turma>('/api/turmas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turma),
    });
  } catch (err) {
    console.error("API createTurma failed:", err);
    throw err;
  }
}

export async function updateTurma(turma: Turma): Promise<Turma> {
  try {
    return await fetchJson<Turma>('/api/turmas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turma),
    });
  } catch (err) {
    console.error("API updateTurma failed:", err);
    throw err;
  }
}

export async function deleteTurma(id: string): Promise<void> {
  try {
    await fetchJson<any>(`/api/turmas?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error("API deleteTurma failed:", err);
    throw err;
  }
}

export async function getAlunos(): Promise<Aluno[]> {
  try {
    return await fetchJson<Aluno[]>('/api/alunos');
  } catch (err) {
    console.warn("API getAlunos failed, falling back to mock data:", err);
    return mock.alunos;
  }
}

export async function createAluno(aluno: Omit<Aluno, 'id' | 'primeiroAcesso'>): Promise<Aluno> {
  try {
    return await fetchJson<Aluno>('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aluno),
    });
  } catch (err) {
    console.error("API createAluno failed:", err);
    throw err;
  }
}

export async function updateAluno(aluno: Aluno): Promise<Aluno> {
  try {
    return await fetchJson<Aluno>('/api/alunos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aluno),
    });
  } catch (err) {
    console.error("API updateAluno failed:", err);
    throw err;
  }
}

export async function deleteAluno(id: string): Promise<void> {
  try {
    await fetchJson<any>(`/api/alunos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error("API deleteAluno failed:", err);
    throw err;
  }
}

export async function getRegistros(): Promise<RegistroLancado[]> {
  try {
    return await fetchJson<RegistroLancado[]>('/api/registros');
  } catch (err) {
    console.warn("API getRegistros failed, falling back to mock data:", err);
    return mock.registrosLancados;
  }
}

export async function createRegistro(registro: Omit<RegistroLancado, 'id'>): Promise<RegistroLancado> {
  try {
    return await fetchJson<RegistroLancado>('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro),
    });
  } catch (err) {
    console.error("API createRegistro failed:", err);
    throw err;
  }
}

export async function updateRegistro(registro: RegistroLancado): Promise<RegistroLancado> {
  try {
    return await fetchJson<RegistroLancado>('/api/registros', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro),
    });
  } catch (err) {
    console.error("API updateRegistro failed:", err);
    throw err;
  }
}

export async function getLogs(): Promise<LogAuditoria[]> {
  try {
    return await fetchJson<LogAuditoria[]>('/api/logs');
  } catch (err) {
    console.warn("API getLogs failed, falling back to mock data:", err);
    return mock.logAuditoria;
  }
}

export async function createLog(log: LogAuditoria): Promise<void> {
  try {
    await fetchJson<any>('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (err) {
    console.error("API createLog failed:", err);
  }
}
