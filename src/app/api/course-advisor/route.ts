import mongoose from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import { NextResponse } from "next/server";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import { AnnouncementSchema } from "@/utils/announcement-schema";

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

    const validatedData = AnnouncementSchema.safeParse(data);

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

    if (!data?.idAdvisorGroup) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu các thông tin cần tạo assignment." },
        { status: 400 }
      );
    }

    const advisorGroup = await advisor_group
      .findById(data.idAdvisorGroup)
      .session(session);

    if (!advisorGroup) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy lớp thực tập." },
        { status: 404 }
      );
    }

    if (
      validatedData.data.announcements_type === "internship_form" &&
      advisorGroup.announcements?.some(
        (a: any) => a.announcements_type === "internship_form"
      )
    ) {
      if (session && session.inTransaction()) await session.abortTransaction();
      session?.endSession();
      return NextResponse.json(
        {
          msg: "Đã tồn tại assignment loại 'Chọn hình thức thực tập' trong lớp thực tập này.",
        },
        { status: 400 }
      );
    }

    if (String(advisorGroup.lecturerId) !== String(User._id)) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không phải giáo viên hướng dẫn trong lớp thực tập này." },
        { status: 400 }
      );
    }

    const { title, ...rest } = validatedData.data;

    advisorGroup.announcements.push({
      ...rest,
      title: title.map((t: any) => ({
        title_name: t.title_name,
        content: t.content,
        files: t.files,
        ...(t.deadline ? { deadline: new Date(t.deadline) } : {}),
      })),
    } as any);

    await advisorGroup.save({ session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      { msg: "Tạo assignment thành công." },
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

export async function PATCH(req: Request) {
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

    if (!data?.idAdvisorGroup || !data?.idAnnouncement) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu các thông tin cần cập nhật assignment." },
        { status: 400 }
      );
    }

    const validatedData = AnnouncementSchema.safeParse(data);

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

    const advisorGroup = await advisor_group
      .findById(data.idAdvisorGroup)
      .select("_id lecturerId announcements")
      .session(session);

    if (!advisorGroup) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy lớp thực tập." },
        { status: 404 }
      );
    }

    if (validatedData.data.announcements_type === "internship_form") {
      const existed = advisorGroup.announcements?.some(
        (a: any) =>
          String(a._id) !== String(data.idAnnouncement) &&
          a.announcements_type === "internship_form"
      );
      if (existed) {
        if (session && session.inTransaction())
          await session.abortTransaction();
        session?.endSession();
        return NextResponse.json(
          {
            msg: "Đã tồn tại assignment loại 'Chọn hình thức thực tập' trong lớp thực tập này.",
          },
          { status: 400 }
        );
      }
    }

    if (String(advisorGroup.lecturerId) !== String(User._id)) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không phải giáo viên hướng dẫn trong lớp thực tập này." },
        { status: 400 }
      );
    }

    const currentAnnouncement = advisorGroup.announcements.find(
      (announcement: IAdvisorGroup["announcements"][number]) =>
        String(announcement._id) === String(data.idAnnouncement)
    );

    if (!currentAnnouncement) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy assignment cần cập nhật." },
        { status: 404 }
      );
    }

    const mergedAnnouncement = {
      ...(currentAnnouncement.toObject?.() ?? currentAnnouncement),
      ...validatedData.data,
      title:
        validatedData.data.title?.map((newTitle: any) => {
          const existingTitle = currentAnnouncement.title?.find(
            (t: IAdvisorGroup["announcements"][number]["title"][number]) =>
              String(t._id) === String(newTitle._id)
          );

          const { _id, ...restTitle } = newTitle;

          return {
            ...restTitle,
            files: newTitle.files || [],
            deadline: newTitle.deadline
              ? new Date(newTitle.deadline)
              : undefined,
            submissions: existingTitle?.submissions || [],
            createdAt: existingTitle?.createdAt || new Date(),
          };
        }) || currentAnnouncement.title,
      createdAt: currentAnnouncement.createdAt,
    };

    const updateResult = await advisor_group.updateOne(
      {
        _id: data.idAdvisorGroup,
        "announcements._id": data.idAnnouncement,
      },
      { $set: { "announcements.$": mergedAnnouncement } },
      { session }
    );

    if (!updateResult.matchedCount) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy assignment cần cập nhật." },
        { status: 404 }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      { msg: "Cập nhật assignment thành công." },
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

export async function DELETE(req: Request) {
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

    const { idAdvisorGroup, idAnnouncement } = await req.json();

    const advisorGroup = await advisor_group
      .findById(idAdvisorGroup)
      .select("_id lecturerId")
      .session(session);

    if (!advisorGroup) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy lớp thực tập cần xóa assignment." },
        { status: 404 }
      );
    }

    if (String(advisorGroup.lecturerId) !== String(User._id)) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Bạn không phải giáo viên hướng dẫn trong lớp thực tập này." },
        { status: 400 }
      );
    }

    const pullResult = await advisor_group.updateOne(
      { _id: idAdvisorGroup, "announcements._id": idAnnouncement },
      { $pull: { announcements: { _id: idAnnouncement } } },
      { session }
    );

    if (!pullResult.modifiedCount) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy assignment cần xoá." },
        { status: 404 }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(
      { msg: "Xóa assignment thành công." },
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
