export type Prioridad = 'baja' | 'media' | 'alta';

export type RolUsuario = 'superadmin' | 'admin';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  area_id: number | null;
  must_change_password: boolean;
  activo: boolean;
}

export type StatusTicket = 'levantado' | 'en_proceso' | 'finalizado' | 'cancelado';

export interface Area {
  id: number;
  nombre: string;
}

export interface CreateTicketInput {
  nombre: string;
  apellido: string;
  email: string;
  areaId: number;
  areaOrigenId: number;
  prioridad: Prioridad;
  mensaje: string;
}

export interface TicketFormErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  area_id?: string;
  area_origen_id?: string;
  prioridad?: string;
  mensaje?: string;
  _global?: string;
}

export type SubmitTicketResult =
  | { ok: true; folio: string; nombre: string; apellido: string; email: string; areaNombre: string; areaOrigenNombre: string; prioridad: Prioridad; adminEmails: string[] }
  | { ok: false; errors: TicketFormErrors };


export interface HoldActivo {
  motivo: string;
  iniciado_en: string;
}

export interface TicketDetalle {
  folio: string;
  nombre: string;
  apellido: string;
  email: string;
  area_nombre: string | null;
  area_origen_nombre: string | null;
  prioridad: Prioridad;
  prioridad_original: Prioridad;
  mensaje: string;
  status: StatusTicket;
  responsable_nombre: string | null;
  mensaje_resolucion: string | null;
  motivo_cancelacion: string | null;
  creado_en: string;
  finalizado_en: string | null;
  cancelado_en: string | null;
  hold_activo: HoldActivo | null;
}

export type BuscarTicketResult =
  | { found: false }
  | { found: true; ticket: TicketDetalle };

export interface TicketEvidencia {
  id: number;
  ticket_id: number;
  ruta_archivo: string;
  tamano_bytes: number;
  subido_en: string;
  subido_por_ip: string | null;
}

