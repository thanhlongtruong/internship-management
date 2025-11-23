import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/connectDB";
import user, { IUser } from "@/models/user";
import { comparePass } from "@/utils/hash_pass";
import { verifyAuth } from "@/utils/verify-auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const User = await user
      .findOne({ email })
      .select("+password")
      .lean<IUser & { password: string }>();

    if (!User) {
      return NextResponse.json(
        {
          success: false,
          type: "email",
          msg: "Email này chưa được đăng ký.",
        },
        { status: 404 }
      );
    }

    const checkPass = await comparePass(password, User.password);

    if (!checkPass) {
      return NextResponse.json(
        { success: false, type: "password", msg: "Mật khẩu không chính xác." },
        { status: 400 }
      );
    }

    const payload = {
      _id: User?._id,
      role: User?.role,
      pdt: User?.pdt ? true : false,
    };

    const act = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });
    const rft = jwt.sign(payload, process.env.RF_SECRET!, {
      expiresIn: "7d",
    });

    const cookieStore = await cookies();

    cookieStore.set("act", act, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    cookieStore.set("rft", rft, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      { success: true, msg: "Đăng nhập thành công.", url: `/${User?.role}` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    const user_ = await user
      .findById(User._id)
      .select(
        "name email role gender birthday school major cohort faculty code pdt -_id"
      )
      .populate("pdt", "role email code school -_id")
      .lean<IUser>();

    return NextResponse.json({ user: user_ }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return NextResponse.json(
          {
            success: false,
            msg: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
