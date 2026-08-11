'use server';

import { query } from '@/lib/db';
import type { BuscarTicketResult, HoldActivo, TicketDetalle } from '@/lib/types';

const FOLIO_RE = /^[A-Z0-9]{10}$/;

const NOT_FOUND: BuscarTicketResult = { found: false };

export async function buscarTicket(folio: string): Promise<BuscarTicketResult> {
  const normalized = folio.trim().toUpperCase();

  if (!FOLIO_RE.test(normalized)) return NOT_FOUND;

  try {
    const { rows } = await query<{
      id: number;
      folio: string;
      nombre: string;
      apellido: string;
      email: string;
      area_nombre: string | null;
      area_origen_nombre: string | null;
      prioridad: string;
      prioridad_original: string;
      mensaje: string;
      status: string;
      responsable_nombre: string | null;
      mensaje_resolucion: string | null;
      motivo_cancelacion: string | null;
      creado_en: string;
      finalizado_en: string | null;
      cancelado_en: string | null;
    }>(
      `SELECT
         t.id,
         t.folio,
         t.nombre,
         t.apellido,
         t.email,
         a.nombre   AS area_nombre,
         ao.nombre  AS area_origen_nombre,
         t.prioridad::text,
         t.prioridad_original::text,
         t.mensaje,
         t.status::text,
         t.responsable_nombre,
         t.mensaje_resolucion,
         t.motivo_cancelacion,
         t.creado_en,
         t.finalizado_en,
         t.cancelado_en
       FROM tickets t
       LEFT JOIN areas a  ON t.area_id        = a.id
       LEFT JOIN areas ao ON t.area_origen_id = ao.id
       WHERE t.folio = $1
       LIMIT 1`,
      [normalized]
    );

    if (rows.length === 0) return NOT_FOUND;

    const row = rows[0];

    const holdResult = await query<{ motivo: string; iniciado_en: string }>(
      `SELECT motivo, iniciado_en
       FROM ticket_hold_periods
       WHERE ticket_id = $1 AND finalizado_en IS NULL
       ORDER BY iniciado_en DESC
       LIMIT 1`,
      [row.id]
    );

    const hold_activo: HoldActivo | null =
      holdResult.rows.length > 0 ? holdResult.rows[0] : null;

    const ticket: TicketDetalle = {
      folio:              row.folio,
      nombre:             row.nombre,
      apellido:           row.apellido,
      email:              row.email,
      area_nombre:        row.area_nombre,
      area_origen_nombre: row.area_origen_nombre,
      prioridad:          row.prioridad          as TicketDetalle['prioridad'],
      prioridad_original: row.prioridad_original as TicketDetalle['prioridad'],
      mensaje:            row.mensaje,
      status:             row.status             as TicketDetalle['status'],
      responsable_nombre: row.responsable_nombre,
      mensaje_resolucion: row.mensaje_resolucion,
      motivo_cancelacion: row.motivo_cancelacion,
      creado_en:          row.creado_en,
      finalizado_en:      row.finalizado_en,
      cancelado_en:       row.cancelado_en,
      hold_activo,
    };

    return { found: true, ticket };
  } catch {
    return NOT_FOUND;
  }
}
