import { getTrainingAdvisorsServer } from "@/lib/get-training-advisors-server";
import { generateYears } from "@/utils/generate-years-cohorts";
import PageAdvisorsClient from "./page-client";

export default async function PageAdvisors({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const years = generateYears(2000);

  const year =
    (typeof params.year === "string" ? params.year : undefined) ||
    years.at(-1) ||
    "";
  const semester =
    (typeof params.semester === "string" ? params.semester : undefined) || "1";

  const advisorsData = await getTrainingAdvisorsServer(year, semester);

  const data = advisorsData || [];

  return (
    <PageAdvisorsClient
      initialData={data}
      initialYear={year}
      initialSemester={semester}
    />
  );
}
