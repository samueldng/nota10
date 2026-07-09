import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const disciplinasOficiais = [
  'Português',
  'Matemática',
  'Redação',
  'Multidisciplinar',
  'Introdução'
];

export async function GET() {
  // Retorna a lista estática, mas como API para que o frontend não dependa do mockData.ts
  return NextResponse.json(disciplinasOficiais);
}
