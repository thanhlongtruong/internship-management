import mongoose, { PipelineStage, Schema } from "mongoose";

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/connectDB";

import user, { IUser } from "@/models/user";

import notification, {
  INotification,
  NotificationType,
} from "@/models/notification";

import training_advisor, { ITrainingAdvisor } from "@/models/training_advisor";

import registration_result, {
  IRegistrationResult,
} from "@/models/registration-result";

import open_course from "@/models/open-course";

import advisor_group, { IAdvisorGroup } from "@/models/advisor_group";

import pushSubscription from "@/models/push-subscription";

import { RoleDetail } from "@/utils/role";

import webpush from "web-push";

import { verifyAuth } from "@/utils/verify-auth";

import { Major } from "@/utils/major";
import { Faculty } from "@/utils/faculty";

const notificationHandlers = {
  [NotificationType.SRTJ]: handleSendRequestToJoin,
  [NotificationType.ARTJ]: handleAnswerRequestToJoin,
  [NotificationType.SITJ_PDT]: handleSendInvitationToJoinPDT,
  [NotificationType.AITJ_PDT]: handleAnswerInvitationToJoinPDT,
  [NotificationType.SRT_ADVISOR]: handleSendRequestToAdvisor,
  [NotificationType.ART_ADVISOR]: handleAnswerRequestToAdvisor,
  [NotificationType.UNDO_SRT_ADVISOR]: handleUndoSendRequestToAdvisor,
  [NotificationType.CUSTOM_NOTIFICATION]: handleSendCustomNotification,
};

async function handleSendRequestToJoin(
  currentUser: IUser,
  body: { code_pdt?: string }
) {
  const { code_pdt } = body;
  if (!code_pdt) {
    throw { status: 400, msg: "Thiếu mã Phòng đào tạo." };
  }
  const checkPDT = await user.findOne({ code: code_pdt }).lean<IUser>();
  if (!checkPDT) {
    throw { status: 404, msg: "Mã Phòng đào tạo không tồn tại." };
  }
  const checkNotify = await notification.findOne({
    sender: currentUser._id,
    receiver: checkPDT._id,
    type_notify: NotificationType.SRTJ,
    reply: "none",
  });
  if (checkNotify) {
    throw {
      status: 200,
      msg: "Bạn đã gửi yêu cầu trước đó. Vui lòng chờ PDT phản hồi.",
    };
  }

  const { _id, pdt, ...restCurrentUser } = currentUser;

  const notificationData = {
    type_notify: NotificationType.SRTJ,
    sender: currentUser._id,
    title: `${RoleDetail[currentUser.role]} gửi yêu cầu tham gia PDT`,
    message: `Nhấn vào đây để xem thông tin của ${
      RoleDetail[currentUser.role]
    }.`,
    data: restCurrentUser,
    receiver: [checkPDT._id],
    btns: [
      { label: "Từ chối", action: "reject" },
      { label: "Chấp nhận", action: "accept" },
    ],
    action: "open_dialog",
  };
  const successMessage = "Gửi yêu cầu";
  return { notificationData, successMessage };
}

async function handleAnswerRequestToJoin(
  currentUser: IUser,
  body: { noti_id?: string; action?: string },
  session: mongoose.ClientSession
) {
  const { noti_id, action } = body;
  if (!noti_id || !action || (action !== "accept" && action !== "reject")) {
    throw { status: 400, msg: "Payload không hợp lệ." };
  }

  const note = action === "accept" ? "accepted" : "rejected";

  const originalNoti = await notification
    .findOneAndUpdate(
      { _id: noti_id, reply: { $ne: "answered" } },
      { $set: { reply: "answered", note: note } },
      { new: true, session }
    )
    .select("_id sender")
    .lean<INotification>();

  if (!originalNoti) {
    throw {
      status: 400,
      msg: "Thông báo không tồn tại hoặc đã được trả lời trước đó.",
    };
  }

  let message = "PDT đã từ chối yêu cầu tham gia của bạn.";
  let successMessage = "Từ chối yêu cầu";

  if (action === "accept") {
    await user.findByIdAndUpdate(
      originalNoti.sender,
      { pdt: currentUser._id },
      { new: true, session }
    );
    message = "PDT đã chấp nhận yêu cầu tham gia của bạn.";
    successMessage = "Chấp nhận yêu cầu";
  }

  const notificationData = {
    type_notify: NotificationType.ARTJ,
    sender: currentUser._id,
    title: "Phòng đào tạo",
    message: message,
    receiver: [originalNoti.sender],
    note: note,
  };

  return { notificationData, successMessage };
}

