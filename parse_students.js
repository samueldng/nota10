const fs = require('fs');

const rawText = fs.readFileSync('extracted_students.txt', 'utf-8');
const lines = rawText.split('\n');

const students = [];
const seenNames = new Set();

let currentTurma = '';
let currentAcomp = '';

let currentStudent = null;

function cleanPhone(phoneStr) {
  if (!phoneStr) return '';
  // Remove non-numeric characters
  const cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length >= 8) {
    return cleaned;
  }
  return '';
}

function getSenhaInicial(phone1, phone2) {
  const p1 = cleanPhone(phone1);
  if (p1.length >= 4) {
    return p1.slice(-4);
  }
  const p2 = cleanPhone(phone2);
  if (p2.length >= 4) {
    return p2.slice(-4);
  }
  return '1234';
}

function parseAddress(addrStr) {
  if (!addrStr) return { rua: null, bairro: null, cidade: null };
  
  let rua = null;
  let bairro = null;
  let cidade = 'Bacabal'; // Default city from context
  
  const lower = addrStr.toLowerCase();
  
  // Try to find Bairro/B.
  let bairroIdx = lower.indexOf('bairro');
  if (bairroIdx === -1) bairroIdx = lower.indexOf('b.');
  
  // Try to find Cidade/C.
  let cidadeIdx = lower.indexOf('cidade');
  
  if (bairroIdx !== -1 && cidadeIdx !== -1) {
    rua = addrStr.substring(0, bairroIdx).replace(/[,:-]\s*$/, '').trim();
    bairro = addrStr.substring(bairroIdx, cidadeIdx).replace(/^(bairro|b\.)\s*[:.-]?\s*/i, '').replace(/[,:-]\s*$/, '').trim();
    cidade = addrStr.substring(cidadeIdx).replace(/^cidade\s*[:.-]?\s*/i, '').trim();
  } else if (bairroIdx !== -1) {
    rua = addrStr.substring(0, bairroIdx).replace(/[,:-]\s*$/, '').trim();
    bairro = addrStr.substring(bairroIdx).replace(/^(bairro|b\.)\s*[:.-]?\s*/i, '').trim();
    // Check if there is a city after comma in the end
    const lastComma = bairro.lastIndexOf(',');
    if (lastComma !== -1) {
      const endPart = bairro.substring(lastComma + 1).trim();
      if (endPart.toLowerCase().includes('bacabal') || endPart.toLowerCase().includes('ma')) {
        cidade = endPart;
        bairro = bairro.substring(0, lastComma).trim();
      }
    }
  } else {
    // Normal split
    const parts = addrStr.split(',');
    if (parts.length >= 3) {
      rua = parts[0].trim();
      bairro = parts[1].trim();
      cidade = parts[2].trim();
    } else if (parts.length === 2) {
      rua = parts[0].trim();
      bairro = parts[1].trim();
    } else {
      rua = addrStr.trim();
    }
  }

  // Final sanitization
  if (rua) rua = rua.replace(/[,.;:-]+$/, '').trim();
  if (bairro) bairro = bairro.replace(/[,.;:-]+$/, '').trim();
  if (cidade) cidade = cidade.replace(/[,.;:-]+$/, '').trim();
  
  return { rua, bairro, cidade };
}

