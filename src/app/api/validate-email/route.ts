import user, { IUser } from "@/models/user";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import notification, {
  INotification,
  NotificationType,
} from "@/models/notification";
import { verifyAuth } from "@/utils/verify-auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    const { email } = await req.json();

    const findU = await user
      .findOne({ email, role: { $ne: "pdt" } })
      .select("_id pdt")
      .lean<IUser>();

    if (!findU) {
      return NextResponse.json({ type: "invalid" }, { status: 200 });
    }

    if (findU.pdt) {
      return NextResponse.json({ type: "joined" }, { status: 200 });
    }

    const checkNotify = await notification
      .findOne({
        sender: User._id,
        receiver: findU._id,
        type_notify: NotificationType.SITJ_PDT,
        reply: "none",
      })
      .select("_id")
      .lean<INotification>();

    if (checkNotify) {
      return NextResponse.json({ type: "sent" }, { status: 200 });
    }
    return NextResponse.json({ type: "valid" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
