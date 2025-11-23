export type SerializedLecturer = {
  name: string;
  email: string;
  faculty: string;
};

export type SerializedAdvisor = {
  lecturerId: SerializedLecturer;
  schoolYear: string;
  semester: string;
  cohort: string;
  faculty: string;
  maxStudents: number;
  assignedStudents: number;
  available: number;
  remainingTime: number;
  assignedClasses: boolean;
};