lines.forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  // 1. Detect section headers
  if (trimmed.includes('5º ano (Pré-CMT)')) {
    currentAcomp = 'pre_cmt_5';
    return;
  }
  if (trimmed.startsWith('Turma:')) {
    const match = trimmed.match(/Turma:\s*(\w+)/i);
    if (match) {
      currentTurma = match[1].trim();
      if (['T1', 'T2', 'T3', 'T4', 'T5'].includes(currentTurma)) {
        currentAcomp = 'pre_cmt_5';
      }
    }
    return;
  }
  if (trimmed.includes('ALUNOS DO REFORÇO 5º ANO – ESTÃO NA TURMA PRÉ CMT T4')) {
    currentTurma = 'T4';
    currentAcomp = 'pre_cmt_5';
    return;
  }
  if (trimmed.includes('ALUNOS DO REFORÇO 4º ANO – ESTÃO NA TURMA PROJETO 4º ANO')) {
    currentTurma = 'PROJETO 4º ANO';
    currentAcomp = 'projeto_4';
    return;
  }
  if (trimmed.includes('PROJETO 4º ANO')) {
    currentTurma = 'PROJETO 4º ANO';
    currentAcomp = 'projeto_4';
    return;
  }

  const lower = trimmed.toLowerCase();

  // 2. Identify detail lines
  const isMotherName = lower.startsWith('mãe:') || lower.startsWith('nome da mãe:');
  const isMotherPhone = lower.startsWith('telefone da mãe:') || lower.startsWith('telefone de mãe:') || lower.startsWith('contato da mãe:');
  const isFatherName = lower.startsWith('pai:') || lower.startsWith('nome do pai:');
  const isFatherPhone = lower.startsWith('telefone do pai:') || lower.startsWith('telefone de pai:') || lower.startsWith('contato do pai:');
  
  // Broad phone and address matching
  const isPhone = lower.startsWith('telefone:') || lower.startsWith('contato:') || isMotherPhone || isFatherPhone;
  const isAddress = lower.startsWith('endereço:') || lower.startsWith('endereço completo:') || 
                    lower.startsWith('endereço (rua/bairro/cidade):') || 
                    lower.startsWith('endereço (rua, nº, bairro, cidade):');
  const isSerie = lower.startsWith('série/ano:') || lower.startsWith('série:') || lower.startsWith('ano:');

  const isDetail = isMotherName || isMotherPhone || isFatherName || isFatherPhone || isPhone || isAddress || isSerie;

  // Skip empty numbered placeholders like "4." or "7."
  if (/^\d+\.\s*$/.test(trimmed)) {
    return;
  }

  if (isDetail) {
    if (!currentStudent) return; // Ignore details if no current student context

    // Mother Name / Phone combined on one line (e.g. Mãe: Name | Telefone: 123)
    if (isMotherName) {
      if (trimmed.includes('|')) {
        const parts = trimmed.split('|');
        currentStudent.responsavel1_nome = parts[0].replace(/^(mãe|nome da mãe)\s*[:.-]?\s*/i, '').trim();
        const telMatch = parts[1].match(/telefone\s*[:.-]?\s*(.*)/i);
        if (telMatch) currentStudent.responsavel1_telefone = telMatch[1].trim();
      } else {
        currentStudent.responsavel1_nome = trimmed.replace(/^(mãe|nome da mãe)\s*[:.-]?\s*/i, '').trim();
      }
    }
    
    // Mother Phone separate line
    if (isMotherPhone) {
      currentStudent.responsavel1_telefone = trimmed.replace(/^(telefone da mãe|telefone de mãe|contato da mãe)\s*[:.-]?\s*/i, '').trim();
    }

    // Father Name / Phone combined on one line
    if (isFatherName) {
      if (trimmed.includes('|')) {
        const parts = trimmed.split('|');
        currentStudent.responsavel2_nome = parts[0].replace(/^(pai|nome do pai)\s*[:.-]?\s*/i, '').trim();
        const telMatch = parts[1].match(/telefone\s*[:.-]?\s*(.*)/i);
        if (telMatch) currentStudent.responsavel2_telefone = telMatch[1].trim();
      } else {
        currentStudent.responsavel2_nome = trimmed.replace(/^(pai|nome do pai)\s*[:.-]?\s*/i, '').trim();
      }
    }

    // Father Phone separate line
    if (isFatherPhone) {
      currentStudent.responsavel2_telefone = trimmed.replace(/^(telefone do pai|telefone de pai|contato do pai)\s*[:.-]?\s*/i, '').trim();
    }

    // Address Line (with robust regex matching prefix)
    if (isAddress) {
      const cleanAddr = trimmed.replace(/^(endereço completo|endereço)\s*(\([^)]*\))?\s*[:.-]?\s*/i, '').trim();
      const parsed = parseAddress(cleanAddr);
      currentStudent.endereco_rua = parsed.rua;
      currentStudent.endereco_bairro = parsed.bairro;
      currentStudent.endereco_cidade = parsed.cidade;
    }
  } else {
    // 3. This must be a student name line!
    let name = trimmed;
    const indexMatch = name.match(/^\d+\.\s*(.*)/);
    if (indexMatch) {
      name = indexMatch[1].trim();
    }

    if (!name) return;

    // Deduplicate (skip if already inserted, e.g. reinforce list overlap)
    if (seenNames.has(name.toLowerCase())) {
      currentStudent = null; // Clear context so details are ignored
      return;
    }

    seenNames.add(name.toLowerCase());

    currentStudent = {
      nome: name,
      turma_nome: currentTurma,
      acompanhamento: currentAcomp,
      responsavel1_nome: null,
      responsavel1_telefone: null,
      responsavel2_nome: null,
      responsavel2_telefone: null,
      endereco_rua: null,
      endereco_bairro: null,
      endereco_cidade: null,
    };
    students.push(currentStudent);
  }
});

