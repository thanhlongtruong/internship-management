import { connectDB } from "@/lib/connectDB";
import pushSubscription from "@/models/push-subscription";
import user from "@/models/user";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("act")?.value;

    if (!token) return NextResponse.json({ user: null }, { status: 401 });

    const decoded = jwtDecode<{ _id: string }>(token);

    const User = await user.findById(decoded?._id);

    if (!User) {
      return NextResponse.json(
        { success: false, msg: "Tài khoản không tồn tại." },
        { status: 404 }
      );
    }

    const { subscription } = await req.json();

    const existing = await pushSubscription.findOne({
      endpoint: subscription.endpoint,
    });
    if (!existing) {
      await pushSubscription.create({
        userId: User._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
    }

    return NextResponse.json(
      { success: true, msg: "Đăng ký push thông báo thành công." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
