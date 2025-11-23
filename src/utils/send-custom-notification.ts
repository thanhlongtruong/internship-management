import { z } from "zod";
import {
  NotificationTarget_BCN,
  NotificationTarget_Advisor,
} from "@/components/dialog-send-notification";

export const SendCustomNotificationSchema = z.object({
  title: z.string().min(1, "Tiêu đề thông báo là bắt buộc"),
  message: z.string().min(1, "Nội dung thông báo là bắt buộc"),
  target: z.string<NotificationTarget_BCN | NotificationTarget_Advisor>(),
  files: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type SendCustomNotificationInput = z.infer<
  typeof SendCustomNotificationSchema
>;
export type SendCustomNotificationFormValues = z.input<
  typeof SendCustomNotificationSchema
>;
