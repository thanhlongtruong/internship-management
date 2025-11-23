import { getCourseStudentServer } from "@/lib/get-course-student-server";
import { generateYears } from "@/utils/generate-years-cohorts";
import PageCourseStudentClient from "./page-client";

export default async function PageCourseStudent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const years = generateYears(2022);

  const year =
    (typeof params.year === "string" ? params.year : undefined) ||
    years.at(-1) ||
    "";
  const semester =
    (typeof params.semester === "string" ? params.semester : undefined) || "1";

  const courseData = await getCourseStudentServer(year, semester);

  const data = courseData || {
    id: "",
    lecturer: null,
    announcements: [],
  };

  return (
    <PageCourseStudentClient
      initialData={data}
      initialYear={year}
      initialSemester={semester}
    />
  );
}
