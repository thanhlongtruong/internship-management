import { NextResponse } from "next/server";

import mongoose, { Types } from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import open_registration, { IOpenRegistration } from "@/models/open-course";

import registration_result from "@/models/registration-result";

export async function POST(req: Request) {
  let session: mongoose.ClientSession | null = null;
  try {
    await connectDB();

    session = await mongoose.startSession();
    session.startTransaction();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role !== "sv") {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const now = new Date();

    const { courseId, major } = await req.json();

    if (User.major !== major) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Vui lòng chọn ngành đúng với ngành bạn đang học." },
        { status: 400 }
      );
    }

    const course = await open_registration
      .findById(courseId)
      .select("-__v -updatedAt")
      .lean<IOpenRegistration>()
      .session(session);

    if (!course) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy đợt đăng ký này." },
        { status: 404 }
      );
    }

    if (now < course.timeStart || now > course.timeEnd) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thời gian đăng ký chưa mở hoặc đã hết." },
        { status: 400 }
      );
    }

    if (course.cohort !== User.cohort) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: `Đợt đăng ký này cho khóa ${course.cohort}.` },
        { status: 400 }
      );
    }

    const existingRegistration = await registration_result.aggregate([
      {
        $match: {
          studentId: User._id,
          major: major,
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
        $match: {
          "course.schoolYear": course.schoolYear,
          "course.semester": course.semester,
          "course.cohort": course.cohort,
        },
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
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn đã đăng ký thực tập trong học kỳ này rồi." },
        { status: 400 }
      );
    }

    if (
      User.pdt!.toString() !==
      existingRegistration[0]?.course?.createdBy?.toString()
    ) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không có quyền đăng ký cho đợt này." },
        { status: 400 }
      );
    }

    const majorInfo = course.major.find((m) => m.name === major);

    if (!majorInfo) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json({ msg: "Ngành không hợp lệ" }, { status: 400 });
    }

    if (majorInfo.used >= majorInfo.quantity) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Số lượng đăng ký đã hết." },
        { status: 400 }
      );
    }

    await open_registration.findOneAndUpdate(
      {
        _id: Types.ObjectId.createFromHexString(courseId as string),
        "major.name": major,
      },
      {
        $inc: { "major.$.used": 1 },
      },
      { session }
    );

    await registration_result.create(
      {
        courseId: Types.ObjectId.createFromHexString(courseId as string),
        studentId: User._id,
        major,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ msg: "Đăng ký thành công." }, { status: 200 });
  } catch (e: any) {
    if (e.name === "MongoServerError" && e.code === 11000) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn đã đăng ký trước đó." },
        { status: 200 }
      );
    }

    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    session?.endSession();
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  } finally {
    if (session) session.endSession();
  }
}
