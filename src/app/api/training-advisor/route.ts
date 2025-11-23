import mongoose from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import { NextResponse } from "next/server";

import advisor_group from "@/models/advisor_group";

import training_advisor, { ITrainingAdvisor } from "@/models/training_advisor";

import user from "@/models/user";

interface CreateTrainingAdvisorRequest {
  lecturerEmail: string;
  faculty: string;
  maxStudents: number;
  studentSelectDeadline: Date;
  schoolYear: string;
  semester: string;
  cohort: string;
}

export async function POST(req: Request) {
  let session: mongoose.ClientSession | null = null;
  try {
    await connectDB();

    session = await mongoose.startSession();
    session.startTransaction();

    const result = await verifyAuth();
    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role !== "bcn") {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const advisors: CreateTrainingAdvisorRequest[] = await req.json();

    if (!Array.isArray(advisors) || advisors.length === 0) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu thông tin cần thiết để tạo giảng viên hướng dẫn." },
        { status: 400 }
      );
    }

    for (const [i, item] of advisors.entries()) {
      const {
        lecturerEmail,
        faculty,
        maxStudents,
        studentSelectDeadline,
        schoolYear,
        semester,
        cohort,
      } = item;

      if (
        !lecturerEmail ||
        !faculty ||
        !maxStudents ||
        !studentSelectDeadline ||
        !schoolYear ||
        !semester ||
        !cohort
      ) {
        if (session && session.inTransaction()) {
          await session.abortTransaction();
        }
        session?.endSession();
        return NextResponse.json(
          { msg: `Thiếu thông tin cần thiết tại phần tử thứ ${i + 1}.` },
          { status: 400 }
        );
      }

      if (maxStudents < 1) {
        if (session && session.inTransaction()) {
          await session.abortTransaction();
        }
        session?.endSession();
        return NextResponse.json(
          {
            msg: `Số lượng sinh viên tối đa phải lớn hơn 0 (phần tử thứ ${
              i + 1
            }).`,
          },
          { status: 400 }
        );
      }
    }

    const lecturerEmails = advisors.map((a) => a.lecturerEmail);

    const lecturers = await user.find({
      email: { $in: lecturerEmails },
      role: "gv",
    });

    const foundEmails = lecturers.map((l) => l.email);
    const notFound = lecturerEmails.filter(
      (email) => !foundEmails.includes(email)
    );

    if (notFound.length > 0) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: `Không tìm thấy giảng viên: ${notFound.join(", ")}` },
        { status: 400 }
      );
    }

    const trainingAdvisorsToCreate = [];

    for (const item of advisors) {
      const {
        lecturerEmail,
        faculty,
        maxStudents,
        studentSelectDeadline,
        schoolYear,
        semester,
        cohort,
      } = item;

      const lecturer = lecturers.find((l) => l.email === lecturerEmail);
      if (!lecturer) continue;

      const existing = await training_advisor.findOne({
        lecturerId: lecturer._id,
        schoolYear,
        semester,
        cohort,
        faculty,
      });

      if (existing) {
        if (session && session.inTransaction()) {
          await session.abortTransaction();
        }
        session?.endSession();
        return NextResponse.json(
          {
            msg: `Giảng viên ${lecturerEmail} đã được phân công làm GVHD cho ${faculty}, khóa ${cohort}, học kỳ ${semester}, năm ${schoolYear}.`,
          },
          { status: 400 }
        );
      }

      trainingAdvisorsToCreate.push({
        lecturerId: lecturer._id,
        schoolYear,
        semester,
        cohort,
        faculty,
        maxStudents,
        studentSelectDeadline: new Date(studentSelectDeadline),
        createdBy: User._id,
        status: "active",
      });
    }

    if (trainingAdvisorsToCreate.length === 0) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không có giảng viên nào đủ điều kiện để phân công." },
        { status: 400 }
      );
    }

    const advisorsCreated = await training_advisor.insertMany(
      trainingAdvisorsToCreate,
      { session }
    );

    const announcementsToCreate = [
      {
        topic: "Chọn hình thức thực tập",
        announcements_type: "internship_form",
      },
    ];

    const groupsToCreate = advisorsCreated.map((item: ITrainingAdvisor) => ({
      advisorId: item._id,
      lecturerId: item.lecturerId,
      schoolYear: item.schoolYear,
      semester: item.semester,
      cohort: item.cohort,
      faculty: item.faculty,
      announcements: announcementsToCreate,
    }));

    await advisor_group.insertMany(groupsToCreate, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      { msg: "Phân công giảng viên hướng dẫn thành công." },
      { status: 200 }
    );
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    return NextResponse.json(
      {
        msg: "Có lỗi xảy ra khi phân công giảng viên hướng dẫn.",
        error: error,
      },
      { status: 500 }
    );
  } finally {
    if (session) session.endSession();
  }
}

// export async function GET(req: Request) {
//   try {
//     await connectDB();

//     const result = await verifyAuth();
//     if (result instanceof Response) return result;

//     const { User } = result;
//     if (User.role !== "sv") {
//       return NextResponse.json(
//         { msg: "Bạn không có quyền thực hiện chức năng này." },
//         { status: 400 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page") || "1", 10);
//     const limit = parseInt(searchParams.get("limit") || "20", 10);
//     const schoolYear = searchParams.get("schoolYear");
//     const semester = searchParams.get("semester");
//     const cohort = searchParams.get("cohort");

//     const skip = (page - 1) * limit;

//     const filter: FilterQuery<ITrainingAdvisor> = {
//       schoolYear,
//       semester,
//       cohort: cohort,
//     };

//     const [advisors, total] = await Promise.all([
//       training_advisor
//         .find(filter)
//         .populate("lecturerId", "name email faculty")
//         .skip(skip)
//         .limit(limit)
//         .sort({ studentSelectDeadline: -1 }),
//       training_advisor.countDocuments(filter),
//     ]);
//     return NextResponse.json(
//       {
//         advisors,
//         pagination: {
//           page,
//           limit,
//           total,
//           totalPages: Math.ceil(total / limit),
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       {
//         msg: "Có lỗi xảy ra khi lấy danh sách giảng viên hướng dẫn.",
//         error: error,
//       },
//       { status: 500 }
//     );
//   }
// }