async function handleSendInvitationToJoinPDT(
  currentUser: IUser,
  body: { receiver?: string[] }
) {
  const { receiver } = body;

  if (currentUser.role !== "pdt") {
    throw {
      status: 403,
      msg: "Bạn không có quyền thực hiện chức năng này.",
    };
  }
  if (!receiver || !Array.isArray(receiver) || receiver.length === 0) {
    throw { status: 400, msg: "Thiếu danh sách người nhận." };
  }

  const users = await user
    .find({ email: { $in: receiver, $ne: "pdt" } })
    .select("_id pdt")
    .lean<IUser[]>();

  const receiverIds = users.map((u) => u._id);

  const notificationData = {
    type_notify: NotificationType.SITJ_PDT,
    sender: currentUser._id,
    title: `Phòng đào tạo gửi lời mời tham gia`,
    message: `Bạn được mời tham gia vào PDT. Nhấn vào đây để xem thông tin.`,
    data: {
      role: currentUser.role,
      school: currentUser.school,
      email: currentUser.email,
      code: currentUser.code,
    },
    receiver: receiverIds,
    btns: [
      { label: "Từ chối", action: "reject" },
      { label: "Tham gia", action: "accept" },
    ],
    action: "open_dialog",
  };
  const successMessage = "Gửi lời mời";
  return { notificationData, successMessage };
}

async function handleAnswerInvitationToJoinPDT(
  currentUser: IUser,
  body: { noti_id?: string; action?: string },
  session: mongoose.ClientSession
) {
  const { noti_id, action } = body;
  if (!noti_id || !action || (action !== "accept" && action !== "reject")) {
    throw { status: 400, msg: "Payload không hợp lệ." };
  }

  const note = action === "accept" ? "accepted" : "rejected";

  const originalNoti = await notification
    .findOneAndUpdate(
      { _id: noti_id, reply: { $ne: "answered" } },
      { $set: { reply: "answered", note: note } },
      { new: true, session }
    )
    .select("_id sender")
    .lean<INotification>();

  if (!originalNoti) {
    throw {
      status: 400,
      msg: "Thông báo không tồn tại hoặc đã được trả lời trước đó.",
    };
  }

  let message = `${currentUser.email} đã từ chối tham gia.`;
  let successMessage = "Từ chối tham gia";

  if (action === "accept") {
    await user.findByIdAndUpdate(
      currentUser._id,
      { pdt: originalNoti.sender },
      { new: true, session }
    );
    message = `${currentUser.email} đã chấp nhận lời mời tham gia.`;
    successMessage = "Chấp nhận tham gia";
  }

  const notificationData = {
    type_notify: NotificationType.AITJ_PDT,
    sender: currentUser._id,
    title: "Lời mời tham gia PDT",
    message: message,
    receiver: [originalNoti.sender],
    note: note,
  };

  return { notificationData, successMessage };
}

