export type Red = "facebook" | "instagram" | "tiktok";

export const REDES: Record<Red, { nombre: string; color: string; formatos: string[] }> = {
  facebook: {
    nombre: "Facebook",
    color: "text-facebook",
    formatos: ["imagen", "carrusel", "video", "texto"],
  },
  instagram: {
    nombre: "Instagram",
    color: "text-instagram",
    formatos: ["carrusel", "reel", "historia"],
  },
  tiktok: {
    nombre: "TikTok",
    color: "text-tiktok",
    formatos: ["reel", "video"],
  },
};

export const PILARES = [
  {
    id: "propiedad_destacada",
    nombre: "Propiedad destacada",
    descripcion: "Una unidad real en alquiler o venta con precio, metros y beneficio principal.",
    peso: "35%",
  },
  {
    id: "tour_virtual",
    nombre: "Tour / recorrido",
    descripcion: "Recorrido vertical corto por la propiedad con ganchos en los primeros 3 segundos.",
    peso: "20%",
  },
  {
    id: "educativo",
    nombre: "Educativo",
    descripcion: "Requisitos, contratos, financiamiento, zonas y consejos para alquilar o comprar.",
    peso: "20%",
  },
  {
    id: "prueba_social",
    nombre: "Prueba social",
    descripcion: "Testimonios, entregas de llaves y casos de clientes que ya se mudaron.",
    peso: "15%",
  },
  {
    id: "tendencia",
    nombre: "Tendencia / marca",
    descripcion: "Audios y formatos del momento, equipo, detrás de cámaras y cultura de la empresa.",
    peso: "10%",
  },
] as const;

/** Plan semanal fijo: qué se publica cada día y en qué red. */
export const PLAN_DIARIO: Array<{
  red: Red;
  hora: string;
  pilar: string;
  formato: string;
}> = [
  { red: "instagram", hora: "09:00", pilar: "propiedad_destacada", formato: "carrusel" },
  { red: "facebook", hora: "13:00", pilar: "educativo", formato: "imagen" },
  { red: "tiktok", hora: "18:30", pilar: "tour_virtual", formato: "reel" },
];

export const ESTADOS_MENSAJE = ["nuevo", "en_proceso", "respondido", "cerrado"] as const;
export type EstadoMensaje = (typeof ESTADOS_MENSAJE)[number];

export const ETIQUETAS_ESTADO: Record<string, string> = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  respondido: "Respondido",
  cerrado: "Cerrado",
  programado: "Programado",
  publicado: "Publicado",
  borrador: "Borrador",
  fallido: "Fallido",
};

export function formatearPrecio(valor: number, moneda = "USD") {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function nombrePilar(id: string) {
  return PILARES.find((p) => p.id === id)?.nombre ?? id;
}
