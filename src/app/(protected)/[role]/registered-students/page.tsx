import { getRegisteredStudentsServer } from "@/lib/get-registered-students-server";
import { generateYears, generateCohorts } from "@/utils/generate-years-cohorts";
import PageRegisteredStudentsClient from "./page-client";

export default async function PageRegisteredStudents({
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

  const data = await getRegisteredStudentsServer(year, semester, cohort);

  const majorStats = data || [];

  return (
    <PageRegisteredStudentsClient
      initialData={majorStats}
      initialYear={year}
      initialSemester={semester}
      initialCohort={cohort}
    />
  );
}