async function handleSendRequestToAdvisor(
  currentUser: IUser,
  body: { receiver?: string[]; yearSchool?: string; semester?: string }
) {
  const { receiver, yearSchool, semester } = body;

  if (currentUser.role !== "sv") {
    throw {
      status: 400,
      msg: "Bạn không có quyền thực hiện chức năng này.",
    };
  }

  if (!receiver || !Array.isArray(receiver) || receiver.length === 0) {
    throw { status: 400, msg: "Thiếu danh sách người nhận." };
  }

  if (receiver.length > 1) {
    throw { status: 400, msg: "Chỉ được gửi yêu cầu đến một giảng viên." };
  }

  if (!yearSchool || !semester) {
    throw { status: 400, msg: "Thiếu thông tin năm học và học kỳ." };
  }

  const receiverUser = await user
    .findOne({ email: receiver[0], role: "gv" })
    .select("_id faculty")
    .lean<IUser>();

  if (!receiverUser) {
    throw { status: 404, msg: "Người nhận không tồn tại." };
  }

  const checkAllTrainingAdvisors = await training_advisor
    .find({
      schoolYear: yearSchool,
      semester: semester,
      cohort: currentUser.cohort,
      faculty: receiverUser.faculty,
    })
    .select("-_id assignedStudents")
    .lean<ITrainingAdvisor[]>();

  if (checkAllTrainingAdvisors.length === 0) {
    throw {
      status: 404,
      msg: `Không tìm thấy danh sách Giảng viên hướng dẫn trong ${yearSchool} học kỳ ${semester} khóa ${currentUser.cohort} khoa ${receiverUser.faculty}.`,
    };
  }

  const major = Major.find((m) => m.value === currentUser.major);

  if (!major) {
    throw {
      status: 404,
      msg: `Không tìm thấy ngành của bạn.`,
    };
  }
  const faculty = Faculty.find((f) => f.id === major.faculty);

  if (!faculty) {
    throw {
      status: 404,
      msg: `Không tìm thấy khoa của bạn.`,
    };
  }

  const checkAdvisorGroup = await advisor_group
    .find({
      schoolYear: yearSchool,
      semester: semester,
      cohort: currentUser.cohort,
      faculty: faculty.value,
    })
    .select("students")
    .lean<{ students: Schema.Types.ObjectId[] }[]>();

  const isAssignedAdvisorGroup = checkAdvisorGroup.some((advisor) =>
    advisor.students.some((id) => id.toString() === currentUser._id?.toString())
  );

  if (isAssignedAdvisorGroup) {
    throw {
      status: 400,
      msg: `Bạn đã có lớp thực tập trong ${yearSchool} học kỳ ${semester}.`,
    };
  }

  const isAssigned = checkAllTrainingAdvisors.some((advisor) =>
    advisor.assignedStudents.some(
      (id) => id.toString() === currentUser._id?.toString()
    )
  );

  if (isAssigned) {
    throw {
      status: 400,
      msg: `Bạn đã có Giảng viên hướng dẫn trong ${yearSchool} học kỳ ${semester}.`,
    };
  }
  const checkNotify = await notification.findOne({
    sender: currentUser._id,
    receiver: receiverUser._id,
    type_notify: NotificationType.SRT_ADVISOR,
    reply: "none",
  });

  if (checkNotify) {
    throw {
      status: 200,
      msg: "Bạn đã gửi yêu cầu trước đó. Vui lòng chờ GV phản hồi.",
    };
  }

  const checkAnotherNotify = await notification.find({
    sender: currentUser._id,
    type_notify: NotificationType.SRT_ADVISOR,
    reply: "none",
  });

  if (checkAnotherNotify.length > 0) {
    throw {
      status: 400,
      msg: "Bạn đã gửi yêu cầu đến giảng viên khác và chưa được phản hồi. Bạn có muốn hủy yêu cầu trước đó để gửi đến giảng viên hướng dẫn mới không?",
      action: "undo-send-request-to-advisor",
      noti_id: checkAnotherNotify[0]._id,
    };
  }

  const checkTrainingAdvisor = await training_advisor
    .findOne({
      lecturerId: receiverUser._id,
      schoolYear: yearSchool,
      semester: semester,
      cohort: currentUser.cohort,
      faculty: receiverUser.faculty,
    })
    .select("_id assignedStudents maxStudents studentSelectDeadline")
    .lean<ITrainingAdvisor>();

  if (!checkTrainingAdvisor) {
    throw {
      status: 400,
      msg: "Giảng viên này chưa được phân công làm GVHD trong thời gian hiện tại.",
    };
  }

  const now = new Date();

  if (now > checkTrainingAdvisor.studentSelectDeadline) {
    throw {
      status: 400,
      msg: "Đã quá thời gian chọn giảng viên hướng dẫn.",
    };
  }

  if (
    checkTrainingAdvisor.assignedStudents.length >=
    checkTrainingAdvisor.maxStudents
  ) {
    throw {
      status: 400,
      msg: "Giảng viên này đã đạt số lượng tối đa.",
    };
  }

  const { _id, pdt, ...restCurrentUser } = currentUser;

  const notificationData = {
    type_notify: NotificationType.SRT_ADVISOR,
    sender: currentUser._id,
    title: "Yêu cầu làm Giảng viên hướng dẫn",
    message: `${RoleDetail[currentUser.role]} ${
      currentUser.name
    } đã gửi yêu cầu đến bạn để làm Giảng viên hướng dẫn cho năm học ${yearSchool} học kỳ ${semester} khóa ${
      currentUser.cohort
    }. Nhấn vào đây để xem thông tin.`,
    data: {
      ...restCurrentUser,
      trainingAdvisorId: checkTrainingAdvisor._id,
    },
    receiver: [receiverUser._id],
    btns: [
      { label: "Từ chối", action: "reject" },
      { label: "Chấp nhận", action: "accept" },
    ],
    action: "open_dialog",
  };

  const successMessage = "Gửi yêu cầu";

  return { notificationData, successMessage };
}

