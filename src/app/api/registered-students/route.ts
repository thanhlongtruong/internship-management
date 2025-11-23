import { connectDB } from "@/lib/connectDB";

import { PipelineStage } from "mongoose";

import { NextResponse } from "next/server";

import { verifyAuth } from "@/utils/verify-auth";

import registration_result from "@/models/registration-result";

export async function GET(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role != "bcn") {
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const schoolYear = searchParams.get("schoolYear");
    const semester = searchParams.get("semester");
    const cohort = searchParams.get("cohort");
    const major = searchParams.get("major");

    if (!schoolYear || !semester || !cohort || !major) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Thiếu thông tin cần thiết để lấy danh sách sinh viên đã đăng ký.",
        },
        { status: 400 }
      );
    }

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "open_courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: {
          path: "$course",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "course.schoolYear": schoolYear,
          "course.semester": semester,
          "course.cohort": cohort,
          "course.major.name": major,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "student.cohort": cohort,
          "student.major": major,
        },
      },
      {
        $project: {
          _id: 0,
          "student.name": 1,
          "student.email": 1,
        },
      },
      {
        $sort: { "student.name": -1 },
      },
    ];

    const arrayStudents = await registration_result.aggregate(pipeline);

    const students = arrayStudents.map((item) => item.student);

    return NextResponse.json({ students }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  }
}
