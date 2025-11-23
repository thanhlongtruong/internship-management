import { NextResponse } from "next/server";

import mongoose, { Types, FilterQuery } from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import { PublishFileSchema } from "@/utils/publish-file-schema";

import { removeAccents } from "@/utils/remove-accents";

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
    const idAG = searchParams.get("idAG");
    const idA = searchParams.get("idA");
    const idT = searchParams.get("idT");

    if (!idAG || !idA || !idT) {
      return NextResponse.json(
        { msg: "Thiếu thông tin cần thiết để xuất điểm." },
        { status: 400 }
      );
    }

    const rows = await advisor_group.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(idAG),
          lecturerId: new Types.ObjectId(String(User._id)),
        },
      },
      {
        $project: {
          students: 1,
          lecturerId: 1,
          announcements: 1,
          schoolYear: 1,
          semester: 1,
          cohort: 1,
          faculty: 1,
        },
      },
      { $unwind: "$announcements" },
      {
        $match: { "announcements._id": new Types.ObjectId(idA) },
      },
      { $unwind: "$announcements.title" },
      {
        $match: { "announcements.title._id": new Types.ObjectId(idT) },
      },
      {
        $project: {
          students: 1,
          lecturerId: 1,
          submissions: "$announcements.title.submissions",
          schoolYear: 1,
          semester: 1,
          cohort: 1,
          faculty: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "students",
          foreignField: "_id",
          as: "studentsDetail",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { lid: "$lecturerId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$lid"] } } },
            { $project: { _id: 1, name: 1, email: 1 } },
          ],
          as: "lecturer",
        },
      },
      { $unwind: "$lecturer" },
      {
        $project: {
          _id: 0,
          lecturer: 1,
          students: "$studentsDetail",
          submissions: 1,
          schoolYear: 1,
          semester: 1,
          cohort: 1,
          faculty: 1,
        },
      },
      { $limit: 1 },
    ]);

    if (!rows.length) {
      return NextResponse.json(
        { msg: "Không tìm thấy dữ liệu trong lớp thực tập này để xuất điểm." },
        { status: 404 }
      );
    }

    const {
      lecturer,
      students,
      submissions,
      schoolYear,
      semester,
      cohort,
      faculty,
    } = rows[0] as {
      lecturer: { name: string; email: string };
      students: { _id: Types.ObjectId; name: string; email: string }[];
      submissions: { studentId: Types.ObjectId; score: number }[];
      schoolYear: string;
      semester: string;
      cohort: string;
      faculty: string;
    };

    const scoreByStudent = new Map<string, number>();

    for (const sub of submissions || []) {
      scoreByStudent.set(
        String(sub.studentId),
        typeof sub.score === "number" ? (sub.score === -1 ? 0 : sub.score) : 0
      );
    }

    const exportRows = students.map((s) => ({
      "Tên sinh viên": s.name,
      "Email sinh viên": s.email,
      "Loại thực tập": "Làm đồ án thay thế",
      "Tên giảng viên hướng dẫn": lecturer?.name ?? "",
      "Email giảng viên hướng dẫn": lecturer?.email ?? "",
      "Học kỳ": semester,
      "Năm học": schoolYear,
      Khóa: cohort,
      Khoa: faculty,
      Điểm: scoreByStudent.get(String(s._id)) ?? 0,
    }));

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, "DiemSinhVien");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const removeAccentsFaculty = removeAccents(faculty);

    const fileName = `diem_sinh_vien_${schoolYear}_${semester}_${cohort}_${removeAccentsFaculty}_${Date.now()}.xlsx`;

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${fileName}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
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

    const validatedData = PublishFileSchema.safeParse(data);

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

    const { files } = validatedData.data;

    if (files.length !== 1) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Chỉ được chọn 1 tệp đính kèm." },
        { status: 400 }
      );
    }

    if (!data?.idAG || !data?.idA || !data?.idT) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu các thông tin cần thiết để publish file điểm." },
        { status: 400 }
      );
    }

    const queryTitle: FilterQuery<IAdvisorGroup> = {
      _id: new Types.ObjectId(data.idAG as string),
      lecturerId: User._id,
      "announcements._id": new Types.ObjectId(data.idA as string),
      "announcements.title._id": new Types.ObjectId(data.idT as string),
    };

    const existTitle = await advisor_group
      .findOne(queryTitle)
      .select("_id lecturerId")
      .session(session);

    if (!existTitle) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy assignment để xuất điểm." },
        { status: 404 }
      );
    }

    if (String(existTitle.lecturerId) !== String(User._id)) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không có quyền với lớp thực tập này." },
        { status: 400 }
      );
    }

    await advisor_group.updateOne(
      { _id: existTitle._id },
      {
        $set: {
          "announcements.$[a].title.$[t].publishedFile": files[0],
        },
      },
      {
        arrayFilters: [
          { "a._id": new Types.ObjectId(data.idA as string) },
          { "t._id": new Types.ObjectId(data.idT as string) },
        ],
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      { msg: "Publish file điểm thành công." },
      { status: 200 }
    );
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    return NextResponse.json({ success: false, error }, { status: 500 });
  } finally {
    if (session) session.endSession();
  }
}
