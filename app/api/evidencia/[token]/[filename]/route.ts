import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/resolution';
import { query } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOADS_DIR } from '@/lib/resolution';

import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; filename: string }> }
) {
  const { token, filename } = await params;

  let ticketId: number;

  if (token === 'admin') {
    const session = await getSession();
    if (!session) {
      return new NextResponse('Acceso denegado: requiere iniciar sesión.', { status: 403 });
    }

    const fileLookup = await query<{ ticket_id: number }>(
      'SELECT ticket_id FROM ticket_evidencia WHERE ruta_archivo = $1 LIMIT 1',
      [filename]
    );
    if (fileLookup.rows.length === 0) {
      return new NextResponse('Archivo no encontrado.', { status: 404 });
    }
    ticketId = fileLookup.rows[0].ticket_id;

    if (session.rol === 'admin') {
      const ticketArea = await query<{ area_id: number }>(
        'SELECT area_id FROM tickets WHERE id = $1',
        [ticketId]
      );
      if (ticketArea.rows.length === 0 || ticketArea.rows[0].area_id !== session.area_id) {
        return new NextResponse('Acceso denegado: el ticket no pertenece a tu área.', { status: 403 });
      }
    }
  } else {
    const validation = await validateToken(token);
    if (!validation) {
      return new NextResponse('Acceso denegado: token inválido o expirado.', { status: 403 });
    }
    ticketId = validation.ticketId;
  }

  try {

    const checkFile = await query(
      'SELECT id, tamano_bytes FROM ticket_evidencia WHERE ticket_id = $1 AND ruta_archivo = $2 LIMIT 1',
      [ticketId, filename]
    );

    if (checkFile.rows.length === 0) {
      return new NextResponse('Archivo no encontrado para este ticket.', { status: 404 });
    }

    const absolutePath = path.join(UPLOADS_DIR, filename);

    if (!absolutePath.startsWith(UPLOADS_DIR)) {
      return new NextResponse('Petición de archivo inválida.', { status: 400 });
    }

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse('El archivo físico no existe en el servidor.', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(absolutePath);

    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[evidencia api] Error serving file:', err);
    return new NextResponse('Error interno al servir el archivo.', { status: 500 });
  }
}
