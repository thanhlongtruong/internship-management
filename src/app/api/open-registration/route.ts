import { connectDB } from "@/lib/connectDB";
import { verifyAuth } from "@/utils/verify-auth";
import { NextResponse } from "next/server";
import open_registration, { IOpenRegistration } from "@/models/open-course";
import registration_result from "@/models/registration-result";
import { OpenRegistrationSchema } from "@/utils/open-registration-schema";

import { isEqual } from "lodash";
import { generateCohorts, generateYears } from "@/utils/generate-years-cohorts";
import { Types } from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role !== "pdt") {
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const data = OpenRegistrationSchema.safeParse(body);

    if (data.error) {
      return NextResponse.json(
        { msg: data.error.issues[0].message },
        { status: 400 }
      );
    }

    const overlapping = await open_registration.findOne({
      $and: [
        {
          $or: [
            {
              timeStart: { $lt: data.data.timeEnd },
              timeEnd: { $gt: data.data.timeStart },
            },
          ],
        },
        {
          createdBy: User._id,
        },
        {
          schoolYear: data.data.schoolYear,
        },
        {
          semester: data.data.semester,
        },
        {
          cohort: data.data.cohort,
        },
        {
          "major.name": { $in: data.data.major.map((m: any) => m.name) },
        },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        {
          msg: "Đợt đăng ký này đã trùng với đợt đăng ký khác.",
        },
        { status: 400 }
      );
    }

    const openRegistration = await open_registration.create({
      ...data.data,
      createdBy: User._id,
    });

    if (!openRegistration) {
      return NextResponse.json(
        { msg: "Tạo thời gian đăng ký thực tập thất bại." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { msg: "Tạo thời gian đăng ký thực tập thành công." },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role != "pdt") {
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const { dataCourse, courseId } = await req.json();

    const parsed = OpenRegistrationSchema.safeParse(dataCourse);

    if (parsed.error) {
      return NextResponse.json(
        { msg: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const findCourse = await open_registration
      .findById(courseId)
      .select("timeStart timeEnd semester schoolYear cohort major -_id")
      .lean<IOpenRegistration>();

    if (!findCourse) {
      return NextResponse.json(
        { msg: "Không tìm thấy đợt đăng ký này." },
        { status: 404 }
      );
    }

    if (isEqual(parsed.data, findCourse))
      return NextResponse.json(
        { msg: "Không có thông tin nào thay đổi." },
        { status: 200 }
      );

    await open_registration
      .findByIdAndUpdate(courseId, parsed.data)
      .select("_id")
      .lean<IOpenRegistration>();

    return NextResponse.json({ msg: "Cập nhật thành công." }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const now = new Date();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    if (User.role != "pdt") {
      return NextResponse.json(
        { msg: "Bạn không có quyền thực hiện chức năng này." },
        { status: 400 }
      );
    }

    const { courseId } = await req.json();

    const findCourse = await open_registration
      .findById(courseId)
      .select("_id timeStart timeEnd")
      .lean<IOpenRegistration>();

    if (!findCourse) {
      return NextResponse.json(
        { msg: "Không tìm thấy đợt đăng ký này." },
        { status: 404 }
      );
    }

    const start = new Date(findCourse.timeStart);
    const end = new Date(findCourse.timeEnd);

    if (now >= start && now <= end) {
      return NextResponse.json(
        { msg: "Bạn không thể xóa khi đăng ký đang mở." },
        { status: 400 }
      );
    }

    await open_registration.findByIdAndDelete(courseId);

    await registration_result.deleteMany({
      courseId: Types.ObjectId.createFromHexString(courseId),
    });

    return NextResponse.json({ msg: "Xóa thành công." }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  }
}

// export async function GET(req: Request) {
//   try {
//     await connectDB();

//     const result = await verifyAuth();

//     if (result instanceof Response) return result;

//     const { User } = result;

//     if (User.role === "sv") {
//       return NextResponse.json(
//         { msg: "Bạn không có quyền thực hiện chức năng này." },
//         { status: 400 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const year = searchParams.get("year") ?? generateYears(2000).at(-1) ?? "";
//     const semester = searchParams.get("semester") ?? "1";
//     const cohort =
//       searchParams.get("cohort") ?? generateCohorts(2020).at(1) ?? "";

//     const courses = await open_registration
//       .find({
//         schoolYear: year,
//         semester: semester,
//         cohort: cohort,
//       })
//       .select("-__v -updatedAt")
//       .sort({ createdAt: -1 })
//       .lean<IOpenRegistration>();

//     return NextResponse.json({ courses: courses }, { status: 200 });
//   } catch (e) {
//     return NextResponse.json({ success: false, error: e }, { status: 500 });
//   }
// }
