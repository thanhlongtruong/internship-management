export type TypesNotification = {
  _id: string;
  sender: string;
  title: string;
  message?: string;
  data?: object;
  files: {
    url: string;
    name: string;
  }[];
  status_notify: string;
  btns?: Array<{ label: string; action: string; _id: string }>;
  action?: string;
  type_notify: string;
  reply: string;
  note?: string;
  createdAt: string;
};
