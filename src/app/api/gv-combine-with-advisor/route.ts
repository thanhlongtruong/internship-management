import { FilterQuery, Schema } from "mongoose";

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/connectDB";

import user, { IUser } from "@/models/user";

import { verifyAuth } from "@/utils/verify-auth";

import training_advisor, { ITrainingAdvisor } from "@/models/training_advisor";

import advisor_group from "@/models/advisor_group";

export async function GET(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    let idPdt: Schema.Types.ObjectId | undefined = undefined;

    if (User.role !== "pdt" && User.role !== "bcn") {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền truy cập" },
        { status: 400 }
      );
    }
    if (User.role !== "pdt" && User.role === "bcn") {
      idPdt = User.pdt;
    } else {
      idPdt = User._id;
    }

    const { searchParams } = new URL(req.url);

    const page_size = 20;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;

    const skip = (page - 1) * page_size;

    const schoolYear = searchParams.get("schoolYear");
    const semester = searchParams.get("semester");
    const cohort = searchParams.get("cohort");
    const faculty = searchParams.get("faculty");
    const type = searchParams.get("type");

    if (!schoolYear || !semester || !cohort || !faculty || !type) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin" },
        { status: 400 }
      );
    }

    if (type !== "assigned" && type !== "unassigned") {
      return NextResponse.json(
        { success: false, error: "Type không hợp lệ" },
        { status: 400 }
      );
    }

    const queryLecturers: FilterQuery<IUser> = {
      role: "gv",
      pdt: idPdt,
      faculty: faculty,
    };

    if (type === "assigned") {
      const queryTrainingAdvisors: FilterQuery<ITrainingAdvisor> = {
        schoolYear: schoolYear,
        semester: semester,
        cohort: cohort,
        faculty: faculty,
      };

      const [
        lecturersWithAdvisor_assigned,
        totalLecturersWithAdvisor_assigned,
      ] = await Promise.all([
        training_advisor
          .find(queryTrainingAdvisors)
          .select("-createdBy -__v -updatedAt -schoolYear -semester -cohort")
          .populate({
            path: "lecturerId",
            select: "role email name gender birthday school faculty -_id",
            model: user,
            options: { lean: true },
          })
          .sort({ name: 1 })
          .skip(skip)
          .limit(page_size)
          .lean<ITrainingAdvisor[]>(),

        training_advisor.countDocuments(queryTrainingAdvisors),
      ]);

      const advisorsGroup = await advisor_group
        .find({
          advisorId: { $in: lecturersWithAdvisor_assigned.map((l) => l._id) },
        })
        .select("students advisorId -_id")
        .lean<
          {
            advisorId: Schema.Types.ObjectId;
            students: Schema.Types.ObjectId[];
          }[]
        >();

      const customLecturersWithAdvisor_assigned =
        lecturersWithAdvisor_assigned.map((lecturer) => {
          const { _id, lecturerId, assignedStudents, ...restLecturer } =
            lecturer;

          const advisor_students = advisorsGroup.find(
            (a) => a.advisorId.toString() === lecturer._id!.toString()
          )?.students;

          const studentsCount = advisor_students?.length || 0;

          return {
            ...restLecturer,
            lecturer: lecturerId,
            assignedStudents: assignedStudents.length,
            students: studentsCount,
          };
        });

      return NextResponse.json(
        {
          assigned: customLecturersWithAdvisor_assigned,
          totalAssigned: totalLecturersWithAdvisor_assigned,
          totalPageAssigned: Math.ceil(
            totalLecturersWithAdvisor_assigned / page_size
          ),
          page: page,
          pageSize: page_size,
        },
        { status: 200 }
      );
    } else {
      const queryTrainingAdvisors: FilterQuery<ITrainingAdvisor> = {
        schoolYear: schoolYear,
        semester: semester,
        cohort: cohort,
        faculty: faculty,
      };

      const assignedLecturers = await training_advisor
        .find(queryTrainingAdvisors)
        .select("lecturerId -_id")
        .lean<{ lecturerId: Schema.Types.ObjectId }[]>();

      const assignedLecturerIds = assignedLecturers.map(
        (a) => a.lecturerId
      ) as Schema.Types.ObjectId[];

      const queryLecturersUnassigned: FilterQuery<IUser> = {
        ...queryLecturers,
        _id: { $nin: assignedLecturerIds },
      };

      const [totalUnassigned, lecturersUnassigned] = await Promise.all([
        user.countDocuments(queryLecturersUnassigned),
        user
          .find(queryLecturersUnassigned)
          .select("role email name gender birthday school faculty pdt _id")
          .populate({
            path: "pdt",
            select: "email role code -_id",
          })
          .sort({ name: 1 })
          .skip(skip)
          .limit(page_size)
          .lean<IUser[]>(),
      ]);

      const lecturersWithAdvisor_unassigned = lecturersUnassigned.map(
        (lecturer) => {
          const { _id, ...restLecturer } = lecturer;
          return restLecturer;
        }
      );

      return NextResponse.json(
        {
          unassigned: lecturersWithAdvisor_unassigned,
          totalUnassigned: totalUnassigned,
          totalPageUnassigned: Math.ceil(totalUnassigned / page_size),
          page: page,
          pageSize: page_size,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
