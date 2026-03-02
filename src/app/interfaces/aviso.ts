export interface Aviso {
  id: number;
  cicloId: string;
  periodoId: string;
  aviso: string;       // Este es el mensaje real
  fecha: string;       // Viene como "YYYY-MM-DD"
  dirigir: number;     // 1=profesores, 2=alumnos, 3=todos

  // Campos opcionales para la vista (calculados en el frontend)
  titulo?: string;
  remitente?: string;
  leido?: boolean;
}
