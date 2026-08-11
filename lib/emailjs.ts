import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE!.trim();
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TICKET_RECIEVED!.trim();
const TEMPLATE_ADMIN_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TICKET_SEND!.trim();
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!.trim();


export interface TicketReceivedEmailParams {
  nombre: string;
  apellido: string;
  email: string;
  areaNombre: string;
  areaOrigenNombre: string;
  folio: string;
}

export async function sendTicketReceivedEmail(params: TicketReceivedEmailParams): Promise<void> {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      nombre: params.nombre,
      apellido: params.apellido,
      email: params.email,
      area: params.areaNombre,
      area_origen: params.areaOrigenNombre,
      folio: params.folio,
      ticket_url: 'http://10.33.31.90:4559/',
    },
    { publicKey: PUBLIC_KEY }
  );
}


export interface TicketAdminEmailParams {

  adminEmail: string;
  nombre: string;
  apellido: string;
  email: string;
  areaOrigen: string;
  areaDestino: string;
  folio: string;
  prioridad: string;
}

export async function sendTicketAdminEmail(
  params: Omit<TicketAdminEmailParams, 'adminEmail'>,
  adminEmails: string[]
): Promise<void> {
  if (adminEmails.length === 0) {
    console.warn('[EmailJS] No hay admins activos para el área destino. No se envía notificación.');
    return;
  }

  const results = await Promise.allSettled(
    adminEmails.map((adminEmail) =>
      emailjs.send(
        SERVICE_ID,
        TEMPLATE_ADMIN_ID,
        {
          admin_email: adminEmail,
          nombre: params.nombre,
          apellido: params.apellido,
          email: params.email,
          area_origen: params.areaOrigen,
          area: params.areaDestino,
          folio: params.folio,
          prioridad: params.prioridad,
          ticket_url: 'http://10.33.31.90:4559/',
        },
        { publicKey: PUBLIC_KEY }
      )
    )
  );

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[EmailJS] Fallo al notificar a ${adminEmails[i]}:`, r.reason);
    }
  });
}
