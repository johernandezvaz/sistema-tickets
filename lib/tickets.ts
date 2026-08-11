import { query } from '@/lib/db';
import type { Area, CreateTicketInput } from '@/lib/types';

const FOLIO_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FOLIO_LENGTH = 10;

function buildFolio(): string {
  let folio = '';
  for (let i = 0; i < FOLIO_LENGTH; i++) {
    folio += FOLIO_CHARS[Math.floor(Math.random() * FOLIO_CHARS.length)];
  }
  return folio;
}

async function generateUniqueFolio(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const folio = buildFolio();
    const { rows } = await query(
      'SELECT 1 FROM tickets WHERE folio = $1',
      [folio]
    );
    if (rows.length === 0) return folio;
  }
  throw new Error('No se pudo generar un folio único. Intenta de nuevo.');
}

export async function getAreas(): Promise<Area[]> {
  const { rows } = await query<Area>(
    'SELECT id, nombre FROM areas WHERE activo = true ORDER BY nombre ASC'
  );
  return rows;
}

export async function createTicket(data: CreateTicketInput): Promise<string> {
  const folio = await generateUniqueFolio();

  await query(
    `INSERT INTO tickets (folio, nombre, apellido, email, area_id, area_origen_id, prioridad, mensaje)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      folio,
      data.nombre,
      data.apellido,
      data.email,
      data.areaId,
      data.areaOrigenId,
      data.prioridad,
      data.mensaje,
    ]
  );

  return folio;
}

export interface AdminTicketRow {
  id: number;
  folio: string;
  nombre: string;
  apellido: string;
  area_nombre: string | null;
  prioridad: string;
  prioridad_original: string;
  status: string;
  responsable_nombre: string | null;
  creado_en: string;
}

export async function getAdminTickets(
  rol: string,
  areaId: number | null
): Promise<AdminTicketRow[]> {
  const isAdmin = rol === 'admin';

  if (isAdmin && !areaId) return [];

  const { rows } = await query<AdminTicketRow>(
    isAdmin
      ? `SELECT t.id, t.folio, t.nombre, t.apellido,
                a.nombre AS area_nombre, t.prioridad::text, t.prioridad_original::text,
                t.status::text, t.responsable_nombre, t.creado_en
         FROM tickets t LEFT JOIN areas a ON t.area_id = a.id
         WHERE t.area_id = $1
         ORDER BY t.creado_en DESC`
      : `SELECT t.id, t.folio, t.nombre, t.apellido,
                a.nombre AS area_nombre, t.prioridad::text, t.prioridad_original::text,
                t.status::text, t.responsable_nombre, t.creado_en
         FROM tickets t LEFT JOIN areas a ON t.area_id = a.id
         ORDER BY t.creado_en DESC`,
    isAdmin ? [areaId] : []
  );
  return rows;
}

export interface AdminTicketDetail extends AdminTicketRow {
  email: string;
  mensaje: string;
  area_origen_nombre: string | null;
  prioridad_original: string;
  mensaje_resolucion: string | null;
  motivo_cancelacion: string | null;
  asignado_en: string | null;
  finalizado_en: string | null;
  cancelado_en: string | null;
  asignado_admin_id: number | null;
  hold_activo: { motivo: string; iniciado_en: string } | null;
  link_activo: { token: string; creado_en: string } | null;
}

export async function getAdminTicketById(
  id: number,
  rol: string,
  areaId: number | null
): Promise<AdminTicketDetail | null> {
  const isAdmin = rol === 'admin';

  const { rows } = await query<AdminTicketDetail>(
    `SELECT t.id, t.folio, t.nombre, t.apellido, t.email,
            a.nombre AS area_nombre, ao.nombre AS area_origen_nombre,
            t.prioridad::text, t.prioridad_original::text,
            t.status::text, t.responsable_nombre, t.creado_en,
            t.mensaje, t.mensaje_resolucion, t.motivo_cancelacion, t.asignado_en, t.finalizado_en, t.cancelado_en,
            t.asignado_admin_id,
            (SELECT row_to_json(h)
             FROM (SELECT motivo, iniciado_en FROM ticket_hold_periods
                   WHERE ticket_id = t.id AND finalizado_en IS NULL
                   ORDER BY iniciado_en DESC LIMIT 1) h
            ) AS hold_activo,
            (SELECT row_to_json(l)
             FROM (SELECT token, creado_en FROM ticket_resolution_links
                   WHERE ticket_id = t.id AND activo = true
                   ORDER BY creado_en DESC LIMIT 1) l
            ) AS link_activo
     FROM tickets t
     LEFT JOIN areas a  ON t.area_id        = a.id
     LEFT JOIN areas ao ON t.area_origen_id = ao.id
     WHERE t.id = $1 ${isAdmin ? 'AND t.area_id = $2' : ''}`,
    isAdmin ? [id, areaId] : [id]
  );

  return rows[0] ?? null;
}
