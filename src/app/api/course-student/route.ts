import mongoose, { FilterQuery, Types } from "mongoose";

import { connectDB } from "@/lib/connectDB";

import { verifyAuth } from "@/utils/verify-auth";

import { NextResponse } from "next/server";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import { SubmitAssignmentSchema } from "@/utils/submit-assignment-schema";

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

    const data = await req.json();

    const validatedData = SubmitAssignmentSchema.safeParse(data);

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

    if (!data?.idAdvisorGroup || !data?.idAssignment || !data?.idTitle) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Thiếu các thông tin cần thiết để lưu nộp bài." },
        { status: 400 }
      );
    }

    const queryTitle: FilterQuery<IAdvisorGroup> = {
      _id: new Types.ObjectId(data.idAdvisorGroup as string),
      students: User._id,
      "announcements._id": new Types.ObjectId(data.idAssignment as string),
      "announcements.title._id": new Types.ObjectId(data.idTitle as string),
    };

    const existTitle = await advisor_group.findOne(queryTitle);

    if (!existTitle) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      session?.endSession();
      return NextResponse.json(
        { msg: "Không tìm thấy phần nộp bài trong assignment này." },
        { status: 404 }
      );
    }

    await advisor_group.updateOne(
      { _id: data.idAdvisorGroup },
      {
        $set: {
          "announcements.$[a].title.$[t].submissions": {
            studentId: User._id,
            file: validatedData.data.files,
          },
        },
      },
      {
        arrayFilters: [
          { "a._id": new Types.ObjectId(data.idAssignment as string) },
          { "t._id": new Types.ObjectId(data.idTitle as string) },
        ],
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ msg: "Nộp bài thành công." }, { status: 200 });
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    return NextResponse.json({ success: false, error: error }, { status: 500 });
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
//     const schoolYear = searchParams.get("schoolYear");
//     const semester = searchParams.get("semester");

//     if (!schoolYear || !semester) {
//       return NextResponse.json(
//         { success: false, msg: "Thiếu thông tin" },
//         { status: 400 }
//       );
//     }

//     const foundMajor = Major.find((m) => m.value === User.major);

//     if (!foundMajor) {
//       return NextResponse.json(
//         { success: false, msg: "Không tìm thấy ngành của bạn." },
//         { status: 404 }
//       );
//     }
//     const faculty = Faculty.find((f) => f.id === foundMajor?.faculty);
//     if (!faculty) {
//       return NextResponse.json(
//         {
//           success: false,
//           msg: "Không tìm thấy khoa của bạn.",
//         },
//         { status: 404 }
//       );
//     }
//     const queryAdvisorGroup: FilterQuery<IAdvisorGroup> = {
//       schoolYear: schoolYear,
//       semester: semester,
//       cohort: User.cohort,
//       faculty: faculty.value,
//       students: User._id,
//     };

//     const advisorGroup = await advisor_group
//       .findOne(queryAdvisorGroup)
//       .select("lecturerId announcements")
//       .populate("lecturerId", "name email faculty -_id")
//       .lean<IAdvisorGroup>();

//     if (!advisorGroup) {
//       return NextResponse.json(
//         {
//           success: false,
//           lecturer: null,
//           announcements: [],
//         },
//         { status: 404 }
//       );
//     }

//     const customAnnouncements = advisorGroup.announcements.map(
//       (announcement) => {
//         const { title, ...restAnnouncement } = announcement;
//         return {
//           ...restAnnouncement,
//           title: title.map((t) => {
//             const { submissions, ...restTitle } = t;
//             const hasSubmitted = submissions.some(
//               (submission) =>
//                 submission.studentId.toString() === User._id?.toString()
//             );

//             const filesSubmitted =
//               submissions.find(
//                 (submission) =>
//                   submission.studentId.toString() === User._id?.toString()
//               )?.file ?? [];

//             return {
//               ...restTitle,
//               hasSubmitted: hasSubmitted,
//               filesSubmitted: filesSubmitted,
//             };
//           }),
//         };
//       }
//     );

//     return NextResponse.json(
//       {
//         id: advisorGroup._id,
//         lecturer: advisorGroup.lecturerId,
//         announcements: customAnnouncements,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     return NextResponse.json({ success: false, msg: error }, { status: 500 });
//   }
// }
