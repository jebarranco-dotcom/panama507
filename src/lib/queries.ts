import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const publicacionesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["publicaciones", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("fecha_programada", { ascending: false })
        .order("hora_programada", { ascending: true })
        .limit(120);
      if (error) throw error;
      return data;
    },
  });

export const mensajesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["mensajes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("*, colaboradores(nombre)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return data;
    },
  });

export const colaboradoresQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["colaboradores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const cuentasQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["cuentas_sociales", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cuentas_sociales")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("red");
      if (error) throw error;
      return data;
    },
  });

export const informesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["informes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("informes_diarios")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("fecha", { ascending: false })
        .limit(14);
      if (error) throw error;
      return data;
    },
  });

export const propiedadesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["propiedades", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propiedades")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const conexionesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["conexiones_redes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conexiones_redes")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("red");
      if (error) throw error;
      return data;
    },
  });

export const conexionEventosQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["conexiones_eventos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conexiones_eventos")
        .select("*")
        .eq("empresa_id", empresaId)
        .neq("estado", "activos_firma")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

export const leadsQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["leads", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, colaboradores(nombre)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

export const conversacionesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["conversaciones", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversaciones")
        .select("*, colaboradores(nombre)")
        .eq("empresa_id", empresaId)
        .order("ultimo_mensaje_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

export const tareasQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["tareas_seguimiento", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tareas_seguimiento")
        .select("*, colaboradores(nombre)")
        .eq("empresa_id", empresaId)
        .order("vence_at", { ascending: true })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

export const plantillasQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["plantillas_respuesta", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plantillas_respuesta")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activa", true)
        .order("categoria");
      if (error) throw error;
      return data;
    },
  });

export const logsQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["logs_automatizacion", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logs_automatizacion")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data;
    },
  });

export const publicacionesRedesQuery = (empresaId: string) =>
  queryOptions({
    queryKey: ["publicaciones_redes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publicaciones_redes")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("updated_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      return data;
    },
  });
