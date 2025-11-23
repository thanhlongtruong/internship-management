/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "./connectDB";

import { FilterQuery } from "mongoose";

import { verifyAuth } from "@/utils/verify-auth";

import open_course from "@/models/open-course";

import training_advisor, { ITrainingAdvisor } from "@/models/training_advisor";

import { IOpenRegistration } from "@/models/open-course";

import registration_result, {
  IRegistrationResult,
} from "@/models/registration-result";

import user, { IUser } from "@/models/user";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import {
  SerializedAdvisor,
  SerializedLecturer,
} from "@/types/training-advisors";

import { Major } from "@/utils/major";

import { Faculty } from "@/utils/faculty";

export async function getTrainingAdvisorsServer(
  schoolYear: string,
  semester: string
): Promise<SerializedAdvisor[] | null> {
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
    const faculty = Faculty.find((f) => f.id === foundMajor?.faculty);

    if (!faculty) {
      return null;
    }

    const registrations = await registration_result
      .find({ studentId: User._id })
      .select("-createdAt -updatedAt -__v -studentId")
      .populate({
        path: "courseId",
        select: "schoolYear semester cohort createdBy",
        model: open_course,
        options: { lean: true },
      })
      .lean<IRegistrationResult[]>();

    if (registrations.length <= 0) {
      return null;
    }

    const findCourse = registrations.find((r) => {
      const course = r.courseId as unknown as IOpenRegistration;
      return (
        course.schoolYear === schoolYear &&
        course.semester === semester &&
        course.cohort === User.cohort &&
        course.createdBy.toString() === User.pdt!.toString()
      );
    });

    if (!findCourse) {
      return null;
    }

    const course = findCourse.courseId as unknown as IOpenRegistration;

    const now = new Date();

    const filter: FilterQuery<ITrainingAdvisor> = {
      schoolYear: course.schoolYear,
      semester: course.semester,
      cohort: course.cohort,
      faculty: faculty.value,
    };

    const advisors = await training_advisor
      .find(filter)
      .select("-_id -createdBy -__v -updatedAt -createdAt")
      .populate({
        path: "lecturerId",
        select: "name email faculty -_id pdt",
        model: user,
        options: { lean: true },
      })
      .lean<ITrainingAdvisor & { lecturerId: IUser }[]>();

    const advisorGroups = await advisor_group
      .findOne({
        schoolYear: course.schoolYear,
        semester: course.semester,
        cohort: course.cohort,
        faculty: faculty.value,
        students: User._id,
      })
      .lean<IAdvisorGroup>();

    const advisorsCustom: SerializedAdvisor[] = advisors
      .filter((ad) => ad.lecturerId?.pdt?.toString() === User.pdt!.toString())
      .map((a: any) => {
        const { assignedStudents, studentSelectDeadline, lecturerId, ...rest } =
          a;
        const remainingTime = studentSelectDeadline.getTime() - now.getTime();

        const lecturer: SerializedLecturer = {
          name: String(lecturerId?.name || ""),
          email: String(lecturerId?.email || ""),
          faculty: String(lecturerId?.faculty || ""),
        };

        const assignedClasses = !!advisorGroups;

        return {
          ...rest,
          lecturerId: lecturer,
          assignedStudents: Array.isArray(assignedStudents)
            ? assignedStudents.length
            : 0,
          available:
            rest.maxStudents -
            (Array.isArray(assignedStudents) ? assignedStudents.length : 0),
          remainingTime: remainingTime,
          assignedClasses: assignedClasses,
        };
      });

    return advisorsCustom;
  } catch (error) {
    console.error("Error fetching training advisors:", error);
    return null;
  }
}
