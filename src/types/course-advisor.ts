export type SerializedStudent = {
  role: string;
  email: string;
  name: string;
  gender: string;
  birthday: string;
  school: string;
  major: string;
  cohort: string;
};

export type SerializedFile = {
  _id: string;
  url: string;
  name: string;
};

export type SerializedTitle = {
  _id: string;
  title_name: string;
  content: string;
  files?: SerializedFile[];
  deadline: string;
  createdAt: string;
  countSubmitted: number;
  countYet: number;
};

export type SerializedAnnouncement = {
  _id: string;
  topic: string;
  description_topic?: string;
  files?: SerializedFile[];
  announcements_type: "general" | "assignment" | "internship_form";
  createdAt: string;
  title: SerializedTitle[];
};

export type SerializedCourseAdvisorData = {
  id: string;
  students: SerializedStudent[];
  announcements: SerializedAnnouncement[];
};
