export interface Calendario {
  materia: string;
  e1: string;
  e2: string;
  esp: string;
  f: string;
  p1: string;
  p2: string;
  p3: string;
  ciclo: string;
}

export interface Materia {
  clave: string;
  materia: string;
  semestre: number;
  activo: boolean;
  ciclo: string;
  calendarioExamenes: Calendario | null; // Puede o no venir
  calificaciones: any; // O tu interfaz de Calificaciones
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
