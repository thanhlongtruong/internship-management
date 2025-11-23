/* eslint-disable @typescript-eslint/no-explicit-any */
export enum MajorStatus {
  NOT_STARTED = "Chưa đến thời gian đăng ký",
  OPEN = "Đăng ký đang mở",
  ENDED = "Đăng ký đã kết thúc",
}

export type SerializedStudent = {
  role: string;
  name: string;
  gender: string;
  birthday: string;
  school: string;
  major: string;
  cohort: string;
  pdt?: string | any;
  email: string;
};

export type SerializedCourse = {
  timeStart: string;
  timeEnd: string;
  schoolYear: string;
  semester: string;
  cohort: string;
};

export type SerializedRegistrationResult = {
  _id: string;
  courseId: string;
  major: string;
  createdAt: string;
  student: SerializedStudent;
  course: SerializedCourse;
};

export type SerializedMajorStats = {
  majorName: string;
  totalSlots: number;
  registeredCount: number;
  remainingSlots: number;
  status: (typeof MajorStatus)[keyof typeof MajorStatus];
  countMajor: number;
  trainingAdvisorCount: number;
  deadline: string | null;
};
