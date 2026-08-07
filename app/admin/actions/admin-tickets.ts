'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { headers } from 'next/headers';
import { updateTicketResolutionState, saveEvidencia, getEvidencias } from '@/lib/resolution';
import { writeAuditLog } from '@/lib/audit';
import type { TicketEvidencia, StatusTicket } from '@/lib/types';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.must_change_password) redirect('/admin/change-password');
  return session;
}

async function getRequestMetadata() {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0] || reqHeaders.get('x-real-ip') || null;
  const userAgent = reqHeaders.get('user-agent') || null;
  return { ip, userAgent };
}


interface AsignarResult { ok: boolean; error?: string }

export async function asignarResponsableAction(
  ticketId: number,
  responsable: string,
  autoasignar: boolean
): Promise<AsignarResult> {
  const session = await requireAdmin();
  const nombre = responsable.trim();

  if (!nombre || nombre.length < 2)
    return { ok: false, error: 'El nombre del responsable debe tener al menos 2 caracteres.' };

  const adminId = autoasignar ? parseInt(session.sub, 10) : null;

  await query(
    `UPDATE tickets
     SET responsable_nombre = $1,
         asignado_por       = $2,
         asignado_admin_id  = $3,
         asignado_en        = NOW(),
         status             = CASE
                               WHEN status = 'levantado' THEN 'en_proceso'::status_ticket
                               ELSE status
                             END
     WHERE id = $4`,
    [nombre, parseInt(session.sub, 10), adminId, ticketId]
  );

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath('/admin/tickets');
  return { ok: true };
}


export async function reasignarAction(
  ticketId: number
): Promise<AsignarResult> {
  await requireAdmin();

  await query(
    `UPDATE tickets
     SET responsable_nombre = NULL,
         asignado_admin_id  = NULL,
         asignado_por       = NULL,
         asignado_en        = NULL
     WHERE id = $1`,
    [ticketId]
  );

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath('/admin/tickets');
  return { ok: true };
}


interface GenerarLinkResult {
  ok: boolean;
  url?: string;
  error?: string;
  hadPrevious?: boolean;
}

export async function generarLinkResolucionAction(
  ticketId: number
): Promise<GenerarLinkResult> {
  const session = await requireAdmin();

  const { rowCount: invalidated } = await query(
    `UPDATE ticket_resolution_links
     SET activo = false
     WHERE ticket_id = $1 AND activo = true`,
    [ticketId]
  );

  const { rows } = await query<{ token: string }>(
    `INSERT INTO ticket_resolution_links (ticket_id, creado_por)
     VALUES ($1, $2)
     RETURNING token`,
    [ticketId, parseInt(session.sub, 10)]
  );

  const token = rows[0]?.token;
  if (!token) return { ok: false, error: 'No se pudo generar el link.' };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:4559';
  const url = `${baseUrl}/resolver/${token}`;

  revalidatePath(`/admin/tickets/${ticketId}`);
  return { ok: true, url, hadPrevious: (invalidated ?? 0) > 0 };
}

interface UploadResult {
  ok: boolean;
  evidencia?: TicketEvidencia;
  error?: string;
}

export async function subirEvidenciaAdminAction(
  ticketId: number,
  formData: FormData
): Promise<UploadResult> {
  const session = await requireAdmin();

  if (session.rol === 'admin') {
    const checkArea = await query<{ area_id: number }>(
      'SELECT area_id FROM tickets WHERE id = $1',
      [ticketId]
    );
    if (checkArea.rows.length === 0 || checkArea.rows[0].area_id !== session.area_id) {
      return { ok: false, error: 'Acceso denegado: el ticket no pertenece a tu área.' };
    }
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { ok: false, error: 'No se ha seleccionado ningún archivo.' };
  }

  const { ip } = await getRequestMetadata();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const evidencia = await saveEvidencia(ticketId, buffer, file.name, file.size, ip);
    revalidatePath(`/admin/tickets/${ticketId}`);
    return { ok: true, evidencia };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Error al guardar la evidencia.' };
  }
}

interface UpdateResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function resolverDirectamenteAction(
  ticketId: number,
  formData: FormData
): Promise<UpdateResult> {
  const session = await requireAdmin();

  if (session.rol === 'admin') {
    const checkArea = await query<{ area_id: number }>(
      'SELECT area_id FROM tickets WHERE id = $1',
      [ticketId]
    );
    if (checkArea.rows.length === 0 || checkArea.rows[0].area_id !== session.area_id) {
      return { ok: false, error: 'Acceso denegado: el ticket no pertenece a tu área.' };
    }
  }

  const status = formData.get('status') as string;
  const mensajeResolucion = (formData.get('mensaje_resolucion') as string || '').trim();
  const holdActivo = formData.get('hold_activo') === 'true';
  const holdMotivo = (formData.get('hold_motivo') as string || '').trim();

  if (status !== 'levantado' && status !== 'en_proceso' && status !== 'finalizado' && status !== 'cancelado') {
    return { ok: false, error: 'Estado seleccionado inválido.' };
  }

  if (status === 'finalizado') {
    if (!mensajeResolucion) {
      return {
        ok: false,
        fieldErrors: { mensaje_resolucion: 'El mensaje de resolución es obligatorio para finalizar el ticket.' },
      };
    }
    if (mensajeResolucion.length < 10) {
      return {
        ok: false,
        fieldErrors: { mensaje_resolucion: 'El mensaje de resolución debe tener al menos 10 caracteres.' },
      };
    }
    const evidencias = await getEvidencias(ticketId);
    if (evidencias.length === 0) {
      return {
        ok: false,
        error: 'No se puede finalizar el ticket sin adjuntar al menos una imagen de evidencia.',
      };
    }
  }

  if (status === 'cancelado') {
    if (!mensajeResolucion) {
      return {
        ok: false,
        fieldErrors: { mensaje_resolucion: 'El motivo de cancelación es obligatorio para cancelar el ticket.' },
      };
    }
    if (mensajeResolucion.length < 10) {
      return {
        ok: false,
        fieldErrors: { mensaje_resolucion: 'El motivo de cancelación debe tener al menos 10 caracteres.' },
      };
    }
  }

  if (holdActivo && !holdMotivo) {
    return {
      ok: false,
      fieldErrors: { hold_motivo: 'Debes ingresar un motivo para marcar el ticket en espera.' },
    };
  }

  const { ip } = await getRequestMetadata();

  try {
    const prevQuery = await query<{ status: string }>(
      'SELECT status::text FROM tickets WHERE id = $1',
      [ticketId]
    );
    const prevStatus = prevQuery.rows[0]?.status;

    await updateTicketResolutionState(ticketId, status, mensajeResolucion, holdActivo, holdMotivo, ip);

    if (prevStatus && prevStatus !== status) {
      const fullName = `${session.nombre} ${session.apellido}`;
      await query(
        `UPDATE ticket_status_history
         SET cambiado_por = $1,
             cambiado_ip = $2::inet
         WHERE id = (
           SELECT id FROM ticket_status_history
           WHERE ticket_id = $3 AND status = $4::status_ticket AND cambiado_por IS NULL
           ORDER BY cambiado_en DESC
           LIMIT 1
         )`,
        [fullName, ip, ticketId, status]
      );
    }

    await writeAuditLog(
      parseInt(session.sub, 10),
      'resolver_ticket_directamente',
      { ticket_id: ticketId, nuevo_status: status },
      ip
    );

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath('/admin/tickets');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Error al guardar la resolución.' };
  }
}
