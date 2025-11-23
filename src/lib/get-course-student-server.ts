/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "./connectDB";

import { FilterQuery } from "mongoose";

import { verifyAuth } from "@/utils/verify-auth";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import {
  SerializedCourseStudentData,
  SerializedLecturer,
  SerializedAnnouncement,
  SerializedFile,
} from "@/types/course-student";

import { Faculty } from "@/utils/faculty";

import { Major } from "@/utils/major";

export async function getCourseStudentServer(
  schoolYear: string,
  semester: string
): Promise<SerializedCourseStudentData | null> {
  try {
    await connectDB();

    const result = await verifyAuth();
    if (result instanceof Response) {
      return null;
    }

    const { User } = result;

    if (User.role !== "sv") {
      return null;
    }

    const foundMajor = Major.find((m) => m.value === User.major);

    if (!foundMajor) {
      return null;
    }

    const faculty = Faculty.find((f) => f.id === foundMajor?.faculty);
    if (!faculty) {
      return null;
    }

    const queryAdvisorGroup: FilterQuery<IAdvisorGroup> = {
      schoolYear: schoolYear,
      semester: semester,
      cohort: User.cohort,
      faculty: faculty.value,
      students: User._id,
    };

    const advisorGroup = await advisor_group
      .findOne(queryAdvisorGroup)
      .select("lecturerId announcements")
      .populate("lecturerId", "name email faculty -_id")
      .lean<IAdvisorGroup>();

    if (!advisorGroup) {
      return {
        id: "",
        lecturer: null,
        announcements: [],
      };
    }

    // Serialize lecturer
    const lecturer: SerializedLecturer | null = advisorGroup.lecturerId
      ? {
          name: (advisorGroup.lecturerId as any).name || "",
          email: (advisorGroup.lecturerId as any).email || "",
          faculty: (advisorGroup.lecturerId as any).faculty || "",
        }
      : null;

    // Serialize announcements
    const customAnnouncements: SerializedAnnouncement[] =
      advisorGroup.announcements.map((announcement: any) => {
        const { title, ...restAnnouncement } = announcement;

        // Serialize files
        const files: SerializedFile[] | undefined =
          restAnnouncement.files?.length > 0
            ? restAnnouncement.files.map((f: any) => ({
                _id: f._id?.toString() || "",
                url: String(f.url || ""),
                name: String(f.name || ""),
              }))
            : undefined;

        return {
          _id: restAnnouncement._id?.toString() || "",
          topic: String(restAnnouncement.topic || ""),
          description_topic: restAnnouncement.description_topic
            ? String(restAnnouncement.description_topic)
            : undefined,
          files: files,
          announcements_type: restAnnouncement.announcements_type,
          createdAt:
            restAnnouncement.createdAt instanceof Date
              ? restAnnouncement.createdAt.toISOString()
              : String(restAnnouncement.createdAt || new Date().toISOString()),
          title: (title || []).map((t: any) => {
            const { submissions, ...restTitle } = t;

            const hasSubmitted = (submissions || []).some(
              (submission: any) =>
                submission?.studentId?.toString() === User._id?.toString()
            );

            const filesSubmitted =
              (submissions || []).find(
                (submission: any) =>
                  submission?.studentId?.toString() === User._id?.toString()
              )?.file ?? [];

            // Serialize title files
            const titleFiles: SerializedFile[] | undefined =
              restTitle.files?.length > 0
                ? restTitle.files.map((f: any) => ({
                    _id: f._id?.toString() || "",
                    url: String(f.url || ""),
                    name: String(f.name || ""),
                  }))
                : undefined;

            // Serialize submitted files
            const serializedFilesSubmitted: SerializedFile[] = (
              filesSubmitted || []
            ).map((f: any) => ({
              _id: f._id?.toString() || "",
              url: String(f.url || ""),
              name: String(f.name || ""),
            }));

            return {
              _id: restTitle._id?.toString() || "",
              title_name: String(restTitle.title_name || ""),
              content: String(restTitle.content || ""),
              files: titleFiles,
              deadline:
                restTitle.deadline instanceof Date
                  ? restTitle.deadline.toISOString()
                  : String(restTitle.deadline || ""),
              createdAt:
                restTitle.createdAt instanceof Date
                  ? restTitle.createdAt.toISOString()
                  : String(restTitle.createdAt || new Date().toISOString()),
              hasSubmitted: hasSubmitted,
              filesSubmitted: serializedFilesSubmitted,
            };
          }),
        };
      });

    return {
      id: advisorGroup._id?.toString() || "",
      lecturer: lecturer,
      announcements: customAnnouncements,
    };
  } catch (error) {
    console.error("Error fetching course student:", error);
    return null;
  }
}
