import { query } from '@/lib/db';


export async function writeAuditLog(
  usuarioId: number | null,
  accion: string,
  detalle: Record<string, unknown> | null,
  ip: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, accion, detalle ? JSON.stringify(detalle) : null, ip]
    );
  } catch (err) {
    console.error('[writeAuditLog] Failed to insert audit log:', err);
  }
}
