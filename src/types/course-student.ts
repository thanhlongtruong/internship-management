export type SerializedLecturer = {
  name: string;
  email: string;
  faculty: string;
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
  hasSubmitted: boolean;
  filesSubmitted: SerializedFile[];
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

export type SerializedCourseStudentData = {
  id: string;
  lecturer: SerializedLecturer | null;
  announcements: SerializedAnnouncement[];
};
