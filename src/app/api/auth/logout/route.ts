import pushSubscription from "@/models/push-subscription";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();

    if (endpoint) await pushSubscription.deleteOne({ endpoint });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "act",
      value: "",
      maxAge: 0,
      path: "/",
    });
    cookieStore.set({
      name: "rft",
      value: "",
      maxAge: 0,
      path: "/",
    });
    return NextResponse.json({ msg: "Đăng xuất thành công" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
