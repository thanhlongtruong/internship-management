import { z } from "zod";

export const PublishFileSchema = z.object({
  files: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
      })
    )
    .nonempty({ message: "Vui lòng chọn file đính kèm." })
    .max(1, { message: "Chỉ được chọn 1 file." })
    .refine((data) => data.some((item) => item.name.endsWith(".xlsx")), {
      message: "Chỉ được chọn file .xlsx.",
    }),
});

export type PublishFileInput = z.infer<typeof PublishFileSchema>;
export type PublishFileFormValues = z.input<typeof PublishFileSchema>;
