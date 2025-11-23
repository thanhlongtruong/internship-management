import DialogInviteJoin from "@/components/dialog-invite-join";
import DialogSendRequestToJoinTrainingRoom from "@/components/dialog-send-request-to-join";
import type {
  Role,
  ActionType,
  TypeSidebarGroup,
  TypeSidebarItem,
} from "./types";

import Link from "next/link";

const classNameSideBar: string =
  "relative break-words h-fit text-stone-600 hover:text-stone-900 hover:pl-2 py-1 duration-500 transition-all hoverFuc";

const ALL_SIDEBAR_FUNCTIONS: Record<
  string,
  {
    name: string;
    typeAction: ActionType;
    href?: string;
    element?: React.JSX.Element;
  }
> = {
  join_to_training_program: {
    name: "Tham gia PDT",
    typeAction: "dialog",
    element: <DialogSendRequestToJoinTrainingRoom />,
  },
  sv_register_course: {
    name: "Đăng ký",
    typeAction: "link",
    href: "/sv/register-course",
    element: (
      <Link href="/sv/register-course" className={classNameSideBar}>
        Đăng ký
      </Link>
    ),
  },
  sv_class: {
    name: "Lớp",
    typeAction: "link",
    href: "/sv/class",
    element: (
      <Link href="/sv/class" className={classNameSideBar}>
        Lớp
      </Link>
    ),
  },

  //   // Nhóm Ban chủ nhiệm (BCN)
  bcn_registered_students: {
    href: "/bcn/registered-students",
    name: "Sinh viên",
    typeAction: "link",
    element: (
      <Link href="/bcn/registered-students" className={classNameSideBar}>
        Sinh viên
      </Link>
    ),
  },

  bcn_manage_lecturers: {
    href: "/bcn/lecturer",
    name: "Giảng viên",
    typeAction: "link",
    element: (
      <Link href="/bcn/lecturer" className={classNameSideBar}>
        Giảng viên
      </Link>
    ),
  },

  //   // Nhóm Giảng viên (GV)
  gv_advisor: {
    href: "/advisors",
    name: "GVHD",
    typeAction: "link",
  },
  gv_manage_class: {
    href: "/gv/course_advisor",
    name: "Lớp thực tập",
    typeAction: "link",
  },
  gv_enter_score: { href: "/gv/score", name: "Nhập điểm", typeAction: "link" },
  gv_give_assignment: {
    href: "/gv/post",
    name: "Giao bài",
    typeAction: "link",
  },

  //   // Nhóm Phòng đào tạo (PDT)
  pdt_manage_lecturers: {
    href: "/pdt/lecturer",
    name: "Giảng viên",
    typeAction: "link",
    element: (
      <Link href="/pdt/lecturer" className={classNameSideBar}>
        Giảng viên
      </Link>
    ),
  },
  pdt_manage_students: {
    href: "/pdt/student",
    name: "Sinh viên",
    typeAction: "link",
    element: (
      <Link href="/pdt/student" className={classNameSideBar}>
        Sinh viên
      </Link>
    ),
  },
  pdt_invite: {
    name: "Mời vào PDT",
    typeAction: "dialog",
    element: <DialogInviteJoin />,
  },
  pdt_send_notification: {
    href: "/pdt/notify",
    name: "Thông báo",
    typeAction: "link",
    element: (
      <Link href="/pdt/notify" className={classNameSideBar}>
        Thông báo
      </Link>
    ),
  },
  pdt_open_registration: {
    href: "/pdt/open-course",
    name: "Mở đăng ký",
    typeAction: "link",
    element: (
      <Link href="/pdt/open-course" className={classNameSideBar}>
        Mở đăng ký
      </Link>
    ),
  },
  pdt_statistics: {
    href: "/pdt/statistics",
    name: "Thống kê",
    typeAction: "link",
    element: (
      <Link href="/pdt/statistics" className={classNameSideBar}>
        Thống kê
      </Link>
    ),
  },
  account_info: {
    href: "/info",
    name: "Thông tin",
    typeAction: "link",
  },
  account_logout: {
    name: "Đăng xuất",
    typeAction: "button",
  },
};

