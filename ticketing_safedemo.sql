--
-- PostgreSQL database dump
--

\restrict bu2cvTrP8wyb2co8OQZBWbEpm0ISYyF8xx3SGgBLTwegu4cD8I7oMIGLo6gJylP

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: prioridad_ticket; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.prioridad_ticket AS ENUM (
    'baja',
    'media',
    'alta'
);


ALTER TYPE public.prioridad_ticket OWNER TO postgres;

--
-- Name: rol_usuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rol_usuario AS ENUM (
    'superadmin',
    'admin'
);


ALTER TYPE public.rol_usuario OWNER TO postgres;

--
-- Name: status_ticket; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_ticket AS ENUM (
    'levantado',
    'en_proceso',
    'finalizado',
    'cancelado'
);


ALTER TYPE public.status_ticket OWNER TO postgres;

--
-- Name: fn_bloquear_evidencia_terminal(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bloquear_evidencia_terminal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_status status_ticket;
BEGIN
    SELECT status INTO v_status FROM tickets WHERE id = NEW.ticket_id;
    IF v_status IN ('finalizado', 'cancelado') THEN
        RAISE EXCEPTION 'No se puede agregar evidencia a un ticket ya %', v_status;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_bloquear_evidencia_terminal() OWNER TO postgres;

--
-- Name: fn_bloquear_hold_terminal(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bloquear_hold_terminal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_status status_ticket;
BEGIN
    SELECT status INTO v_status FROM tickets WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);
    IF v_status IN ('finalizado', 'cancelado') THEN
        RAISE EXCEPTION 'No se puede modificar espera de terceros en un ticket ya %', v_status;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_bloquear_hold_terminal() OWNER TO postgres;

--
-- Name: fn_bloquear_ticket_terminal(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bloquear_ticket_terminal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IN ('finalizado', 'cancelado') THEN
        RAISE EXCEPTION 'Este ticket ya está % y no puede modificarse', OLD.status;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_bloquear_ticket_terminal() OWNER TO postgres;

--
-- Name: fn_registrar_status_history(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_registrar_status_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO ticket_status_history (ticket_id, status, cambiado_por, cambiado_ip)
        VALUES (NEW.id, NEW.status, NULL, NULL);
        -- La aplicación debe actualizar cambiado_por/cambiado_ip con un UPDATE
        -- inmediato posterior, o mejor: pasar estos datos vía app antes del INSERT.
        -- (ver nota de implementación abajo)
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_registrar_status_history() OWNER TO postgres;

--
-- Name: fn_validar_finalizacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar_finalizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'finalizado' THEN
        IF NEW.mensaje_resolucion IS NULL OR trim(NEW.mensaje_resolucion) = '' THEN
            RAISE EXCEPTION 'No se puede finalizar un ticket sin mensaje de resolución';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM ticket_evidencia WHERE ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'No se puede finalizar un ticket sin evidencia adjunta';
        END IF;

        IF NEW.finalizado_en IS NULL THEN
            NEW.finalizado_en := now();
        END IF;
    END IF;

    IF NEW.status = 'cancelado' THEN
        IF NEW.motivo_cancelacion IS NULL OR trim(NEW.motivo_cancelacion) = '' THEN
            RAISE EXCEPTION 'No se puede cancelar un ticket sin motivo de cancelación';
        END IF;

        IF NEW.cancelado_en IS NULL THEN
            NEW.cancelado_en := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_finalizacion() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.areas OWNER TO postgres;

--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_id_seq OWNER TO postgres;

--
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    usuario_id integer,
    accion character varying(100) NOT NULL,
    detalle jsonb,
    ip inet,
    ocurrido_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: ticket_evidencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_evidencia (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    ruta_archivo text NOT NULL,
    tamano_bytes integer NOT NULL,
    subido_en timestamp with time zone DEFAULT now() NOT NULL,
    subido_por_ip inet,
    CONSTRAINT ticket_evidencia_tamano_bytes_check CHECK ((tamano_bytes <= 5242880))
);


ALTER TABLE public.ticket_evidencia OWNER TO postgres;

--
-- Name: ticket_evidencia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_evidencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_evidencia_id_seq OWNER TO postgres;

--
-- Name: ticket_evidencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_evidencia_id_seq OWNED BY public.ticket_evidencia.id;


--
-- Name: ticket_hold_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_hold_periods (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    motivo text NOT NULL,
    iniciado_en timestamp with time zone DEFAULT now() NOT NULL,
    finalizado_en timestamp with time zone,
    registrado_por character varying(150),
    registrado_ip inet
);


ALTER TABLE public.ticket_hold_periods OWNER TO postgres;

--
-- Name: ticket_hold_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_hold_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_hold_periods_id_seq OWNER TO postgres;

--
-- Name: ticket_hold_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_hold_periods_id_seq OWNED BY public.ticket_hold_periods.id;


--
-- Name: ticket_link_access_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_link_access_log (
    id integer NOT NULL,
    link_id integer NOT NULL,
    accion character varying(50) NOT NULL,
    ip inet NOT NULL,
    user_agent text,
    ocurrido_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ticket_link_access_log OWNER TO postgres;

--
-- Name: ticket_link_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_link_access_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_link_access_log_id_seq OWNER TO postgres;

--
-- Name: ticket_link_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_link_access_log_id_seq OWNED BY public.ticket_link_access_log.id;


--
-- Name: ticket_resolution_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_resolution_links (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    token character varying(64) DEFAULT encode(public.gen_random_bytes(32), 'hex'::text) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    creado_por integer
);


ALTER TABLE public.ticket_resolution_links OWNER TO postgres;

--
-- Name: ticket_resolution_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_resolution_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_resolution_links_id_seq OWNER TO postgres;

--
-- Name: ticket_resolution_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_resolution_links_id_seq OWNED BY public.ticket_resolution_links.id;


--
-- Name: ticket_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_status_history (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    status public.status_ticket NOT NULL,
    cambiado_en timestamp with time zone DEFAULT now() NOT NULL,
    cambiado_por character varying(150),
    cambiado_ip inet
);


ALTER TABLE public.ticket_status_history OWNER TO postgres;

--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_status_history_id_seq OWNER TO postgres;

--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_status_history_id_seq OWNED BY public.ticket_status_history.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    folio character varying(12) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    area_id integer NOT NULL,
    prioridad public.prioridad_ticket NOT NULL,
    mensaje text NOT NULL,
    status public.status_ticket DEFAULT 'levantado'::public.status_ticket NOT NULL,
    responsable_nombre character varying(150),
    asignado_por integer,
    asignado_en timestamp with time zone,
    mensaje_resolucion text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    creado_ip inet,
    finalizado_en timestamp with time zone,
    motivo_cancelacion text,
    cancelado_en timestamp with time zone,
    asignado_admin_id integer,
    CONSTRAINT tickets_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@safe-demo\.com$'::text))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    rol public.rol_usuario NOT NULL,
    area_id integer,
    must_change_password boolean DEFAULT true NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    creado_por integer,
    CONSTRAINT chk_admin_area CHECK ((((rol = 'admin'::public.rol_usuario) AND (area_id IS NOT NULL)) OR (rol = 'superadmin'::public.rol_usuario))),
    CONSTRAINT usuarios_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@safe-demo\.com$'::text))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_ticket_tiempo_espera; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_ticket_tiempo_espera AS
 SELECT ticket_id,
    sum(EXTRACT(epoch FROM (COALESCE(finalizado_en, now()) - iniciado_en))) AS segundos_esperando_terceros
   FROM public.ticket_hold_periods
  GROUP BY ticket_id;


ALTER VIEW public.v_ticket_tiempo_espera OWNER TO postgres;

--
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: ticket_evidencia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_evidencia ALTER COLUMN id SET DEFAULT nextval('public.ticket_evidencia_id_seq'::regclass);


--
-- Name: ticket_hold_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_hold_periods ALTER COLUMN id SET DEFAULT nextval('public.ticket_hold_periods_id_seq'::regclass);


--
-- Name: ticket_link_access_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_link_access_log ALTER COLUMN id SET DEFAULT nextval('public.ticket_link_access_log_id_seq'::regclass);


--
-- Name: ticket_resolution_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_resolution_links ALTER COLUMN id SET DEFAULT nextval('public.ticket_resolution_links_id_seq'::regclass);


--
-- Name: ticket_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history ALTER COLUMN id SET DEFAULT nextval('public.ticket_status_history_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id, nombre, activo, creado_en) FROM stdin;
2	Calidad	t	2026-07-16 14:53:06.756814-06
3	Moldeo	t	2026-07-16 14:53:10.606947-06
4	Ingeniería	f	2026-07-16 14:53:25.514375-06
5	NPI	t	2026-07-16 14:53:35.886537-06
6	Sistemas	t	2026-07-16 14:53:43.161874-06
7	Pintura	t	2026-07-16 14:53:49.048975-06
8	Inyección	t	2026-07-16 14:53:51.698682-06
10	Lógistica	t	2026-07-16 14:53:58.845539-06
11	Automatización	t	2026-07-16 14:54:26.830447-06
12	Seguridad e Higiene	t	2026-07-16 14:54:43.204252-06
13	Lean	t	2026-07-16 14:54:46.528565-06
9	Moldes	f	2026-07-16 14:53:55.480998-06
1	Prueba	t	2026-07-16 13:13:36.628197-06
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, usuario_id, accion, detalle, ip, ocurrido_en) FROM stdin;
1	1	crear_area	{"nombre": "Calidad", "nueva_area_id": 2}	::1	2026-07-16 14:53:06.759741-06
2	1	crear_area	{"nombre": "Moldeo", "nueva_area_id": 3}	::1	2026-07-16 14:53:10.608977-06
3	1	desactivar_area	{"nombre": "Prueba", "area_id": 1}	::1	2026-07-16 14:53:14.211936-06
4	1	reactivar_area	{"nombre": "Prueba", "area_id": 1}	::1	2026-07-16 14:53:15.170063-06
5	1	crear_area	{"nombre": "Ingeniería", "nueva_area_id": 4}	::1	2026-07-16 14:53:25.516375-06
6	1	desactivar_area	{"nombre": "Ingeniería", "area_id": 4}	::1	2026-07-16 14:53:32.231906-06
7	1	crear_area	{"nombre": "NPI", "nueva_area_id": 5}	::1	2026-07-16 14:53:35.901924-06
8	1	desactivar_area	{"nombre": "Prueba", "area_id": 1}	::1	2026-07-16 14:53:40.523647-06
9	1	crear_area	{"nombre": "Sistemas", "nueva_area_id": 6}	::1	2026-07-16 14:53:43.17366-06
10	1	crear_area	{"nombre": "Pintura", "nueva_area_id": 7}	::1	2026-07-16 14:53:49.066125-06
11	1	crear_area	{"nombre": "Inyección", "nueva_area_id": 8}	::1	2026-07-16 14:53:51.700877-06
12	1	crear_area	{"nombre": "Moldes", "nueva_area_id": 9}	::1	2026-07-16 14:53:55.483605-06
13	1	crear_area	{"nombre": "Lógistica", "nueva_area_id": 10}	::1	2026-07-16 14:53:58.850506-06
14	1	crear_area	{"nombre": "Automatización", "nueva_area_id": 11}	::1	2026-07-16 14:54:26.83232-06
15	1	crear_area	{"nombre": "Seguridad e Higiene", "nueva_area_id": 12}	::1	2026-07-16 14:54:43.205514-06
16	1	crear_area	{"nombre": "Lean", "nueva_area_id": 13}	::1	2026-07-16 14:54:46.540604-06
17	1	desactivar_area	{"nombre": "Moldes", "area_id": 9}	::1	2026-07-16 14:55:22.755676-06
18	1	crear_usuario_admin	{"email": "jorge.velichcanich@safe-demo.com", "nombre": "Jorge Velichcanich", "area_id": 2, "nuevo_usuario_id": 2}	::1	2026-07-16 14:57:11.704423-06
19	1	crear_usuario_admin	{"email": "roger.ochoa@safe-demo.com", "nombre": "Roger Ochoa", "area_id": 6, "nuevo_usuario_id": 4}	::1	2026-07-16 15:27:07.223395-06
20	1	resetear_password_usuario	{"email": "jorge.velichcanich@safe-demo.com", "usuario_modificado_id": 2}	::1	2026-07-16 15:30:10.326458-06
21	1	resetear_password_usuario	{"email": "roger.ochoa@safe-demo.com", "usuario_modificado_id": 4}	::1	2026-07-16 15:30:42.973926-06
22	1	reactivar_area	{"nombre": "Prueba", "area_id": 1}	::1	2026-07-21 10:01:17.514912-06
23	3	resolver_ticket_directamente	{"ticket_id": 4, "nuevo_status": "en_proceso"}	::1	2026-07-21 10:02:29.950013-06
24	3	resolver_ticket_directamente	{"ticket_id": 3, "nuevo_status": "en_proceso"}	::1	2026-07-21 10:02:35.825692-06
\.


--
-- Data for Name: ticket_evidencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_evidencia (id, ticket_id, ruta_archivo, tamano_bytes, subido_en, subido_por_ip) FROM stdin;
1	2	ticket_2_1784649282719_kxspxl.jpeg	196394	2026-07-21 09:54:42.721565-06	::1
\.


--
-- Data for Name: ticket_hold_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_hold_periods (id, ticket_id, motivo, iniciado_en, finalizado_en, registrado_por, registrado_ip) FROM stdin;
1	1	Estoy haciendo pruebas	2026-07-16 14:44:50.72483-06	2026-07-16 15:15:26.75229-06	\N	::1
2	4	Esperando proveedor	2026-07-21 10:02:29.94867-06	\N	\N	::1
\.


--
-- Data for Name: ticket_link_access_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_link_access_log (id, link_id, accion, ip, user_agent, ocurrido_en) FROM stdin;
1	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:44:18.383452-06
2	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:44:32.989733-06
3	1	update_ticket to status: en_proceso, hold: true	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:44:50.72708-06
4	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:44:50.773419-06
5	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.112561-06
6	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.240846-06
7	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.244041-06
8	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.262719-06
9	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.403334-06
10	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.403681-06
11	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.426877-06
12	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:46:11.433803-06
13	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:29.25382-06
14	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:29.270439-06
15	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:29.338032-06
16	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:29.364122-06
17	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:35.767484-06
18	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:35.944839-06
19	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.037309-06
20	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.038536-06
21	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.039322-06
22	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.072397-06
23	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.306136-06
24	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.31269-06
25	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.324005-06
26	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.332581-06
27	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.332866-06
28	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.410893-06
29	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.624327-06
30	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.629366-06
31	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.630051-06
32	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.633057-06
33	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.636566-06
34	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.739545-06
35	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.9302-06
36	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.930961-06
37	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.932888-06
38	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:36.933467-06
39	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:43.158853-06
40	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:43.194122-06
41	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:48:54.407833-06
42	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:01.443552-06
43	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:01.520806-06
44	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.515279-06
50	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.722899-06
57	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.910966-06
62	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.107757-06
48	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.517159-06
51	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.723461-06
58	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.911238-06
66	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.112028-06
71	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.251147-06
73	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:11.540515-06
74	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:11.598636-06
75	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:11.603145-06
77	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:19.540454-06
78	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.453118-06
82	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.598909-06
83	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.638299-06
90	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.818593-06
93	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.930115-06
96	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.998996-06
99	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.108585-06
103	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.165708-06
107	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.307541-06
108	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:32.49998-06
109	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:37.794331-06
112	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:38.960951-06
116	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.052718-06
118	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.13083-06
120	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.162018-06
123	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.246965-06
125	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.315058-06
126	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.321271-06
129	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.425168-06
131	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.48354-06
133	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.575518-06
141	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.762973-06
165	1	access	::1	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-16 15:15:14.269183-06
184	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:56:41.453322-06
49	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.517493-06
52	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.723825-06
61	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.912578-06
65	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.111713-06
110	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:37.920983-06
111	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:38.89807-06
119	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.142589-06
130	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.470572-06
136	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.62781-06
142	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.778668-06
166	1	update_ticket to status: cancelado, hold: false	::1	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-16 15:15:26.755204-06
167	1	access	::1	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-16 15:15:26.816011-06
168	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:15:46.639727-06
185	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:57:10.147786-06
113	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:38.975364-06
115	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.052364-06
121	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.215034-06
122	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.221034-06
124	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.290419-06
127	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.424779-06
135	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.576135-06
137	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.643852-06
139	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.742647-06
186	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:42.967927-06
187	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:43.052515-06
46	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.515823-06
53	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.724175-06
59	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.9116-06
64	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.111276-06
68	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.248888-06
91	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.821261-06
94	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.936508-06
100	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.146298-06
106	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.307187-06
114	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:38.975663-06
117	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.083978-06
128	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.425123-06
132	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.484925-06
134	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.575889-06
138	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.645238-06
140	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:39.743068-06
188	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:43.078973-06
143	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:11:13.37053-06
169	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:46:59.774948-06
189	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:43.106301-06
191	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:59.122999-06
192	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:20.681006-06
193	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:35.104537-06
195	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:35.205586-06
199	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:55.664734-06
200	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:55.669629-06
201	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:55.706346-06
205	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:09.589317-06
206	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:09.645496-06
209	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:17.752134-06
211	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:17.831495-06
144	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:04.956375-06
170	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:07.143571-06
190	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:58:59.08152-06
194	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:35.134381-06
203	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:57.782937-06
210	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:17.831277-06
45	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.515538-06
54	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.724431-06
56	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.907659-06
63	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.110944-06
69	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.250653-06
72	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:11.451329-06
79	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.457061-06
85	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.653719-06
86	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.751839-06
89	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.802031-06
97	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.999207-06
98	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.101803-06
101	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.148268-06
104	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.258496-06
145	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.041188-06
171	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:07.17822-06
196	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:35.278185-06
197	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:55.525432-06
198	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:55.595577-06
202	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:59:57.760453-06
204	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:09.552739-06
207	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:09.647708-06
208	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 10:00:17.574677-06
146	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.068315-06
151	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:12.863742-06
152	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:12.9946-06
153	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:20.511011-06
156	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:20.828345-06
157	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:30.196167-06
158	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:33.981048-06
159	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:42.436334-06
160	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:42.555455-06
161	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:46.798583-06
172	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:07.202813-06
173	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:10.060575-06
174	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:31.336205-06
177	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:53:03.113381-06
147	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.072818-06
149	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.213318-06
150	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.296866-06
154	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:20.668904-06
175	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:52:34.667871-06
176	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:53:02.955635-06
47	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.516232-06
55	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.724732-06
60	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:02.911844-06
67	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.112231-06
70	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:03.251027-06
76	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:19.4552-06
80	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.575394-06
81	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.585624-06
84	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.651078-06
87	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.758748-06
88	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.801628-06
92	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.91297-06
95	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:20.979765-06
102	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.163664-06
105	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 14:49:21.300605-06
148	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:05.205823-06
155	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:20.827806-06
162	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:13:46.905706-06
178	2	update_ticket to status: en_proceso, hold: false	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:54:27.650716-06
179	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:54:27.669506-06
163	1	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-16 15:14:26.116352-06
180	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:54:43.040974-06
181	2	update_ticket to status: finalizado, hold: false	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:54:50.72024-06
182	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:54:50.735438-06
164	1	access	::1	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-16 15:15:14.235481-06
183	2	access	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 09:56:41.404436-06
\.


--
-- Data for Name: ticket_resolution_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_resolution_links (id, ticket_id, token, activo, creado_en, creado_por) FROM stdin;
1	1	e75c8f0264d1b0c57c470528345aca2cac1b2f9212612ab3ca45628eea61b5fa	t	2026-07-16 14:43:17.643779-06	1
2	2	376ac8b118f82917d10a13632562c589df27db2d416dd1b0efae1be132b3b827	t	2026-07-21 09:46:50.572039-06	3
3	3	4da79b2929eb5d5f908edb7200aa1b98cc3aae0573509e0be753999b7fe7e808	t	2026-07-27 07:37:00.364954-06	3
\.


--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_status_history (id, ticket_id, status, cambiado_en, cambiado_por, cambiado_ip) FROM stdin;
1	1	levantado	2026-07-16 13:15:45.516803-06	\N	\N
2	2	levantado	2026-07-16 13:16:57.258887-06	\N	\N
3	1	en_proceso	2026-07-16 14:43:07.510826-06	\N	\N
4	1	cancelado	2026-07-16 15:15:26.716828-06	\N	\N
5	2	en_proceso	2026-07-16 15:25:10.520843-06	\N	\N
6	2	finalizado	2026-07-21 09:54:50.714057-06	\N	\N
7	3	levantado	2026-07-21 10:01:39.124823-06	\N	\N
8	4	levantado	2026-07-21 10:02:05.301641-06	\N	\N
9	4	en_proceso	2026-07-21 10:02:20.495613-06	\N	\N
10	3	en_proceso	2026-07-21 10:02:35.820757-06	Admin De Prueba	::1
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, folio, nombre, apellido, email, area_id, prioridad, mensaje, status, responsable_nombre, asignado_por, asignado_en, mensaje_resolucion, creado_en, creado_ip, finalizado_en, motivo_cancelacion, cancelado_en, asignado_admin_id) FROM stdin;
1	L0KOTBM0LR	José	Hernández	jose.hernandez@safe-demo.com	1	media	Ticket de Prueba	cancelado	Cid Barraza	1	2026-07-16 14:43:07.510826-06	\N	2026-07-16 13:15:45.516803-06	\N	\N	No procedió	2026-07-16 15:15:26.716828-06	\N
2	EECEDX9VON	Cid	Barraza	cid.barraza@safe-demo.com	1	alta	Ticket del Cid	finalizado	Admin De Prueba	3	2026-07-16 15:25:10.520843-06	Prueba de Finalización	2026-07-16 13:16:57.258887-06	\N	2026-07-21 09:54:50.714057-06	\N	\N	\N
4	LGAV7FNZH2	José	Hernández	jose.hernandez@safe-demo.com	1	alta	Prueba de esperando proveedores	en_proceso	Admin De Prueba	3	2026-07-27 07:36:50.62072-06	\N	2026-07-21 10:02:05.301641-06	\N	\N	\N	\N	3
3	G0C5XC8IFO	Nombre	Prueba	nombre.prueba@safe-demo.com	1	media	Problema para ver todos los procesos	en_proceso	Admin De Prueba	3	2026-07-27 07:37:02.958212-06	\N	2026-07-21 10:01:39.124823-06	\N	\N	\N	\N	3
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, apellido, email, password_hash, rol, area_id, must_change_password, activo, creado_en, creado_por) FROM stdin;
1	José de Jesús	Hernández Vázquez	jose.hernandez@safe-demo.com	$2b$12$9UWNXaEW7i1FqFIah3xP5Ot7MURfuGlAbz24N6vaWCrznj2ZSbb7W	superadmin	\N	f	t	2026-07-16 13:24:42.416738-06	\N
3	Admin	De Prueba	admin.prueba@safe-demo.com	$2b$12$WLrb5I4Vt.nwpoi.8vXP6OukZuqMXLHRJAYQ0Lglc6YLOJ3pMftnK	admin	1	f	t	2026-07-16 15:10:43.183218-06	1
2	Jorge	Velichcanich	jorge.velichcanich@safe-demo.com	$2b$12$A0mYzQnvhQm1k3s/feRN2uezYPa08/NnYnYaGFFZmt89spYOiHn.C	admin	2	t	t	2026-07-16 14:57:11.701231-06	1
4	Roger	Ochoa	roger.ochoa@safe-demo.com	$2b$12$FEuUyYFq9DWHPoTdw0rdbe7nST7McPH7eezI3Ar7eUUrRzvY1pMaK	admin	6	t	t	2026-07-16 15:27:07.21991-06	1
\.


--
-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.areas_id_seq', 13, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 24, true);


--
-- Name: ticket_evidencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_evidencia_id_seq', 1, true);


--
-- Name: ticket_hold_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_hold_periods_id_seq', 2, true);


--
-- Name: ticket_link_access_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_link_access_log_id_seq', 211, true);


--
-- Name: ticket_resolution_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_resolution_links_id_seq', 3, true);


--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_status_history_id_seq', 10, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 4, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 4, true);


--
-- Name: areas areas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_nombre_key UNIQUE (nombre);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: ticket_evidencia ticket_evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_evidencia
    ADD CONSTRAINT ticket_evidencia_pkey PRIMARY KEY (id);


--
-- Name: ticket_hold_periods ticket_hold_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_hold_periods
    ADD CONSTRAINT ticket_hold_periods_pkey PRIMARY KEY (id);


--
-- Name: ticket_link_access_log ticket_link_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_link_access_log
    ADD CONSTRAINT ticket_link_access_log_pkey PRIMARY KEY (id);


--
-- Name: ticket_resolution_links ticket_resolution_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_resolution_links
    ADD CONSTRAINT ticket_resolution_links_pkey PRIMARY KEY (id);


--
-- Name: ticket_resolution_links ticket_resolution_links_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_resolution_links
    ADD CONSTRAINT ticket_resolution_links_token_key UNIQUE (token);


--
-- Name: ticket_status_history ticket_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_folio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_folio_key UNIQUE (folio);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_accion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_accion ON public.audit_logs USING btree (accion);


--
-- Name: idx_audit_logs_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_usuario ON public.audit_logs USING btree (usuario_id);


--
-- Name: idx_evidencia_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidencia_ticket ON public.ticket_evidencia USING btree (ticket_id);


--
-- Name: idx_hold_periods_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hold_periods_ticket ON public.ticket_hold_periods USING btree (ticket_id);


--
-- Name: idx_link_access_log_link; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_link_access_log_link ON public.ticket_link_access_log USING btree (link_id);


--
-- Name: idx_resolution_links_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resolution_links_token ON public.ticket_resolution_links USING btree (token);


--
-- Name: idx_status_history_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status_history_ticket ON public.ticket_status_history USING btree (ticket_id);


--
-- Name: idx_tickets_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_area ON public.tickets USING btree (area_id);


--
-- Name: idx_tickets_folio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_folio ON public.tickets USING btree (folio);


--
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status);


--
-- Name: ticket_evidencia trg_bloquear_evidencia_terminal; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_evidencia_terminal BEFORE INSERT ON public.ticket_evidencia FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_evidencia_terminal();


--
-- Name: ticket_hold_periods trg_bloquear_hold_terminal; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_hold_terminal BEFORE INSERT OR UPDATE ON public.ticket_hold_periods FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_hold_terminal();


--
-- Name: tickets trg_bloquear_ticket_terminal; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_ticket_terminal BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_ticket_terminal();


--
-- Name: tickets trg_status_history; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_status_history AFTER INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_status_history();


--
-- Name: tickets trg_validar_finalizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_finalizacion BEFORE UPDATE ON public.tickets FOR EACH ROW WHEN (((new.status = ANY (ARRAY['finalizado'::public.status_ticket, 'cancelado'::public.status_ticket])) AND (old.status IS DISTINCT FROM new.status))) EXECUTE FUNCTION public.fn_validar_finalizacion();


--
-- Name: audit_logs audit_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: ticket_evidencia ticket_evidencia_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_evidencia
    ADD CONSTRAINT ticket_evidencia_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_hold_periods ticket_hold_periods_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_hold_periods
    ADD CONSTRAINT ticket_hold_periods_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_link_access_log ticket_link_access_log_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_link_access_log
    ADD CONSTRAINT ticket_link_access_log_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.ticket_resolution_links(id) ON DELETE CASCADE;


--
-- Name: ticket_resolution_links ticket_resolution_links_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_resolution_links
    ADD CONSTRAINT ticket_resolution_links_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: ticket_resolution_links ticket_resolution_links_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_resolution_links
    ADD CONSTRAINT ticket_resolution_links_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_status_history ticket_status_history_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: tickets tickets_asignado_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_asignado_admin_id_fkey FOREIGN KEY (asignado_admin_id) REFERENCES public.usuarios(id);


--
-- Name: tickets tickets_asignado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_asignado_por_fkey FOREIGN KEY (asignado_por) REFERENCES public.usuarios(id);


--
-- Name: usuarios usuarios_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: usuarios usuarios_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict bu2cvTrP8wyb2co8OQZBWbEpm0ISYyF8xx3SGgBLTwegu4cD8I7oMIGLo6gJylP

