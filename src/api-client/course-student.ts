import { SubmitAssignmentInput } from "@/utils/submit-assignment-schema";
import axios from "../Auth/Axios_Inceptor";

export const GetCourseStudent = async (
  schoolYear: string,
  semester: string
) => {
  return await axios.get(
    `/course-student?schoolYear=${schoolYear}&semester=${semester}`
  );
};

export const SubmitAssignment = async (
  data: SubmitAssignmentInput & {
    idAdvisorGroup: string;
    idAssignment: string;
    idTitle: string;
  }
) => {
  return await axios.post("/course-student", {
    ...data,
  });
};
