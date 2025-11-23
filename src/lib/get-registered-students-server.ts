import { connectDB } from "./connectDB";

import { PipelineStage } from "mongoose";

import { verifyAuth } from "@/utils/verify-auth";

import open_registration from "@/models/open-course";

import registration_result from "@/models/registration-result";

import training_advisor from "@/models/training_advisor";

import { Major } from "@/utils/major";

import { Faculty } from "@/utils/faculty";

import { MajorStatus, SerializedMajorStats } from "@/types/registered-students";

export async function getRegisteredStudentsServer(
  year: string,
  semester: string,
  cohort: string
): Promise<SerializedMajorStats[] | null> {
  try {
    await connectDB();

    const result = await verifyAuth();
    if (result instanceof Response) {
      return null;
    }

    const { User } = result;

    if (User.role === "sv") {
      return null;
    }

    const majorCountPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "open_courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $match: {
          "course.schoolYear": year,
          "course.semester": semester,
          "course.cohort": cohort,
        },
      },
      {
        $group: {
          _id: "$major",
          count: { $sum: 1 },
          timeStart: { $first: "$course.timeStart" } as any,
          timeEnd: { $first: "$course.timeEnd" } as any,
        },
      },
      {
        $sort: { count: -1 },
      },
    ];

    const majorCounts = await registration_result.aggregate(majorCountPipeline);

    const allMajorsPipeline: PipelineStage[] = [
      {
        $match: {
          schoolYear: year,
          semester: semester,
          cohort: cohort,
        },
      },
      {
        $unwind: "$major",
      },
      {
        $group: {
          _id: "$major.name",
          totalSlots: { $sum: "$major.quantity" },
          timeStart: { $last: "$timeStart" } as any,
          timeEnd: { $last: "$timeEnd" } as any,
          countMajor: { $sum: 1 },
        },
      },
    ];

    const allMajors = await open_registration.aggregate(allMajorsPipeline);

    const faculty = allMajors.map((majorInfo) => {
      const major = Major.find((m) => m.value === majorInfo._id);
      const faculty = Faculty.find((f) => f.id === major?.faculty);
      return faculty?.value ?? "";
    });

    const trainingAdvisors = await training_advisor.aggregate([
      {
        $match: {
          schoolYear: year,
          semester: semester,
          cohort: cohort,
          faculty: { $in: faculty },
        },
      },
      {
        $group: {
          _id: "$faculty",
          deadline: { $last: "$studentSelectDeadline" },
          count: { $sum: 1 },
        },
      },
    ]);

    const majorStats: SerializedMajorStats[] = allMajors.map((majorInfo) => {
      const registeredCount =
        majorCounts.find((count) => count._id === majorInfo._id)?.count || 0;

      const timeStart = new Date(majorInfo.timeStart);
      const timeEnd = new Date(majorInfo.timeEnd);
      const now = new Date();

      let status: MajorStatus = MajorStatus.NOT_STARTED;
      if (now < timeStart) {
        status = MajorStatus.NOT_STARTED;
      } else if (now >= timeStart && now <= timeEnd) {
        status = MajorStatus.OPEN;
      } else {
        status = MajorStatus.ENDED;
      }

      const major = Major.find((m) => m.value === majorInfo._id);
      const facultyValue = Faculty.find((f) => f.id === major?.faculty);

      const trainingAdvisorCount =
        trainingAdvisors.find((count) => count._id === facultyValue?.value)
          ?.count || 0;

      const trainingAdvisorDeadline =
        trainingAdvisors.find((count) => count._id === facultyValue?.value)
          ?.deadline || null;

      return {
        majorName: String(majorInfo._id),
        totalSlots: Number(majorInfo.totalSlots || 0),
        registeredCount: Number(registeredCount),
        remainingSlots:
          Number(majorInfo.totalSlots || 0) - Number(registeredCount),
        status: status,
        countMajor: Number(majorInfo.countMajor || 0),
        trainingAdvisorCount: Number(trainingAdvisorCount),
        deadline: trainingAdvisorDeadline
          ? trainingAdvisorDeadline.toString()
          : null,
      };
    });

    return majorStats;
  } catch (error) {
    console.error("Error fetching registered students:", error);
    return null;
  }
}
