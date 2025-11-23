import { z } from "zod";

export const StudentsGradeSchema = z
  .object({
    grades: z
      .object({
        email: z.string(),
        grade: z.string(),
      })
      .array()
      .nonempty({ message: "Vui lòng nhập điểm cho tất cả sinh viên." }),
  })
  .superRefine((val, ctx) => {
    val.grades.forEach(({ grade }, index) => {
      const gradeString = grade;

      if (gradeString.startsWith(".")) {
        ctx.addIssue({
          path: ["grades", index, "grade"],
          code: "custom",
          message: "Điểm không được bắt đầu bằng dấu chấm.",
        });
        return;
      }

      if (
        gradeString.length > 1 &&
        gradeString[0] === "0" &&
        gradeString[1] !== "."
      ) {
        ctx.addIssue({
          path: ["grades", index, "grade"],
          code: "custom",
          message: "Điểm không được bắt đầu bằng dấu chấm.",
        });
        return;
      }

      if (!/^\d*\.?\d*$/.test(gradeString)) {
        ctx.addIssue({
          path: ["grades", index, "grade"],
          code: "custom",
          message: "Điểm không được bắt đầu bằng dấu chấm.",
        });
        return;
      }

      const parts = gradeString.split(".");
      if (parts.length > 2) {
        ctx.addIssue({
          path: ["grades", index, "grade"],
          code: "custom",
          message: "Điểm không được bắt đầu bằng dấu chấm.",
        });
        return;
      }

      if (parts[1] && parts[1].length > 2) {
        ctx.addIssue({
          path: ["grades", index, "grade"],
          code: "custom",
          message: "Điểm không được bắt đầu bằng dấu chấm.",
        });
        return;
      }

      const num = parseFloat(gradeString);
      if (!isNaN(num)) {
        if (num < 0 || num > 10) {
          ctx.addIssue({
            path: ["grades", index, "grade"],
            code: "custom",
            message: "Điểm không được bắt đầu bằng dấu chấm.",
          });
          return;
        }

        if (num === 10 && gradeString.includes(".")) {
          ctx.addIssue({
            path: ["grades", index, "grade"],
            code: "custom",
            message: "Điểm không được bắt đầu bằng dấu chấm.",
          });
          return;
        }
      }
    });
  });

export type StudentsGradeInput = z.infer<typeof StudentsGradeSchema>;
export type StudentsGradeFormValues = z.input<typeof StudentsGradeSchema>;
