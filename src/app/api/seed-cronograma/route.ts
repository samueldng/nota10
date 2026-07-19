import { NextResponse } from 'next/server';
import { seedCronogramaOficial } from '@/lib/seedCronograma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await seedCronogramaOficial();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro no endpoint /api/seed-cronograma:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await seedCronogramaOficial();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro no endpoint /api/seed-cronograma:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
