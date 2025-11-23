import { z } from "zod";
import { Major } from "./major";

export const OpenRegistrationSchema = z
  .object({
    timeStart: z.coerce.date({
      error: "Thời gian bắt đầu không hợp lệ.",
    }),
    timeEnd: z.coerce.date({
      error: "Thời gian kết thúc không hợp lệ.",
    }),
    semester: z.string({
      error: "Học kỳ không hợp lệ.",
    }),
    schoolYear: z.string({
      error: "Năm học không hợp lệ.",
    }),
    cohort: z.string({
      error: "Khóa không hợp lệ.",
    }),
    major: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number().min(1, "Số lượng phải lớn hơn 0."),
        })
      )
      .min(1, { message: "Phải có ít nhất một ngành đăng ký." }),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (data.timeStart <= now) {
      ctx.addIssue({
        code: "custom",
        path: ["timeStart"],
        message: "Thời gian bắt đầu phải ở trong tương lai.",
      });
    }

    if (data.timeEnd <= data.timeStart) {
      ctx.addIssue({
        code: "custom",
        path: ["timeEnd"],
        message: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu.",
      });
    }

    const differenceInMs = data.timeEnd.getTime() - data.timeStart.getTime();
    if (differenceInMs > oneDayInMs) {
      ctx.addIssue({
        code: "custom",
        path: ["timeEnd"],
        message:
          "Thời gian kết thúc không được quá 24 giờ so với thời gian bắt đầu.",
      });
    }

    const validMajors = Major.map((m) => m.value);
    data.major.forEach((m, i) => {
      if (!validMajors.includes(m.name)) {
        ctx.addIssue({
          code: "custom",
          path: ["major", i, "name"],
          message: `Vui lòng chọn ngành trong danh sách.`,
        });
      }
    });

    const seen = new Map<string, number[]>();
    data.major.forEach((m, i) => {
      if (!seen.has(m.name)) seen.set(m.name, []);
      seen.get(m.name)!.push(i);
    });

    for (const [name, indexes] of seen.entries()) {
      if (indexes.length > 1) {
        indexes.forEach((i) => {
          ctx.addIssue({
            code: "custom",
            path: ["major", i, "name"],
            message: `Ngành "${name}" bị trùng.`,
          });
        });
      }
    }
  });

export type OpenRegistrationInput = z.infer<typeof OpenRegistrationSchema>;
