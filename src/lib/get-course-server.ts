import { connectDB } from "./connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import open_registration, { IOpenRegistration } from "@/models/open-course";

import registration_result from "@/models/registration-result";

import { SerializedOpenRegistration } from "@/types/open-registration";

export async function getCourseServer(): Promise<SerializedOpenRegistration | null> {
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

    const now = new Date();

    const existingRegistration = await registration_result.aggregate([
      {
        $match: {
          studentId: User._id,
          major: User.major,
        },
      },
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
        $project: {
          "course.schoolYear": 1,
          "course.semester": 1,
          "course.cohort": 1,
          "course.createdBy": 1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    if (existingRegistration.length > 0) {
      return null;
    }

    const course = await open_registration
      .findOne({
        timeStart: { $lte: now },
        timeEnd: { $gte: now },
        "major.name": User.major,
        cohort: User.cohort,
      })
      .select("-__v -updatedAt")
      .lean<IOpenRegistration>();

    if (!course) {
      return null;
    }

    if (User.pdt!.toString() !== course.createdBy.toString()) {
      return null;
    }

    const serializedCourse: SerializedOpenRegistration = {
      _id: course?._id?.toString() || "",
      timeStart: course?.timeStart.toString() || "",
      timeEnd: course?.timeEnd.toString() || "",
      semester: course?.semester || "",
      schoolYear: course?.schoolYear || "",
      cohort: course?.cohort || "",
      major: course?.major || [],
    };

    return serializedCourse;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}
