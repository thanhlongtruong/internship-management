import { getCourseServer } from "@/lib/get-course-server";
import PageRegisterCourseClient from "./page-client";

export default async function PageRegisterCourse() {
  const course = await getCourseServer();

  return <PageRegisterCourseClient course={course} />;
}
