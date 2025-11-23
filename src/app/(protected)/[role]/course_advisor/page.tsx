import { getCourseAdvisorServer } from "@/lib/get-course-advisor-server";
import { generateYears, generateCohorts } from "@/utils/generate-years-cohorts";
import PageCourseAdvisorClient from "./page-client";

export default async function PageCourseAdvisor({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const years = generateYears(2000);
  const cohorts = generateCohorts(2020);

  const year =
    (typeof params.year === "string" ? params.year : undefined) ||
    years.at(-1) ||
    "";
  const semester =
    (typeof params.semester === "string" ? params.semester : undefined) || "1";
  const cohort =
    (typeof params.cohort === "string" ? params.cohort : undefined) ||
    cohorts.at(1) ||
    "";

  const courseData = await getCourseAdvisorServer(year, semester, cohort);

  const data = courseData || {
    id: "",
    students: [],
    announcements: [],
  };

  return (
    <PageCourseAdvisorClient
      initialData={data}
      initialYear={year}
      initialSemester={semester}
      initialCohort={cohort}
    />
  );
}
