import { z } from "zod";

export const SubmitAssignmentSchema = z.object({
  files: z.array(
    z.object({
      url: z.string(),
      name: z.string(),
    })
  ).nonempty({ message: "Vui lòng chọn file đính kèm." }),
});

export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;
export type SubmitAssignmentFormValues = z.input<typeof SubmitAssignmentSchema>;
