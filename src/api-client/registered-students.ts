import axios from "../Auth/Axios_Inceptor";

export const GetRegisteredStudents = async (
  schoolYear: string,
  semester: string,
  cohort: string,
  major: string
) => {
  return await axios.get(
    `/registered-students?schoolYear=${schoolYear}&semester=${semester}&cohort=${cohort}&major=${major}`
  );
};
