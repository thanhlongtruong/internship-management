import { connectDB } from "./connectDB";
import { verifyAuth } from "@/utils/verify-auth";
import open_registration, { IOpenRegistration } from "@/models/open-course";
import { generateYears, generateCohorts } from "@/utils/generate-years-cohorts";

export type SerializedOpenRegistration = {
  _id: string;
  timeStart: string;
  timeEnd: string;
  semester: string;
  schoolYear: string;
  cohort: string;
  major: { name: string; quantity: number; used: number }[];
};

export async function getOpenRegistrationServer(
  year?: string,
  semester?: string,
  cohort?: string
): Promise<SerializedOpenRegistration[]> {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) {
      return [];
    }

    const { User } = result;

    if (User.role !== "pdt") {
      return [];
    }

    const selectedYear = year || generateYears(2000).at(-1) || "";
    const selectedSemester = semester || "1";
    const selectedCohort = cohort || generateCohorts(2020).at(1) || "";

    if (!selectedYear || !selectedSemester || !selectedCohort) {
      return [];
    }

    const courses = await open_registration
      .find({
        schoolYear: selectedYear,
        semester: selectedSemester,
        cohort: selectedCohort,
        createdBy: User._id,
      })
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 })
      .lean<IOpenRegistration[]>();

    return courses.map((course) => ({
      _id: course._id?.toString() || "",
      timeStart: course.timeStart.toString(),
      timeEnd: course.timeEnd.toString(),
      semester: course.semester,
      schoolYear: course.schoolYear,
      cohort: course.cohort,
      major: course.major,
    }));
  } catch (error) {
    console.error("Error fetching open registration:", error);
    return [];
  }
}
