import { NextResponse } from 'next/server';
import { getAreas } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const areas = await getAreas();
    return NextResponse.json(areas);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