const roleSidebarConfig: Record<
  Role,
  Array<{
    title: string;
    url?: string;
    items: Array<{
      title: string;
      url?: string;
      key: string;
      typeAction: ActionType;
      isActive?: boolean;
      element?: React.JSX.Element;
    }>;
  }>
> = {
  sv: [
    {
      title: "Thực tập",
      items: [
        {
          title: "Đăng ký",
          url: "/sv/register-course",
          key: "sv_register_course",
          typeAction: "link",
        },
        {
          title: "GVHD",
          url: "/sv/advisors",
          key: "gv_advisor",
          typeAction: "link",
        },
        {
          title: "Lớp thực tập",
          url: "/sv/course_student",
          key: "sv_course_student",
          typeAction: "link",
        },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        {
          title: "Thông tin",
          url: "/sv/info",
          key: "account_info",
          typeAction: "link",
        },
        {
          title: "Đăng xuất",
          key: "account_logout",
          typeAction: "button",
        },
      ],
    },
  ],
  gv: [
    {
      title: "Thực tập",
      items: [
        {
          title: "Lớp thực tập",
          url: "/gv/course_advisor",
          key: "gv_course_advisor",
          typeAction: "link",
        },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        {
          title: "Thông tin",
          url: "/gv/info",
          key: "account_info",
          typeAction: "link",
        },
        {
          title: "Đăng xuất",
          key: "account_logout",
          typeAction: "button",
        },
      ],
    },
  ],
  bcn: [
    {
      title: "Thực tập",
      items: [
        {
          title: "Sinh viên",
          url: "/bcn/registered-students",
          key: "bcn_registered_students",
          typeAction: "link",
        },
        // {
        //   title: "Giảng viên",
        //   url: "/bcn/lecturer",
        //   key: "bcn_manage_lecturers",
        //   typeAction: "link",
        // },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        {
          title: "Thông tin",
          url: "/bcn/info",
          key: "account_info",
          typeAction: "link",
        },
        {
          title: "Đăng xuất",
          key: "account_logout",
          typeAction: "button",
        },
      ],
    },
  ],
  pdt: [
    {
      title: "Nội bộ",
      items: [
        {
          title: "Mời vào PDT",
          key: "pdt_invite",
          typeAction: "dialog",
        },
        // {
        //   title: "Thông báo",
        //   url: "/pdt/notify",
        //   key: "pdt_send_notification",
        //   typeAction: "link",
        // },
      ],
    },
    {
      title: "Thực tập",
      items: [
        {
          title: "Mở đăng ký",
          url: "/pdt/open-course",
          key: "pdt_open_registration",
          typeAction: "link",
        },
        // {
        //   title: "Thống kê",
        //   url: "/pdt/statistics",
        //   key: "pdt_statistics",
        //   typeAction: "link",
        // },
      ],
    },
    {
      title: "Tài khoản",
      items: [
        {
          title: "Thông tin",
          url: "/pdt/info",
          key: "account_info",
          typeAction: "link",
        },
        {
          title: "Đăng xuất",
          key: "account_logout",
          typeAction: "button",
        },
      ],
    },
  ],
};

export function generateSidebarForRole(
  role: Role,
  pdt: boolean
): TypeSidebarGroup[] {
  const config = roleSidebarConfig[role];
  if (!config) return [];

  const groups: TypeSidebarGroup[] = config.map((group): TypeSidebarGroup => {
    const items: TypeSidebarItem[] = group.items.map((it): TypeSidebarItem => {
      const base = ALL_SIDEBAR_FUNCTIONS[it.key] || {};

      let url = it.url ?? base.href;

      if (it.key === "account_info") {
        url = `/${role}/info`;
      }
      if (it.key === "gv_advisor") {
        url = `/${role}/advisors`;
      }

      return {
        ...it,
        title: it.title ?? base.name ?? it.key,
        url,
        typeAction: it.typeAction ?? base.typeAction,
        element: it.element ?? base.element,
      };
    });

    return {
      title: group.title,
      url: group.url,
      items,
    };
  });

  if (role !== "pdt" && !pdt) {
    groups.push({
      title: "Khác",
      items: [
        {
          title: "Tham gia PDT",
          key: "join_to_training_program",
          typeAction: "dialog",
          url: undefined,
          element: ALL_SIDEBAR_FUNCTIONS["join_to_training_program"].element,
        },
      ],
    });
  }

  return groups;
}
