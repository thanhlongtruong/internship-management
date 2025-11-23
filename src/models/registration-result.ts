import { Schema, model, models } from "mongoose";

export interface IRegistrationResult extends Document {
  _id?: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  major: string;
  createdAt?: Date;
}

const registrationResultSchema = new Schema<IRegistrationResult>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "open_course",
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    major: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

registrationResultSchema.index(
  { courseId: 1, studentId: 1, major: 1 },
  { unique: true }
);

registrationResultSchema.index({ studentId: 1, major: 1 });

export default models.registration_result ||
  model("registration_result", registrationResultSchema);
