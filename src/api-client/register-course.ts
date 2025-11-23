import axios from "../Auth/Axios_Inceptor";

export const GetCourse = async () => {
  return await axios.get("/register-course");
};
export const RegisterCourse = async (data: {
  courseId: string;
  major: string;
}) => {
  return await axios.post("/register-course", data);
};
