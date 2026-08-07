import { query } from '@/lib/db';
import type { TicketDetalle, TicketEvidencia } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';


export const UPLOADS_DIR = 'C:\\Users\\JOHERNANDEZ\\Documents\\codigos\\sistema-tickets\\uploads';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}


export interface TokenValidationResult {
  linkId: number;
  ticketId: number;
  ticket: TicketDetalle;
}

export async function validateToken(token: string): Promise<TokenValidationResult | null> {
  const normalized = token.trim();
  if (!normalized) return null;

  try {
    const linkQuery = await query<{ id: number; ticket_id: number; activo: boolean }>(
      'SELECT id, ticket_id, activo FROM ticket_resolution_links WHERE token = $1 LIMIT 1',
      [normalized]
    );

    if (linkQuery.rows.length === 0 || !linkQuery.rows[0].activo) {
      return null;
    }

    const link = linkQuery.rows[0];

    const ticketQuery = await query<{
      folio: string;
      nombre: string;
      apellido: string;
      email: string;
      area_nombre: string | null;
      prioridad: string;
      mensaje: string;
      status: string;
      mensaje_resolucion: string | null;
      motivo_cancelacion: string | null;
      creado_en: string;
      finalizado_en: string | null;
      cancelado_en: string | null;
      hold_activo: { motivo: string; iniciado_en: string } | null;
    }>(
      `SELECT
         t.folio,
         t.nombre,
         t.apellido,
         t.email,
         a.nombre AS area_nombre,
         t.prioridad::text,
         t.mensaje,
         t.status::text,
         t.mensaje_resolucion,
         t.motivo_cancelacion,
         t.creado_en,
         t.finalizado_en,
         t.cancelado_en,
         (SELECT row_to_json(h)
          FROM (SELECT motivo, iniciado_en FROM ticket_hold_periods
                WHERE ticket_id = t.id AND finalizado_en IS NULL
                ORDER BY iniciado_en DESC LIMIT 1) h
         ) AS hold_activo
       FROM tickets t
       LEFT JOIN areas a ON t.area_id = a.id
       WHERE t.id = $1
       LIMIT 1`,
      [link.ticket_id]
    );

    if (ticketQuery.rows.length === 0) return null;

    const row = ticketQuery.rows[0];
    const ticket: TicketDetalle = {
      folio: row.folio,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      area_nombre: row.area_nombre,
      prioridad: row.prioridad as TicketDetalle['prioridad'],
      mensaje: row.mensaje,
      status: row.status as TicketDetalle['status'],
      mensaje_resolucion: row.mensaje_resolucion,
      motivo_cancelacion: row.motivo_cancelacion,
      creado_en: row.creado_en,
      finalizado_en: row.finalizado_en,
      cancelado_en: row.cancelado_en,
      hold_activo: row.hold_activo,
    };

    return {
      linkId: link.id,
      ticketId: link.ticket_id,
      ticket,
    };
  } catch (err) {
    console.error('[validateToken] Error:', err);
    return null;
  }
}


export async function logLinkAccess(
  linkId: number,
  accion: string,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO ticket_link_access_log (link_id, accion, ip, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [linkId, accion, ip || null, userAgent || null]
    );
  } catch (err) {
    console.error('[logLinkAccess] Failed logging access:', err);
  }
}


export async function getEvidencias(ticketId: number): Promise<TicketEvidencia[]> {
  const { rows } = await query<TicketEvidencia>(
    `SELECT id, ticket_id, ruta_archivo, tamano_bytes, subido_en, subido_por_ip
     FROM ticket_evidencia
     WHERE ticket_id = $1
     ORDER BY subido_en ASC`,
    [ticketId]
  );

  return rows;
}

export async function saveEvidencia(
  ticketId: number,
  buffer: Buffer,
  originalName: string,
  fileSize: number,
  ip: string | null
): Promise<TicketEvidencia> {
  const ext = path.extname(originalName).toLowerCase();
  const safeBase = `ticket_${ticketId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const safeFilename = `${safeBase}${ext}`;
  const absolutePath = path.join(UPLOADS_DIR, safeFilename);

  await fs.promises.writeFile(absolutePath, buffer);

  const { rows } = await query<TicketEvidencia>(
    `INSERT INTO ticket_evidencia (ticket_id, ruta_archivo, tamano_bytes, subido_por_ip)
     VALUES ($1, $2, $3, $4)
     RETURNING id, ticket_id, ruta_archivo, tamano_bytes, subido_en, subido_por_ip`,
    [ticketId, safeFilename, fileSize, ip || null]
  );

  return rows[0];
}


export async function updateTicketResolutionState(
  ticketId: number,
  status: string,
  mensajeResolucion: string | null,
  holdActivo: boolean,
  holdMotivo: string | null,
  ip: string | null
): Promise<void> {

  await query(
    `UPDATE tickets
     SET status = $1::status_ticket,
         mensaje_resolucion = CASE WHEN $1 = 'finalizado' THEN $2 ELSE NULL END,
         motivo_cancelacion = CASE WHEN $1 = 'cancelado' THEN $2 ELSE NULL END,
         finalizado_en = CASE WHEN $1 = 'finalizado' THEN NOW() ELSE NULL END,
         cancelado_en = CASE WHEN $1 = 'cancelado' THEN NOW() ELSE NULL END
     WHERE id = $3`,
    [status, mensajeResolucion || null, ticketId]
  );

  if (holdActivo) {

    const motivoText = (holdMotivo || '').trim() || 'En espera de respuesta de tercero.';

    const checkHold = await query(
      'SELECT id FROM ticket_hold_periods WHERE ticket_id = $1 AND finalizado_en IS NULL LIMIT 1',
      [ticketId]
    );

    if (checkHold.rows.length === 0) {

      await query(
        `INSERT INTO ticket_hold_periods (ticket_id, motivo, iniciado_en, registrado_ip)
         VALUES ($1, $2, NOW(), $3)`,
        [ticketId, motivoText, ip || null]
      );
    }
  } else {

    await query(
      `UPDATE ticket_hold_periods
       SET finalizado_en = NOW()
       WHERE ticket_id = $1 AND finalizado_en IS NULL`,
      [ticketId]
    );
  }
}
