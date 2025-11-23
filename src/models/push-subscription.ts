import { Schema, models, model } from "mongoose";

const PushSubSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: String,
    auth: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default models.pushsub || model("pushsub", PushSubSchema);
