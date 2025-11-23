export interface SerializedOpenRegistration {
  _id: string;
  timeStart: string;
  timeEnd: string;
  schoolYear: string;
  semester: string;
  cohort: string;
  major: { name: string; quantity: number; used: number }[];
}
