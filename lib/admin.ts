import { query } from '@/lib/db';
import { hash } from 'bcryptjs';
import { writeAuditLog } from '@/lib/audit';
import type { Usuario, Area } from '@/lib/types';


export interface UsuarioDetalle extends Usuario {
  area_nombre: string | null;
}

export interface AuditLogRow {
  id: number;
  usuario_id: number | null;
  usuario_email: string | null;
  usuario_nombre: string | null;
  accion: string;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  ocurrido_en: string;
}


export async function getUsuariosList(): Promise<UsuarioDetalle[]> {
  const { rows } = await query<UsuarioDetalle>(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.rol::text as rol, u.area_id,
            u.must_change_password, u.activo, a.nombre AS area_nombre
     FROM usuarios u
     LEFT JOIN areas a ON u.area_id = a.id
     ORDER BY u.id ASC`
  );
  return rows;
}

export async function crearUsuarioAdmin(
  nombre: string,
  apellido: string,
  email: string,
  areaId: number | null,
  passwordTemp: string,
  creadoPor: number,
  ip: string | null
): Promise<number> {
  const passwordHash = await hash(passwordTemp, 12);

  const checkEmail = await query('SELECT id FROM usuarios WHERE email = $1 LIMIT 1', [email]);
  if (checkEmail.rows.length > 0) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const { rows } = await query<{ id: number }>(
    `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, area_id, must_change_password, activo, creado_por)
     VALUES ($1, $2, $3, $4, 'admin', $5, true, true, $6)
     RETURNING id`,
    [nombre, apellido, email, passwordHash, areaId, creadoPor]
  );

  const newUserId = rows[0].id;

  await writeAuditLog(
    creadoPor,
    'crear_usuario_admin',
    {
      nuevo_usuario_id: newUserId,
      email,
      nombre: `${nombre} ${apellido}`,
      area_id: areaId,
    },
    ip
  );

  return newUserId;
}

export async function resetearContraseñaUsuario(
  usuarioId: number,
  nuevaPasswordTemp: string,
  modificadoPor: number,
  ip: string | null
): Promise<void> {
  const passwordHash = await hash(nuevaPasswordTemp, 12);

  const { rows } = await query<{ email: string }>(
    'UPDATE usuarios SET password_hash = $1, must_change_password = true WHERE id = $2 RETURNING email',
    [passwordHash, usuarioId]
  );

  if (rows.length === 0) {
    throw new Error('El usuario no existe.');
  }

  await writeAuditLog(
    modificadoPor,
    'resetear_password_usuario',
    {
      usuario_modificado_id: usuarioId,
      email: rows[0].email,
    },
    ip
  );
}


export async function getAllAreas(): Promise<(Area & { activo: boolean; creado_en: string })[]> {
  const { rows } = await query<Area & { activo: boolean; creado_en: string }>(
    `SELECT id, nombre, activo, creado_en
     FROM areas
     ORDER BY nombre ASC`
  );
  return rows;
}

export async function crearArea(
  nombre: string,
  creadoPor: number,
  ip: string | null
): Promise<number> {
  const normalized = nombre.trim();
  if (!normalized) {
    throw new Error('El nombre de área es requerido.');
  }

  try {
    const { rows } = await query<{ id: number }>(
      'INSERT INTO areas (nombre, activo) VALUES ($1, true) RETURNING id',
      [normalized]
    );

    const newAreaId = rows[0].id;

    await writeAuditLog(
      creadoPor,
      'crear_area',
      {
        nueva_area_id: newAreaId,
        nombre: normalized,
      },
      ip
    );

    return newAreaId;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      throw new Error('El nombre de área ya está registrado.');
    }
    throw err;
  }
}

export async function setAreaActiva(
  areaId: number,
  activa: boolean,
  modificadoPor: number,
  ip: string | null
): Promise<void> {
  const { rows } = await query<{ nombre: string }>(
    'UPDATE areas SET activo = $1 WHERE id = $2 RETURNING nombre',
    [activa, areaId]
  );

  if (rows.length === 0) {
    throw new Error('El área no existe.');
  }

  const actionName = activa ? 'reactivar_area' : 'desactivar_area';
  await writeAuditLog(
    modificadoPor,
    actionName,
    {
      area_id: areaId,
      nombre: rows[0].nombre,
    },
    ip
  );
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  const { rows } = await query<AuditLogRow>(
    `SELECT
       a.id,
       a.usuario_id,
       u.email AS usuario_email,
       concat(u.nombre, ' ', u.apellido) AS usuario_nombre,
       a.accion,
       a.detalle,
       a.ip,
       a.ocurrido_en
     FROM audit_logs a
     LEFT JOIN usuarios u ON a.usuario_id = u.id
     ORDER BY a.ocurrido_en DESC`
  );
  return rows;
}
