'use server';


import { createTicket } from '@/lib/tickets';
import type { Prioridad, SubmitTicketResult, TicketFormErrors } from '@/lib/types';

const VALID_PRIORIDADES: Prioridad[] = ['baja', 'media', 'alta'];
const EMAIL_RE = /^[^\s@]+@safe-demo\.com$/i;

export async function submitTicket(
  formData: FormData
): Promise<SubmitTicketResult> {

  const nombre = (formData.get('nombre') as string | null)?.trim() ?? '';
  const apellido = (formData.get('apellido') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const areaIdRaw = (formData.get('area_id') as string | null)?.trim() ?? '';
  const prioridad = (formData.get('prioridad') as string | null)?.trim() ?? '';
  const mensaje = (formData.get('mensaje') as string | null)?.trim() ?? '';

  const errors: TicketFormErrors = {};

  if (!nombre)
    errors.nombre = 'El nombre es requerido.';

  if (!apellido)
    errors.apellido = 'El apellido es requerido.';

  if (!email)
    errors.email = 'El correo es requerido.';
  else if (!EMAIL_RE.test(email))
    errors.email = 'El correo debe terminar en @safe-demo.com.';

  if (!areaIdRaw)
    errors.area_id = 'Selecciona un área.';

  if (!prioridad || !VALID_PRIORIDADES.includes(prioridad as Prioridad))
    errors.prioridad = 'Selecciona una prioridad.';

  if (!mensaje)
    errors.mensaje = 'El mensaje es requerido.';
  else if (mensaje.length < 10)
    errors.mensaje = 'El mensaje debe tener al menos 10 caracteres.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  try {
    const folio = await createTicket({
      nombre,
      apellido,
      email,
      areaId: parseInt(areaIdRaw, 10),
      prioridad: prioridad as Prioridad,
      mensaje,
    });
    return { ok: true, folio };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return {
      ok: false,
      errors: { _global: `No se pudo registrar el ticket: ${msg}` },
    };
  }
}
