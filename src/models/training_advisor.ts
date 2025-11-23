import { Schema, model, models } from "mongoose";

export interface ITrainingAdvisor extends Document {
  _id?: Schema.Types.ObjectId;
  lecturerId: Schema.Types.ObjectId;
  schoolYear: string;
  semester: string;
  cohort: string;
  faculty: string;
  maxStudents: number;
  assignedStudents: Schema.Types.ObjectId[];
  createdBy: Schema.Types.ObjectId;
  studentSelectDeadline: Date;
}

const trainingAdvisorSchema = new Schema<ITrainingAdvisor>(
  {
    lecturerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    schoolYear: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    cohort: {
      type: String,
      required: true,
    },
    faculty: {
      type: String,
      required: true,
    },
    maxStudents: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    studentSelectDeadline: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

trainingAdvisorSchema.index({ schoolYear: 1, semester: 1, cohort: 1 });

trainingAdvisorSchema.index(
  { lecturerId: 1, faculty: 1 },
  { unique: true, name: "unique_lecturer_per_faculty" }
);

export default models.training_advisor ||
  model<ITrainingAdvisor>("training_advisor", trainingAdvisorSchema);
