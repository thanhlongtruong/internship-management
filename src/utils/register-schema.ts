import { z } from "zod";
import { Universities } from "./university";

const currentYear = new Date().getFullYear();

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .nonempty("Vui lòng nhập họ tên.")
      .min(2, "Họ và tên có ít nhất 2 kí tự.")
      .max(36, "Họ và tên có nhiều nhất 36 kí tự.")
      .regex(/^[a-zA-ZÀ-ỹà-ỹ\s]+$/, "Vui lòng nhập chữ."),
    gender: z.string().nonempty("Vui lòng chọn giới tính."),
    birthday: z
      .string()
      .nonempty("Vui lòng nhập ngày sinh.")
      .refine(
        (val) => {
          const birthDate = new Date(val);
          const year = birthDate.getFullYear();

          if (isNaN(birthDate.getTime()) || year < 1900) {
            return false;
          }

          const today = new Date();
          let age = today.getFullYear() - year;
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();

          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }
          return age >= 18;
        },
        {
          message: "Tuổi phải từ 18 trở lên hoặc năm sinh không hợp lệ.",
        }
      ),
    school: z
      .string()
      .nonempty("Vui lòng chọn 1 trường.")
      .refine(
        (val) => {
          const str = val?.trim() ?? "";
          const va = Universities?.filter((u) => u.name?.trim() === str);

          if (va?.length > 0) {
            return true;
          }
        },
        {
          message: "Vui lòng chọn Trường trong danh sách.",
        }
      ),
    role: z.string().nonempty("Vui lòng chọn vai trò của bạn."),
    cohort: z.string().optional(),
    major: z.string().optional(),
    faculty: z.string().optional(),
    email: z
      .string()
      .nonempty("Vui lòng nhập Email.")
      .regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Email không hợp lệ.")
      .refine(
        (val) => {
          if (val.endsWith("@gmail.com")) {
            return true;
          }
        },
        { message: "Ví dụ: fruit@gmail.com" }
      ),
    password: z
      .string()
      .nonempty("Vui lòng nhập mật khẩu.")
      .min(8, "Mật khẩu có ít nhất 8 ký tự."),
    passwordConfirm: z.string().nonempty("Vui lòng nhập lại mật khẩu."),
    // verificationCode: z.string().nonempty("Vui lòng nhập mã xác nhận email."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập lại mật khẩu khớp với mật khẩu đã nhập ở trên.",
        path: ["passwordConfirm"],
      });
    }
    if (data.role === "sv") {
      if (!data.cohort) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng nhập năm vào trường (4 chữ số).",
          path: ["cohort"],
        });
      } else if (!/^\d{4}$/.test(data.cohort)) {
        ctx.addIssue({
          code: "custom",
          message: "Năm phải có 4 chữ số.",
          path: ["cohort"],
        });
      } else if (
        parseInt(data.cohort, 10) < 1900 ||
        parseInt(data.cohort, 10) > currentYear
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Năm từ 1900 - ${currentYear}.`,
          path: ["cohort"],
        });
      }

      if (!data.major) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng chọn ngành.",
          path: ["major"],
        });
      }
    }
    if (data.role === "gv") {
      if (!data.faculty) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng chọn khoa.",
          path: ["faculty"],
        });
      }
    }
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
