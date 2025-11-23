import { connectDB } from "./connectDB";

import { FilterQuery } from "mongoose";

import { verifyAuth } from "@/utils/verify-auth";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import user, { IUser } from "@/models/user";

import {
  SerializedCourseAdvisorData,
  SerializedStudent,
  SerializedAnnouncement,
  SerializedFile,
  SerializedTitle,
} from "@/types/course-advisor";

export async function getCourseAdvisorServer(
  schoolYear: string,
  semester: string,
  cohort: string
): Promise<SerializedCourseAdvisorData | null | "not-advisor"> {
  try {
    await connectDB();

    const result = await verifyAuth();
    if (result instanceof Response) {
      return null;
    }

    const { User } = result;

    if (User.role !== "gv") {
      return null;
    }

    const queryAdvisorGroup: FilterQuery<IAdvisorGroup> = {
      schoolYear: schoolYear,
      semester: semester,
      cohort: cohort,
      lecturerId: User._id,
    };

    const advisorGroup = await advisor_group
      .findOne(queryAdvisorGroup)
      .select("students announcements")
      .lean<IAdvisorGroup>();

    if (!advisorGroup) {
      return "not-advisor";
    }

    const studentList = await user
      .find({ _id: { $in: advisorGroup.students } })
      .select("-_id role email name gender birthday school major cohort")
      .lean<IUser[]>();

    const serializedStudents: SerializedStudent[] = studentList.map(
      (student) => ({
        role: String(student.role || ""),
        email: String(student.email || ""),
        name: String(student.name || ""),
        gender: String(student.gender || ""),
        birthday: String(student.birthday || ""),
        school: String(student.school || ""),
        major: String(student.major || ""),
        cohort: String(student.cohort || ""),
      })
    );

    const serializedAnnouncements: SerializedAnnouncement[] =
      advisorGroup.announcements.map((announcement: any) => {
        const { title, ...restAnnouncement } = announcement;

        const files: SerializedFile[] | undefined =
          restAnnouncement.files?.length > 0
            ? restAnnouncement.files.map((f: any) => ({
                _id: f._id?.toString() || "",
                url: f.url,
                name: f.name,
              }))
            : undefined;

        const serializedTitles: SerializedTitle[] = (title || []).map(
          (t: any) => {
            const { submissions, ...restTitle } = t;

            const countSubmitted = (submissions || []).length;
            const totalStudents = studentList.length;
            const countYet = totalStudents - countSubmitted;

            const titleFiles: SerializedFile[] | undefined =
              restTitle.files?.length > 0
                ? restTitle.files.map((f: any) => ({
                    _id: f._id?.toString() || "",
                    url: f.url,
                    name: f.name,
                  }))
                : undefined;

            return {
              _id: restTitle._id?.toString() || "",
              title_name: restTitle.title_name,
              content: restTitle.content,
              files: titleFiles,
              deadline: restTitle.deadline.toString(),
              createdAt: restTitle.createdAt.toString(),
              countSubmitted: Number(countSubmitted),
              countYet: Number(countYet),
            };
          }
        );

        return {
          _id: restAnnouncement._id?.toString() || "",
          topic: restAnnouncement.topic,
          description_topic: restAnnouncement.description_topic,
          files: files,
          announcements_type: restAnnouncement.announcements_type,
          createdAt: restAnnouncement.createdAt.toString(),
          title: serializedTitles,
        };
      });

    return {
      id: advisorGroup._id?.toString() || "",
      students: serializedStudents,
      announcements: serializedAnnouncements,
    };
  } catch (error) {
    console.error("Error fetching course advisor:", error);
    return null;
  }
}
