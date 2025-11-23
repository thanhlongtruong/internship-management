import { Schema, model, models } from "mongoose";

export interface IAdvisorGroup extends Document {
  _id?: Schema.Types.ObjectId;
  advisorId: Schema.Types.ObjectId;
  lecturerId: Schema.Types.ObjectId;
  students: Schema.Types.ObjectId[];
  schoolYear: string;
  semester: string;
  cohort: string;
  faculty: string;
  announcements: {
    _id?: Schema.Types.ObjectId;
    topic: string;
    description_topic: string;
    files: {
      _id?: Schema.Types.ObjectId;
      url: String;
      name: String;
    }[];
    title: {
      _id?: Schema.Types.ObjectId;
      title_name: string;
      content: string;
      files: {
        _id?: Schema.Types.ObjectId;
        url: String;
        name: String;
      }[];
      publishedFile: {
        _id?: Schema.Types.ObjectId;
        url: String;
        name: String;
      } | null;
      submissions: {
        _id?: Schema.Types.ObjectId;
        studentId: Schema.Types.ObjectId;
        file: {
          _id?: Schema.Types.ObjectId;
          url: String;
          name: String;
        }[];
        score: Number;
        submittedAt: Date;
      }[];
      deadline: Date;
      createdAt: Date;
    }[];
    announcements_type: "general" | "assignment";
    createdAt: Date;
  }[];
}

const advisorGroupSchema = new Schema<IAdvisorGroup>(
  {
    advisorId: {
      type: Schema.Types.ObjectId,
      ref: "training_advisor",
      required: true,
    },
    lecturerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
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
    announcements: {
      type: [
        {
          topic: {
            type: String,
            required: true,
          },
          description_topic: String,
          files: {
            type: [
              {
                url: String,
                name: String,
              },
            ],
            default: [],
          },
          title: {
            type: [
              {
                title_name: String,
                content: String,
                files: {
                  type: [
                    {
                      url: String,
                      name: String,
                    },
                  ],
                  default: [],
                },
                publishedFile: {
                  type: {
                    url: String,
                    name: String,
                  },
                  default: null,
                },
                deadline: Date,
                submissions: {
                  type: [
                    {
                      studentId: {
                        type: Schema.Types.ObjectId,
                        ref: "user",
                      },
                      file: {
                        type: [
                          {
                            url: String,
                            name: String,
                          },
                        ],
                        default: [],
                      },
                      score: {
                        type: Number,
                        default: -1,
                      },
                      submittedAt: {
                        type: Date,
                        default: Date.now,
                      },
                    },
                  ],
                  default: [],
                },
                createdAt: {
                  type: Date,
                  default: Date.now,
                },
              },
            ],
            default: [],
          },
          announcements_type: {
            type: String,
            enum: ["general", "assignment", "internship_form"],
            default: "general",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

advisorGroupSchema.index({
  schoolYear: 1,
  semester: 1,
  cohort: 1,
});

advisorGroupSchema.index(
  { advisorId: 1, lecturerId: 1 },
  { unique: true, name: "unique_advisor_and_lecturer" }
);

export default models.advisor_group ||
  model<IAdvisorGroup>("advisor_group", advisorGroupSchema);
