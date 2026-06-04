export interface ReporteAccesoNoAutorizado {
  id: number;
  matricula: string;
  fechaReporte: string;
  estatus: number;
  detalle?: string | null;
  bloqueadaPorUsuario?: string | null;
  fechaBloqueo?: string | null;
  observacionBloqueo?: string | null;
  reinicioPorUsuario?: string | null;
  fechaReinicio?: string | null;
  observacionReinicio?: string | null;
}
