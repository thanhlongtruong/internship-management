import { NotificationType } from "@/models/notification";
import axios from "../Auth/Axios_Inceptor";
import { NotificationTarget_BCN, NotificationTarget_Advisor } from "@/components/dialog-send-notification";

export const SendNotifyJoinTrainingProgram = async ({
  code_pdt,
  noti_id,
  action,
}: {
  code_pdt?: string;
  noti_id?: string;
  action?: string;
}) => {
  return await axios.post("/notification", {
    code_pdt,
    noti_id,
    action,
    type: NotificationType.SRTJ,
  });
};

export const SendInvitationsToJoin = async (receiver: string[]) => {
  return await axios.post("/notification", {
    receiver,
    type: NotificationType.SITJ_PDT,
  });
};

export const AnswerNotify = async ({
  noti_id,
  action,
  type,
}: {
  noti_id: string;
  action: string;
  type: NotificationType;
}) => {
  return await axios.post("/notification", {
    noti_id,
    action,
    type,
  });
};

export const SendRequestToAdvisor = async ({
  receiver,
  yearSchool,
  semester,
}: {
  receiver: string[];
  yearSchool: string;
  semester: string;
}) => {
  return await axios.post("/notification", {
    receiver,
    yearSchool,
    semester,
    type: NotificationType.SRT_ADVISOR,
  });
};

export const AnswerRequestToAdvisor = async ({
  noti_id,
  action,
}: {
  noti_id: string;
  action: string;
}) => {
  return await axios.post("/notification", {
    noti_id,
    action,
    type: NotificationType.ART_ADVISOR,
  });
};

export const UndoSendRequestToAdvisor = async ({
  noti_id,
}: {
  noti_id: string;
}) => {
  return await axios.post("/notification", {
    noti_id,
    type: NotificationType.UNDO_SRT_ADVISOR,
  });
};

export const SendCustomNotification = async ({
  title,
  message,
  target,
  schoolYear,
  semester,
  cohort,
  from,
  files,
}: {
  title: string;
  message: string;
  target: NotificationTarget_BCN | NotificationTarget_Advisor;
  schoolYear: string;
  semester: string;
  cohort: string;
  from: "bcn" | "advisor";
  files: {
    url: string;
    name: string;
  }[];
}) => {
  return await axios.post("/notification", {
    title,
    message,
    target,
    schoolYear,
    semester,
    cohort,
    type: NotificationType.CUSTOM_NOTIFICATION,
    from: from,
    files,
  });
};

export const UpdateNotiSeen = async ({
  noti_id,
  type,
}: {
  noti_id?: string;
  type: string;
}) => {
  return await axios.patch("/notification", {
    noti_id,
    type,
  });
};

export const DeleteNoti = async () => {
  return await axios.delete("/notification");
};

export const GetNotifications = async () => {
  return await axios.get("/notification");
};
