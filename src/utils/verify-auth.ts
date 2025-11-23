import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import user, { IUser } from "@/models/user";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("act")?.value;

    if (!token) {
      return NextResponse.json(
        { msg: "Vui lòng đăng nhập để thực hiện chức năng này." },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as { _id: string };

    const User = await user.findById(decoded).lean<IUser>();
    if (!User) {
      return NextResponse.json(
        { msg: "Tài khoản không tồn tại." },
        { status: 404 }
      );
    }
    return { User };
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
