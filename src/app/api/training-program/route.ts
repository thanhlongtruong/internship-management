import { connectDB } from "@/lib/connectDB";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import user from "@/models/user";

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("act")?.value;

    if (!token) return NextResponse.json({ user: null }, { status: 401 });

    const decoded = jwtDecode<{ _id: string }>(token);

    const FindUser = await user.findById(decoded?._id);

    if (!FindUser) {
      return NextResponse.json(
        { success: false, msg: "Tài khoản không tồn tại." },
        { status: 404 }
      );
    }

    const update = await user.findByIdAndUpdate(FindUser._id);

    return NextResponse.json(
      { msg: "Gửi yêu cầu tham gia thành công." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
