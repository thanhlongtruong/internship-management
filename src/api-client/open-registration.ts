import axios from "../Auth/Axios_Inceptor";
import { OpenRegistrationInput } from "@/utils/open-registration-schema";

export const OpenRegistration = async (data: OpenRegistrationInput) => {
  return await axios.post("/open-registration", data);
};

export const GetOpenRegistration = async (year: string, semester: string, cohort: string) => {
  return await axios.get(
    `/open-registration?year=${year}&semester=${semester}&cohort=${cohort}`
  );
};

export const UpdateOpenRegistration = async (data: {
  dataCourse: OpenRegistrationInput;
  courseId: string;
}) => {
  return await axios.patch(`/open-registration`, data);
};

export const DeleteOpenRegistration = async (courseId: string) => {
  return await axios.delete(`/open-registration`, {
    data: { courseId },
  });
};
