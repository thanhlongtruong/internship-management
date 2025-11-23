export type Role = "sv" | "gv" | "bcn" | "pdt";
export type ActionType = "dialog" | "link" | "button";

export type TypeSidebarItem = {
  title: string;
  url?: string;
  key: string;
  typeAction: ActionType;
  isActive?: boolean;
  element?: React.JSX.Element;
};

export type TypeSidebarGroup = {
  title: string;
  url?: string;
  items: TypeSidebarItem[];
};

export type TokenPayload = {
  _id: string;
  role: Role;
  pdt: boolean;
};
