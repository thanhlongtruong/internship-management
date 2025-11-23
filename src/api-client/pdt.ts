import { ColumnFiltersState } from "@tanstack/react-table";
import axios from "../Auth/Axios_Inceptor";

export const GetPdtStudents = async (
  page: number,
  columnFilters: ColumnFiltersState
) => {
  return await axios.get(
    `/pdt-sv?page=${page}&filter=${JSON.stringify(columnFilters).toString()}`
  );
};

export const GetPdtLecturers = async (
  page: number,
  columnFilters: ColumnFiltersState
) => {
  return await axios.get(
    `/pdt-gv?page=${page}&filter=${JSON.stringify(columnFilters).toString()}`
  );
};

export const GetGVCombineWithAdvisor = async (
  page: number,
  faculty: string,
  schoolYear: string,
  semester: string,
  cohort: string,
  type: "assigned" | "unassigned",
) => {
  return await axios.get(
    `/gv-combine-with-advisor?page=${page}&faculty=${faculty}&schoolYear=${schoolYear}&semester=${semester}&cohort=${cohort}&type=${type}`
  );
};

export const ValidateEmail = async (email: string) => {
  return await axios.post("/validate-email", { email });
};