async function handleAnswerRequestToAdvisor(
  currentUser: IUser,
  body: { noti_id?: string; action?: string },
  session: mongoose.ClientSession
) {
  const { noti_id, action } = body;

  if (!noti_id || !action || (action !== "accept" && action !== "reject")) {
    throw { status: 400, msg: "Payload không hợp lệ." };
  }

  const note = action === "accept" ? "accepted" : "rejected";

  const originalNoti = await notification
    .findOneAndUpdate(
      { _id: noti_id, reply: { $ne: "answered" } },
      { $set: { reply: "answered", note: note } },
      { new: true, session }
    )
    .select("_id sender data")
    .lean<INotification>();

  if (!originalNoti) {
    throw {
      status: 400,
      msg: "Thông báo không tồn tại hoặc đã được trả lời trước đó.",
    };
  }

  let message = "Giảng viên đã từ chối yêu cầu làm GVHD cho bạn.";
  let successMessage = "Từ chối yêu cầu";

  if (action === "accept") {
    await training_advisor.findByIdAndUpdate(
      originalNoti.data.trainingAdvisorId,
      { $push: { assignedStudents: originalNoti.sender } },
      { new: true, session }
    );
    message = "Giảng viên đã chấp nhận yêu cầu làm GVHD cho bạn.";
    successMessage = "Chấp nhận yêu cầu";
  }

  const notificationData = {
    type_notify: NotificationType.ART_ADVISOR,
    sender: currentUser._id,
    title: `GVHD ${currentUser.name}`,
    message: message,
    receiver: [originalNoti.sender],
    note: note,
  };

  return { notificationData, successMessage };
}

async function handleUndoSendRequestToAdvisor(
  currentUser: IUser,
  body: { noti_id?: string },
  session: mongoose.ClientSession
) {
  const { noti_id } = body;

  const originalNoti = await notification
    .findById(noti_id)
    .select("_id reply note")
    .lean<INotification>();

  if (!originalNoti) {
    throw {
      status: 400,
      msg: "Yêu cầu không tồn tại.",
    };
  }

  if (originalNoti.reply !== "answered" && originalNoti.note !== "accepted") {
    await notification.findByIdAndDelete(originalNoti._id, {
      session,
    });

    let message =
      "Bạn đã hủy yêu cầu gửi đến Giảng viên hướng dẫn. Bạn có thể gửi yêu cầu đến giảng viên hướng dẫn mới.";
    let successMessage = "Hủy yêu cầu";

    const notificationData = {
      type_notify: NotificationType.UNDO_SRT_ADVISOR,
      sender: currentUser._id,
      title: "Hủy yêu cầu",
      message: message,
      receiver: [currentUser._id],
    };

    return { notificationData, successMessage };
  } else
    throw {
      status: 400,
      msg: "Hủy yêu cầu không thành công.",
    };
}

