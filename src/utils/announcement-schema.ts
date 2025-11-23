import { z } from "zod";

export const AnnouncementSchema = z
  .object({
    topic: z.string().min(1, "Chủ đề là bắt buộc"),
    description_topic: z.string().optional().or(z.literal("")),
    files: z
      .array(
        z.object({
          url: z.string(),
          name: z.string(),
        })
      )
      .optional()
      .default([]),
    title: z
      .array(
        z.object({
          _id: z.string().optional(),
          title_name: z.string().min(1, "Tiêu đề là bắt buộc"),
          content: z.string({ error: "Nội dung là bắt buộc" }),
          files: z
            .array(
              z.object({
                url: z.string(),
                name: z.string(),
              })
            )
            .optional()
            .default([]),
          deadline: z.string({ error: "Hạn nộp là bắt buộc" }),
        })
      )
      .optional()
      .default([]),
    announcements_type: z.enum(["general", "assignment", "internship_form"]),
  })
  .superRefine((val, ctx) => {
    if (val.announcements_type === "assignment") {
      if (!val.title || val.title.length === 0) {
        ctx.addIssue({
          path: ["title"],
          code: "custom",
          message: "Cần ít nhất 1 tiêu đề cho Bài tập",
        });
        return;
      }
      val.title.forEach((t, index) => {
        if (!t.deadline) {
          ctx.addIssue({
            path: ["title", index, "deadline"],
            code: "custom",
            message: "Hạn nộp là bắt buộc cho mỗi tiêu đề khi là Bài tập",
          });
        }
      });
    } else if (val.announcements_type === "general") {
      if (val.title && val.title.length > 0) {
        ctx.addIssue({
          path: ["title"],
          code: "custom",
          message: "Chỉ cho phép tiêu đề khi loại là Bài tập",
        });
      }
    } else if (val.announcements_type === "internship_form") {
    }
  });

export type AnnouncementInput = z.infer<typeof AnnouncementSchema>;
export type AnnouncementFormValues = z.input<typeof AnnouncementSchema>;
