import mongoose, { Types } from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import { NextResponse } from "next/server";

import advisor_group from "@/models/advisor_group";

import user, { IUser } from "@/models/user";

import { StudentsGradeSchema } from "@/utils/students-grade-schema";

export async function GET(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();
    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role !== "gv") {
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(req.url);

    const idAdvisorGroup = searchParams.get("idAG");
    const idAnnouncement = searchParams.get("idA");
    const idTitle = searchParams.get("idT");

    if (!idAdvisorGroup || !idAnnouncement || !idTitle) {
      return NextResponse.json(
        {
          success: false,
          msg: "Thiếu thông tin cần thiết để lấy danh sách sinh viên.",
        },
        { status: 400 }
      );
    }

    const advisorGroup = (await advisor_group.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(idAdvisorGroup as string),
          lecturerId: User._id,
        },
      },
      { $unwind: "$announcements" },
      {
        $match: {
          "announcements._id": new Types.ObjectId(idAnnouncement as string),
        },
      },
      { $unwind: "$announcements.title" },
      {
        $match: {
          "announcements.title._id": new Types.ObjectId(idTitle as string),
        },
      },
      {
        $project: {
          students: 1,
          submissions: "$announcements.title.submissions",
          publishedFile: "$announcements.title.publishedFile",
          submissionStudentIds: {
            $ifNull: ["$announcements.title.submissions.studentId", []],
          },
        },
      },
      {
        $addFields: {
          submittedIds: "$submissionStudentIds",
          notSubmittedIds: {
            $setDifference: ["$students", "$submissionStudentIds"],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$submittedIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $project: { _id: 1, name: 1, email: 1 } },
          ],
          as: "submittedStudents",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$notSubmittedIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $project: { _id: 1, name: 1, email: 1 } },
          ],
          as: "notSubmittedStudents",
        },
      },
      {
        $addFields: {
          submittedStudents: {
            $map: {
              input: "$submittedStudents",
              as: "s",
              in: {
                $mergeObjects: [
                  "$$s",
                  {
                    submission: {
                      $first: {
                        $filter: {
                          input: "$submissions",
                          as: "sub",
                          cond: { $eq: ["$$sub.studentId", "$$s._id"] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          notSubmittedStudents: {
            $map: {
              input: "$notSubmittedStudents",
              as: "s",
              in: {
                $mergeObjects: ["$$s", { submission: null }],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          submittedStudents: 1,
          notSubmittedStudents: 1,
          publishedFile: 1,
          counts: {
            total: { $size: "$students" },
            submitted: { $size: "$submittedIds" },
            notSubmitted: { $size: "$notSubmittedIds" },
          },
        },
      },
      { $limit: 1 },
    ])) as {
      submittedStudents: (IUser & {
        submission: {
          studentId: Types.ObjectId;
          file: { url: string; name: string }[];
          score: number;
          submittedAt: Date;
        } | null;
      })[];
      notSubmittedStudents: (IUser & { submission: null })[];
      publishedFile: { url: string; name: string } | null;
      counts: { total: number; submitted: number; notSubmitted: number };
    }[];

    if (!advisorGroup.length) {
      return NextResponse.json(
        {
          success: false,
          msg: "Không tìm thấy danh sách sinh viên.",
        },
        { status: 404 }
      );
    }

    const advisorGroupData = advisorGroup[0];

    return NextResponse.json(
      {
        submittedStudents: advisorGroupData.submittedStudents,
        notSubmittedStudents: advisorGroupData.notSubmittedStudents,
        counts: advisorGroupData.counts,
        publishedFile: advisorGroupData.publishedFile,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
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

    if (User.role !== "gv") {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }
    const data = await req.json();

    const validatedData = StudentsGradeSchema.safeParse(data);

    if (!validatedData.success) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!data?.idAG || !data?.idA || !data?.idT) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu các thông tin cần lưu điểm." },
        { status: 400 }
      );
    }

    const existTitle = await advisor_group
      .findOne({
        _id: new Types.ObjectId(data.idAG as string),
        lecturerId: User._id,
        "announcements._id": new Types.ObjectId(data.idA as string),
        "announcements.title._id": new Types.ObjectId(data.idT as string),
      })
      .session(session);

    if (!existTitle) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy assignment để lưu điểm." },
        { status: 404 }
      );
    }

    const { grades } = validatedData.data;

    const emails = grades.map((g) => g.email);

    const usersFound = await user
      .find({ email: { $in: emails } })
      .select("_id email")
      .session(session);

    if (usersFound.length !== grades.length) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Có sinh viên không hợp lệ." },
        { status: 400 }
      );
    }

    const emailToUserId = new Map<string, Types.ObjectId>();
    usersFound.forEach((u) =>
      emailToUserId.set(u.email, u._id as unknown as Types.ObjectId)
    );

    const bulkOps = grades
      .map(({ email, grade }) => {
        const studentId = emailToUserId.get(email);
        if (!studentId) return null;
        return {
          updateOne: {
            filter: {
              _id: new Types.ObjectId(data.idAG as string),
              lecturerId: new Types.ObjectId(String(User._id)),
              "announcements._id": new Types.ObjectId(data.idA as string),
              "announcements.title._id": new Types.ObjectId(data.idT as string),
            },
            update: {
              $set: {
                "announcements.$[a].title.$[t].submissions.$[s].score": grade,
              },
            },
            arrayFilters: [
              { "a._id": new Types.ObjectId(data.idA as string) },
              { "t._id": new Types.ObjectId(data.idT as string) },
              { "s.studentId": studentId },
            ],
          },
        };
      })
      .filter(Boolean) as any[];

    const resultBulk = await advisor_group.bulkWrite(bulkOps, {
      session,
      ordered: false,
    });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      {
        msg: "Lưu điểm thành công.",
        modifiedCount: resultBulk.modifiedCount,
        matchedCount: resultBulk.matchedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  } finally {
    if (session) session.endSession();
  }
}
