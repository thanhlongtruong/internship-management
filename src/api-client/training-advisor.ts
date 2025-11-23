import axios from "../Auth/Axios_Inceptor";

export const GetTrainingAdvisors = async (
  page: number,
  schoolYear: string,
  semester: string,
  cohort?: string
) => {
  return await axios.get(
    `/training-advisor?page=${page}&schoolYear=${schoolYear}&semester=${semester}${
      cohort ? `&cohort=${cohort}` : ""
    }`
  );
};

export const CreateTrainingAdvisor = async (
  data: {
    lecturerEmail: string;
    faculty: string;
    maxStudents: number;
    studentSelectDeadline: Date;
    schoolYear: string;
    semester: string;
    cohort: string;
  }[]
) => {
  return await axios.post("/training-advisor", data);
};