// Let's generate the SQL commands
let sqlContent = `-- =========================================================\n`;
sqlContent += `-- MIGRATION DML SCRIPT: INJEÇÃO DE ALUNOS REAIS\n`;
sqlContent += `-- Nota 10 Educacional\n`;
sqlContent += `-- Data: 2026-07-07\n`;
sqlContent += `-- =========================================================\n\n`;

sqlContent += `BEGIN;\n\n`;
sqlContent += `-- 1. Limpeza segura das progressões e tabelas dependentes via CASCADE\n`;
sqlContent += `DELETE FROM alunos;\n\n`;

sqlContent += `-- 2. Inserção em lote da massa oficial de alunos\n`;
sqlContent += `INSERT INTO alunos (\n`;
sqlContent += `  numero, nome, turma_id, turma_nome, acompanhamento, status,\n`;
sqlContent += `  responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,\n`;
sqlContent += `  endereco_rua, endereco_bairro, endereco_cidade, plano, senha_inicial, primeiro_acesso\n`;
sqlContent += `) VALUES\n`;

const valuesArr = [];
let seq = 1;

students.forEach((s) => {
  // Regra de matrícula: Ano 2026 + sequencial de 4 dígitos
  const seqStr = String(seq++).padStart(4, '0');
  const numero = `2026${seqStr}`;

  // Tratar telefones
  const r1_tel = s.responsavel1_telefone && s.responsavel1_telefone.toLowerCase() !== 'não informado' ? s.responsavel1_telefone : null;
  const r2_tel = s.responsavel2_telefone && s.responsavel2_telefone.toLowerCase() !== 'não informado' && s.responsavel2_telefone.toLowerCase() !== 'prefiro não compartilhar' ? s.responsavel2_telefone : null;

  const senha = getSenhaInicial(r1_tel, r2_tel);

  // Sub-SELECT da turma
  const subSelect = `(SELECT id FROM turmas WHERE nome = '${s.turma_nome}' LIMIT 1)`;

  const r1_nome = s.responsavel1_nome ? `'${s.responsavel1_nome.replace(/'/g, "''")}'` : 'NULL';
  const r1_tel_val = r1_tel ? `'${r1_tel.replace(/'/g, "''")}'` : 'NULL';
  const r2_nome = s.responsavel2_nome ? `'${s.responsavel2_nome.replace(/'/g, "''")}'` : 'NULL';
  const r2_tel_val = r2_tel ? `'${r2_tel.replace(/'/g, "''")}'` : 'NULL';
  
  const rua = s.endereco_rua ? `'${s.endereco_rua.replace(/'/g, "''")}'` : 'NULL';
  const bairro = s.endereco_bairro ? `'${s.endereco_bairro.replace(/'/g, "''")}'` : 'NULL';
  const cidade = s.endereco_cidade ? `'${s.endereco_cidade.replace(/'/g, "''")}'` : 'NULL';

  const valLine = `  ('${numero}', '${s.nome.replace(/'/g, "''")}', ${subSelect}, '${s.turma_nome}', '${s.acompanhamento}', 'ativo', ${r1_nome}, ${r1_tel_val}, ${r2_nome}, ${r2_tel_val}, ${rua}, ${bairro}, ${cidade}, 'padrao', '${senha}', TRUE)`;
  valuesArr.push(valLine);
});

sqlContent += valuesArr.join(',\n') + ';\n\n';

sqlContent += `COMMIT;\n`;

fs.writeFileSync('migracao_alunos.sql', sqlContent);
console.log(`Parsed ${students.length} unique students successfully and generated migracao_alunos.sql!`);
