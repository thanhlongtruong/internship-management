import axios from "../Auth/Axios_Inceptor";

export const GetCourseAdvisors = async (
  schoolYear: string,
  semester: string,
  cohort: string
) => {
  return await axios.get(
    `/course-advisor?schoolYear=${schoolYear}&semester=${semester}&cohort=${cohort}`
  );
};

export const CreateAnnouncement = async (data: {
  idAdvisorGroup: string;
  topic: string;
  description_topic?: string | undefined;
  files?: {
    url: string;
    name: string;
  }[];
  announcements_type: "general" | "assignment" | "internship_form";
  title: {
    title_name: string;
    content: string;
    files?: {
      url: string;
      name: string;
    }[];
    deadline: string;
  }[];
}) => {
  return await axios.post("/course-advisor", data);
};

export const UpdateAnnouncement = async (data: {
  idAdvisorGroup: string;
  idAnnouncement: string;
  topic: string;
  description_topic?: string | undefined;
  files?: {
    url: string;
    name: string;
  }[];
  announcements_type: "general" | "assignment" | "internship_form";
  title: {
    title_name: string;
    content: string;
    files?: {
      url: string;
      name: string;
    }[];
    deadline: string;
  }[];
}) => {
  return await axios.patch("/course-advisor", data);
};

export const DeleteAssignment = async ({
  idAdvisorGroup,
  idAnnouncement,
}: {
  idAdvisorGroup: string;
  idAnnouncement: string;
}) => {
  return await axios.delete("/course-advisor", {
    data: { idAdvisorGroup, idAnnouncement },
  });
};

export const GetSubmittedStudents = async ({
  idAdvisorGroup,
  idAnnouncement,
  idTitle,
}: {
  idAdvisorGroup: string;
  idAnnouncement: string;
  idTitle: string;
}) => {
  return await axios.get(
    `/submitted-students?idAG=${idAdvisorGroup}&idA=${idAnnouncement}&idT=${idTitle}`
  );
};

export const SubmitStudentsGrades = async (data: {
  idAG: string;
  idA: string;
  idT: string;
  grades: {
    email: string;
    grade: string;
  }[];
}) => {
  return await axios.post("/submitted-students", data);
};

export const ExportStudentsScores = async ({
  idAG,
  idA,
  idT,
}: {
  idAG: string;
  idA: string;
  idT: string;
}) => {
  return await axios.get(
    `/export-students-scores?idAG=${idAG}&idA=${idA}&idT=${idT}`,
    { responseType: "blob" }
  );
};

export const PublishFile = async (data: {
  idAG: string;
  idA: string;
  idT: string;
  files: {
    url: string;
    name: string;
  }[];
}) => {
  return await axios.post("/export-students-scores", data);
};
