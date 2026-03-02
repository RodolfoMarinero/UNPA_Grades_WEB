export interface Calificaciones {
  parcial1: number;
  parcial2: number;
  parcial3: number;
  ordinario: number | null;
  pfinal: number | null;
  extra1: number | null;
  extra2: number | null;
  especial: number | null;
}

export interface Materia {
  clave: string;
  materia: string;
  semestre: number;
  ciclo: string;
  activo: boolean;
  calificaciones: Calificaciones;
  // Puedes agregar calendarioExamenes si lo usas después
}

export interface AlumnoData {
  matricula: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  nombreCarrera: string;
  esRegular: boolean;
  materias: Materia[];
}
