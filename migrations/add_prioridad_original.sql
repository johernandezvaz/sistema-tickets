-- ============================================================
-- Migración: Agregar columna prioridad_original y trigger
-- ============================================================

-- 1. Crear columna si no existe
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS prioridad_original prioridad_ticket;

-- 2. Poblar datos retroactivos (desactivando triggers para evitar bloqueos por tickets finalizados/cancelados)
ALTER TABLE tickets DISABLE TRIGGER ALL;

UPDATE tickets
  SET prioridad_original = prioridad
  WHERE prioridad_original IS NULL;

ALTER TABLE tickets ENABLE TRIGGER ALL;

-- 3. Establecer restricciones (NOT NULL y DEFAULT)
ALTER TABLE tickets
  ALTER COLUMN prioridad_original SET NOT NULL,
  ALTER COLUMN prioridad_original SET DEFAULT 'baja';

-- 4. Crear trigger para autocompletar prioridad_original en nuevos tickets si viene NULL
CREATE OR REPLACE FUNCTION fn_set_prioridad_original()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.prioridad_original IS NULL THEN
    NEW.prioridad_original := NEW.prioridad;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_prioridad_original ON tickets;
CREATE TRIGGER trg_set_prioridad_original
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION fn_set_prioridad_original();
