/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "@/lib/connectDB";
import { verifyAuth } from "@/utils/verify-auth";
import { NextResponse } from "next/server";
import mongoose, { PipelineStage, Schema } from "mongoose";
import advisor_group from "@/models/advisor_group";

import registration_result from "@/models/registration-result";
import training_advisor from "@/models/training_advisor";

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

    const { major, faculty, schoolYear, semester, cohort } = await req.json();

    if (!major || !faculty || !schoolYear || !semester || !cohort) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu thông tin cần thiết để chia sinh viên tự động." },
        { status: 400 }
      );
    }

    const pipeline: PipelineStage[] = [
      { $match: { major } },
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
        $project: {
          courseId: 1,
          studentId: 1,
        },
      },
    ];

    const registered = await registration_result.aggregate(pipeline);

    if (!registered.length) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        {
          msg: `Không tìm thấy sinh viên đăng ký môn thuộc ngành ${major} năm ${schoolYear} học kỳ ${semester} khóa ${cohort}.`,
        },
        { status: 400 }
      );
    }

    const groups = await advisor_group
      .find(
        { schoolYear, semester, cohort, faculty },
        { advisorId: 1, lecturerId: 1, students: 1 }
      )
      .populate({
        path: "advisorId",
        select: "maxStudents",
        model: training_advisor,
        options: { lean: true },
      })
      .lean();

    if (!groups.length) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        {
          msg: `Không tìm thấy lớp giảng viên hướng dẫn nào cho khoa ${faculty} năm ${schoolYear} học kỳ ${semester} khóa ${cohort}.`,
        },
        { status: 400 }
      );
    }

    const registeredIds = registered.map((r) => r.studentId.toString());
    const alreadyAssigned = new Set<string>();
    for (const g of groups) {
      for (const s of g.students ?? []) {
        alreadyAssigned.add(s.toString());
      }
    }

    const unassigned: string[] = [];
    for (const sid of registeredIds) {
      if (!alreadyAssigned.has(sid)) unassigned.push(sid);
    }

    if (!unassigned.length) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Tất cả sinh viên đã có giảng viên hướng dẫn.", assigned: [] },
        { status: 200 }
      );
    }

    type GroupCap = {
      groupId: Schema.Types.ObjectId;
      advisorDocId: Schema.Types.ObjectId;
      current: number;
      max: number;
      capacityLeft: number;
    };

    const capacities: GroupCap[] = groups.map((g) => {
      const current = (g.students ?? []).length;
      const max =
        (g as any).advisorId?.maxStudents &&
        Number((g as any).advisorId.maxStudents) > 0
          ? Number((g as any).advisorId.maxStudents)
          : 0;
      const capacityLeft = Math.max(0, max - current);
      return {
        groupId: g._id as Schema.Types.ObjectId,
        advisorDocId: (g as any).advisorId?._id as Schema.Types.ObjectId,
        current,
        max,
        capacityLeft,
      };
    });

    const totalCapacityLeft = capacities.reduce(
      (sum, c) => sum + c.capacityLeft,
      0
    );

    if (totalCapacityLeft === 0) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        {
          msg: "Các lớp giảng viên hướng dẫn đã đạt số lượng tối đa.",
          remainingUnassignedCount: unassigned.length,
        },
        { status: 200 }
      );
    }

    const queue = [...unassigned];
    const assignmentsByGroup = new Map<string, string[]>();

    for (const cap of capacities) {
      if (cap.capacityLeft <= 0) continue;
      if (!queue.length) break;

      const take = Math.min(cap.capacityLeft, queue.length);
      const picked = queue.splice(0, take);
      assignmentsByGroup.set(cap.groupId.toString(), picked);
    }

    const leftover = queue;

    const bulkOps = [];
    for (const [groupId, studentIds] of assignmentsByGroup) {
      if (!studentIds.length) continue;
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(groupId) },
          update: {
            $addToSet: {
              students: {
                $each: studentIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
            },
          },
        },
      });
    }

    if (bulkOps.length) {
      await advisor_group.bulkWrite(bulkOps, { session });
    }

    const assignedSummary = Array.from(assignmentsByGroup.entries()).map(
      ([groupId, students]) => ({
        groupId,
        assignedCount: students.length,
      })
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      {
        msg: "Chia sinh viên tự động thành công.",
        assigned: assignedSummary,
        totalAssigned: assignedSummary.reduce((s, a) => s + a.assignedCount, 0),
        remainingUnassignedCount: leftover.length,
        remainingUnassigned: leftover,
      },
      { status: 200 }
    );
  } catch (e) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  } finally {
    if (session) session.endSession();
  }
}