async function handleSendCustomNotification(
  currentUser: IUser,
  body: {
    title: string;
    message: string;
    target: string;
    from: "bcn" | "advisor";
    schoolYear: string;
    semester: string;
    cohort: string;
    files: {
      url: string;
      name: string;
    }[];
  }
) {
  const { title, message, target, from, schoolYear, semester, cohort, files } =
    body;

  if (
    !title ||
    !message ||
    !target ||
    !from ||
    !schoolYear ||
    !semester ||
    !cohort
  ) {
    throw { status: 400, msg: "Thiếu thông tin." };
  }

  if (from !== "bcn" && from !== "advisor") {
    throw { status: 400, msg: "Người gửi không hợp lệ." };
  }

  if (currentUser.role !== "bcn" && currentUser.role !== "gv") {
    throw { status: 400, msg: "Người gửi không hợp lệ." };
  }

  if (from === "bcn" && currentUser.role === "bcn") {
    if (target !== "advisors" && target !== "students" && target !== "both") {
      throw { status: 400, msg: "Target không hợp lệ." };
    }

    let advisors: { lecturerId: Schema.Types.ObjectId }[] = [];
    let students: { studentId: Schema.Types.ObjectId }[] = [];

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
        },
      },
      {
        $project: {
          _id: 0,
          studentId: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    if (target === "advisors") {
      advisors = await training_advisor
        .find({
          schoolYear: schoolYear,
          semester: semester,
          cohort: cohort,
        })
        .select("-_id lecturerId")
        .lean<{ lecturerId: Schema.Types.ObjectId }[]>();
    }
    if (target === "students") {
      students = (await registration_result.aggregate(pipeline)) as {
        studentId: Schema.Types.ObjectId;
      }[];
    }
    if (target === "both") {
      [advisors, students] = await Promise.all([
        training_advisor
          .find({
            schoolYear: schoolYear,
            semester: semester,
            cohort: cohort,
          })
          .select("-_id lecturerId")
          .lean<{ lecturerId: Schema.Types.ObjectId }[]>(),

        registration_result.aggregate(pipeline),
      ]);
    }

    if (target === "advisors" && advisors.length === 0) {
      throw {
        status: 400,
        msg: `Không tìm thấy giảng viên hướng dẫn trong ${schoolYear} học kỳ ${semester} khóa ${cohort}.`,
      };
    }
    if (target === "students" && students.length === 0) {
      throw {
        status: 400,
        msg: `Không tìm thấy sinh viên đã đăng ký môn trong ${schoolYear} học kỳ ${semester} khóa ${cohort}.`,
      };
    }
    if (target === "both" && advisors.length === 0 && students.length === 0) {
      throw {
        status: 400,
        msg: `Không tìm thấy giảng viên hướng dẫn và sinh viên đã đăng ký môn trong ${schoolYear} học kỳ ${semester} khóa ${cohort}.`,
      };
    }

    const notificationData = {
      type_notify: NotificationType.CUSTOM_NOTIFICATION,
      sender: currentUser._id,
      title: title,
      message: message,
      receiver: [
        ...advisors.map((advisor) => advisor.lecturerId),
        ...students.map((student) => student.studentId),
      ],
      note: `${currentUser.role} đã gửi.`,
      files: files || [],
    };
    return { notificationData, successMessage: "Gửi thông báo" };
  } else if (from === "advisor" && currentUser.role === "gv") {
    if (target !== "bcn" && target !== "students" && target !== "both") {
      throw { status: 400, msg: "Target không hợp lệ." };
    }

    let bcn: Schema.Types.ObjectId[] = [];
    let students: Schema.Types.ObjectId[] = [];

    const advisorGroup = await advisor_group
      .findOne({
        schoolYear: schoolYear,
        semester: semester,
        cohort: cohort,
        lecturerId: currentUser._id,
      })
      .select("students _id advisorId")
      .populate({
        path: "advisorId",
        select: "createdBy -_id",
        model: training_advisor,
        options: { lean: true },
      })
      .lean<{
        students: Schema.Types.ObjectId[];
        _id: Schema.Types.ObjectId;
        advisorId: { createdBy: Schema.Types.ObjectId };
      }>();

    if (!advisorGroup) {
      throw {
        status: 400,
        msg: `Không tìm thấy lớp thực tập trong ${schoolYear} học kỳ ${semester} khóa ${cohort} của bạn.`,
      };
    }

    if (target === "students" && advisorGroup.students.length === 0) {
      throw {
        status: 400,
        msg: `Không tìm thấy sinh viên nào trong lớp thực tập của bạn.`,
      };
    }

    if (target === "bcn" && !advisorGroup.advisorId.createdBy) {
      throw {
        status: 400,
        msg: `Không tìm thấy Ban chủ nhiệm trong lớp thực tập của bạn.`,
      };
    }

    if (
      target === "both" &&
      advisorGroup.students.length === 0 &&
      !advisorGroup.advisorId.createdBy
    ) {
      throw {
        status: 400,
        msg: `Không tìm thấy sinh viên nào và Ban chủ nhiệm trong lớp thực tập của bạn.`,
      };
    }

    bcn =
      target === "bcn" || target === "both"
        ? [advisorGroup.advisorId.createdBy]
        : [];

    students =
      target === "students" || target === "both" ? advisorGroup.students : [];

    const receiver = [...bcn, ...students];

    const notificationData = {
      type_notify: NotificationType.CUSTOM_NOTIFICATION,
      sender: currentUser._id,
      title: title,
      message: message,
      receiver: receiver,
      note: `${currentUser.role} đã gửi.`,
      files: files || [],
    };
    return { notificationData, successMessage: "Gửi thông báo" };
  } else {
    throw { status: 400, msg: "Người gửi không hợp lệ." };
  }
}

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    const body = await req.json();
    const handler = notificationHandlers[body.type as NotificationType];
    if (!handler) {
      throw { status: 400, msg: "Loại thông báo không hợp lệ." };
    }
    const { notificationData, successMessage } = await handler(
      User,
      body,
      session
    );

    const [notify] = await notification.create([notificationData], { session });

    if (!notify) {
      throw {
        status: 400,
        msg: `${successMessage} thất bại.`,
      };
    }

    await session.commitTransaction();
    session.endSession();

    const vapidKeys = {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    };

    webpush.setVapidDetails(
      "mailto:your-email@example.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    const subs = await pushSubscription.find({ userId: notify.receiver });

    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: "Website Quản lý thực tập",
        body: "Bạn có một thông báo mới!",
      });

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(sub, payload);
            return { success: true };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pushSubscription.deleteOne({ endpoint: sub.endpoint });
            }
          }
        })
      );
    }

    return NextResponse.json(
      {
        msg: `${successMessage} thành công.`,
      },
      { status: 200 }
    ); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    if (error.status) {
      return NextResponse.json(
        { msg: error.msg, action: error?.action, noti_id: error?.noti_id },
        { status: error.status }
      );
    }
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    const notify = await notification
      .find({ receiver: User._id })
      .select("-__v -updatedAt")
      .sort({ status_notify: -1, createdAt: -1 })
      .lean<INotification[]>();

    return NextResponse.json({ notify: notify }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    const { type, noti_id } = await req.json();

    if (type === "mark_all") {
      await notification.updateMany(
        { receiver: User._id, status_notify: "unread" },

        { $set: { status_notify: "seen" } }
      );
      return NextResponse.json(
        { success: true, msg: "Đã cập nhật tất cả thông báo." },
        { status: 200 }
      );
    } else if (type === "mark_one") {
      if (!noti_id) {
        return NextResponse.json(
          { success: false, msg: "Cần cung cấp noti _id." },
          { status: 400 }
        );
      }
      await notification
        .findByIdAndUpdate(noti_id, { status_notify: "seen" })
        .select("_id")
        .lean<INotification>();
    } else {
      return NextResponse.json(
        { success: false, msg: "Hành động không hợp lệ." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    await notification.deleteMany({ receiver: User._id });

    return NextResponse.json(
      { msg: "Xóa tất cả thông báo thành công." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
