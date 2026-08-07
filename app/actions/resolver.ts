'use server';

import { headers } from 'next/headers';
import { validateToken, logLinkAccess, getEvidencias, saveEvidencia, updateTicketResolutionState } from '@/lib/resolution';
import type { TicketEvidencia } from '@/lib/types';
import { revalidatePath } from 'next/cache';


async function getRequestMetadata() {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0] || reqHeaders.get('x-real-ip') || null;
  const userAgent = reqHeaders.get('user-agent') || null;
  return { ip, userAgent };
}

export async function registrarAccesoAction(token: string): Promise<{ ok: boolean }> {
  const validation = await validateToken(token);
  if (!validation) return { ok: false };

  const { ip, userAgent } = await getRequestMetadata();
  await logLinkAccess(validation.linkId, 'access', ip, userAgent);
  return { ok: true };
}


interface UploadResult {
  ok: boolean;
  evidencia?: TicketEvidencia;
  error?: string;
}

export async function subirEvidenciaAction(
  token: string,
  formData: FormData
): Promise<UploadResult> {
  const validation = await validateToken(token);
  if (!validation) {
    return { ok: false, error: 'Enlace de resolución vencido o inválido.' };
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: 'No se recibió ningún archivo.' };
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { ok: false, error: 'El archivo excede el límite permitido de 5MB.' };
  }

  const contentType = file.type;
  if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
    return { ok: false, error: 'Formato inválido. Solo se permiten imágenes JPG o PNG.' };
  }

  const { ip, userAgent } = await getRequestMetadata();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const evidencia = await saveEvidencia(
      validation.ticketId,
      buffer,
      file.name,
      file.size,
      ip
    );

    await logLinkAccess(validation.linkId, `evidence_upload: ${file.name}`, ip, userAgent);

    revalidatePath(`/resolver/${token}`);
    return { ok: true, evidencia };
  } catch (err) {
    console.error('[subirEvidenciaAction] Upload error:', err);
    return { ok: false, error: 'Ocurrió un error al guardar el archivo en el servidor.' };
  }
}

interface UpdateResult {
  ok: boolean;
  error?: string;
  fieldErrors?: { mensaje_resolucion?: string; hold_motivo?: string };
}

export async function actualizarTicketAction(
  token: string,
  formData: FormData
): Promise<UpdateResult> {
  const validation = await validateToken(token);
  if (!validation) {
    return { ok: false, error: 'Enlace de resolución vencido o inválido.' };
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

    const evidencias = await getEvidencias(validation.ticketId);
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

  const { ip, userAgent } = await getRequestMetadata();

  try {
    await updateTicketResolutionState(
      validation.ticketId,
      status,
      mensajeResolucion,
      holdActivo,
      holdMotivo,
      ip
    );

    const logDetails = `update_ticket to status: ${status}, hold: ${holdActivo}`;
    await logLinkAccess(validation.linkId, logDetails, ip, userAgent);

    revalidatePath(`/resolver/${token}`);
    revalidatePath(`/admin/tickets/${validation.ticketId}`);
    return { ok: true };
  } catch (err) {
    console.error('[actualizarTicketAction] Error:', err);
    return { ok: false, error: 'Ocurrió un error al actualizar el estado en el servidor.' };
  }
}
