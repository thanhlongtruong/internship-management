import { Schema, model, models } from "mongoose";

export interface IOpenRegistration extends Document {
  _id?: Schema.Types.ObjectId;
  timeStart: Date;
  timeEnd: Date;
  schoolYear: string;
  semester: string;
  cohort: string;
  major: { name: string; quantity: number; used: number }[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const majorSchema = new Schema(
  {
    name: String,
    quantity: Number,
    used: { type: Number, default: 0 },
  },
  { _id: false }
);

export const openRegistrantionSchema = new Schema<IOpenRegistration>(
  {
    timeStart: {
      type: Date,
      required: true,
    },
    timeEnd: {
      type: Date,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    schoolYear: {
      type: String,
      required: true,
    },
    cohort: {
      type: String,
      required: true,
    },
    major: [majorSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

openRegistrantionSchema.index({ schoolYear: 1, semester: 1, cohort: 1 });

// Unique index để tránh duplicate khi tạo cùng lúc
openRegistrantionSchema.index(
  {
    createdBy: 1,
    schoolYear: 1,
    semester: 1,
    cohort: 1,
    timeStart: 1,
    timeEnd: 1,
  },
  {
    unique: true,
    name: "unique_registration_per_creator",
  }
);

export default models.open_course ||
  model<IOpenRegistration>("open_course", openRegistrantionSchema);
