import axios from "../Auth/Axios_Inceptor";

export const AutoAssignStudents = async (data: {
  schoolYear: string;
  semester: string;
  cohort: string;
  major: string;
  faculty: string;
}) => {
  return await axios.post("/auto-assign-students", data);
};
