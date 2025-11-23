import { Schema, model, models } from "mongoose";

export interface IUser extends Document {
  _id?: Schema.Types.ObjectId;
  role: "sv" | "gv" | "bcn" | "pdt";
  email: string;
  name: string;
  gender: string;
  birthday: string;
  school: string;
  faculty?: string;
  code?: string;
  major?: string;
  cohort?: string;
  pdt?: Schema.Types.ObjectId;
  password?: string;
}

const userSchema = new Schema<IUser>({
  role: {
    type: String,
    required: true,
    enum: ["sv", "gv", "bcn", "pdt"],
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  birthday: {
    type: String,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    index: true,
  },
  code: {
    type: String,
    unique: true,
  },
  major: {
    type: String,
    index: true,
  },
  cohort: {
    type: String,
    index: true,
  },
  pdt: {
    type: Schema.Types.ObjectId,
    ref: "user",
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

export default models.user || model<IUser>("user", userSchema);
