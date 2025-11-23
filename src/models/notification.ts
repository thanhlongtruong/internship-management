/* eslint-disable @typescript-eslint/no-explicit-any */

import { Schema, model, models } from "mongoose";

export enum NotificationType {
  SRTJ = "send-req-to-join",
  ARTJ = "answer-req-to-join",
  SITJ_PDT = "send-invitations-to-join-pdt",
  AITJ_PDT = "answer-invitations-to-join-pdt",
  SRT_ADVISOR = "send-request-to-advisor",
  ART_ADVISOR = "answer-request-to-advisor",
  UNDO_SRT_ADVISOR = "undo-send-request-to-advisor",
  CUSTOM_NOTIFICATION = "custom-notification",
}

export interface INotificationButton {
  label: string;
  action: "accept" | "reject" | "view" | "none";
}
export interface INotification extends Document {
  _id?: Schema.Types.ObjectId;
  type_notify: NotificationType;
  sender: Schema.Types.ObjectId;
  title: string;
  message?: string;
  files: {
    url: string;
    name: string;
  }[];
  data: Record<string, any>;
  receiver: [Schema.Types.ObjectId];
  status_notify: "unread" | "seen";
  btns: INotificationButton[];
  reply: "answered" | "none";
  action: "open_dialog" | "none";
  note?: string;
}

const notificationSchema = new Schema<INotification>(
  {
    type_notify: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    files: {
      type: [
        {
          url: String,
          name: String,
        },
      ],
      default: [],
    },
    data: {
      type: Object,
      default: {},
    },
    receiver: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
        index: true,
      },
    ],
    status_notify: {
      type: String,
      default: "unread",
      enum: ["unread", "seen"],
      index: true,
    },
    btns: {
      type: [
        {
          label: { type: String, required: true },
          action: {
            type: String,
            enum: ["accept", "reject", "view", "none"],
            default: "none",
          },
        },
      ],
      default: [],
    },
    reply: {
      type: String,
      enum: ["answered", "none"],
      default: "none",
    },
    action: {
      type: String,
      enum: ["open_dialog", "none"],
      default: "none",
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

export default models?.notification ||
  model<INotification>("notification", notificationSchema);
