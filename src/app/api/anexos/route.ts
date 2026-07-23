import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let tipo: string;
    let nomeArquivo: string;
    let mimeType: string;
    let base64: string;
    let tamanhoBytes: number;
    let turmaId: string | null = null;
    let alunoId: string | null = null;
    let semanaReferencia: string | null = null;
    let mesReferencia: string | null = null;
    let linkExterno: string | null = null;
    let createdBy: string | null = null;

    if (contentType.includes('application/json')) {
      // JSON body with base64 content
      const body = await request.json();
      tipo = body.tipo;
      nomeArquivo = body.nomeArquivo || 'arquivo';
      mimeType = body.mimeType || 'application/octet-stream';
      base64 = body.conteudoBase64;
      tamanhoBytes = body.tamanhoBytes || 0;
      turmaId = body.turmaId || null;
      alunoId = body.alunoId || null;
      semanaReferencia = body.semanaReferencia || null;
      mesReferencia = body.mesReferencia || null;
      linkExterno = body.linkExterno || null;
      createdBy = body.createdBy || null;
    } else {
      // FormData (multipart)
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      tipo = (formData.get('tipo') as string) || '';
      turmaId = (formData.get('turmaId') as string) || null;
      alunoId = (formData.get('alunoId') as string) || null;
      semanaReferencia = (formData.get('semanaReferencia') as string) || null;
      mesReferencia = (formData.get('mesReferencia') as string) || null;
      linkExterno = (formData.get('linkExterno') as string) || null;
      createdBy = (formData.get('createdBy') as string) || null;

      if (!file) {
        return NextResponse.json({ error: 'Arquivo não fornecido.' }, { status: 400 });
      }

      nomeArquivo = file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      tamanhoBytes = arrayBuffer.byteLength;

      if (tamanhoBytes > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Arquivo excede o limite de 5MB (${(tamanhoBytes / 1024 / 1024).toFixed(1)}MB).` },
          { status: 400 }
        );
      }

      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      base64 = btoa(binary);
    }

    if (!tipo || !['cronograma', 'boleto', 'comunicado'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido. Use: cronograma, boleto ou comunicado.' }, { status: 400 });
    }

    if (!base64) {
      return NextResponse.json({ error: 'Conteúdo do arquivo ausente.' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO anexos (tipo, nome_arquivo, mime_type, tamanho_bytes, conteudo_base64, turma_id, aluno_id, semana_referencia, mes_referencia, link_externo, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, tipo, nome_arquivo, tamanho_bytes, created_at`,
      [tipo, nomeArquivo, mimeType, tamanhoBytes, base64, turmaId, alunoId, semanaReferencia, mesReferencia, linkExterno, createdBy]
    );

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      tipo: row.tipo,
      nomeArquivo: row.nome_arquivo,
      tamanhoBytes: row.tamanho_bytes,
      createdAt: row.created_at,
    }, { status: 201 });

  } catch (err: any) {
    console.error('[API Anexos POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao salvar anexo.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo');
    const turmaId = searchParams.get('turmaId');
    const alunoId = searchParams.get('alunoId');
    const download = searchParams.get('download') === 'true';

    // Single attachment by ID (download)
    if (id) {
      const result = await query(
        `SELECT * FROM anexos WHERE id = $1 AND status = 'ativo'`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Anexo não encontrado.' }, { status: 404 });
      }

      const anexo = result.rows[0];

      if (download) {
        // Return the raw file for download
        const buffer = Buffer.from(anexo.conteudo_base64, 'base64');
        return new Response(buffer, {
          headers: {
            'Content-Type': anexo.mime_type,
            'Content-Disposition': `attachment; filename="${anexo.nome_arquivo}"`,
            'Content-Length': String(buffer.length),
          },
        });
      }

      // Return metadata + base64 for inline preview
      return NextResponse.json({
        id: anexo.id,
        tipo: anexo.tipo,
        nomeArquivo: anexo.nome_arquivo,
        mimeType: anexo.mime_type,
        tamanhoBytes: anexo.tamanho_bytes,
        conteudoBase64: anexo.conteudo_base64,
        turmaId: anexo.turma_id,
        alunoId: anexo.aluno_id,
        semanaReferencia: anexo.semana_referencia,
        mesReferencia: anexo.mes_referencia,
        linkExterno: anexo.link_externo,
        createdBy: anexo.created_by,
        createdAt: anexo.created_at,
      });
    }

    // List attachments by filters
    let sql = `SELECT id, tipo, nome_arquivo, mime_type, tamanho_bytes, turma_id, aluno_id, semana_referencia, mes_referencia, link_externo, created_by, created_at
               FROM anexos WHERE status = 'ativo'`;
    const params: any[] = [];
    let paramIdx = 1;

    if (tipo) {
      sql += ` AND tipo = $${paramIdx++}`;
      params.push(tipo);
    }
    if (turmaId) {
      sql += ` AND turma_id = $${paramIdx++}`;
      params.push(turmaId);
    }
    if (alunoId) {
      sql += ` AND aluno_id = $${paramIdx++}`;
      params.push(alunoId);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json(result.rows.map(row => ({
      id: row.id,
      tipo: row.tipo,
      nomeArquivo: row.nome_arquivo,
      mimeType: row.mime_type,
      tamanhoBytes: row.tamanho_bytes,
      turmaId: row.turma_id,
      alunoId: row.aluno_id,
      semanaReferencia: row.semana_referencia,
      mesReferencia: row.mes_referencia,
      linkExterno: row.link_externo,
      createdBy: row.created_by,
      createdAt: row.created_at,
    })));

  } catch (err: any) {
    console.error('[API Anexos GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao buscar anexos.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do anexo ausente.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE anexos SET status = 'inativo', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Anexo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Anexo removido com sucesso.' });
  } catch (err: any) {
    console.error('[API Anexos DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao remover anexo.' }, { status: 500 });
  }
}
