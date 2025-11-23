import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/user";
import { hashPass } from "@/utils/hash_pass";
import { RegisterSchema } from "@/utils/register-schema";
import { TypesRegister } from "@/interface/types_register";
import { generateUniqueCode } from "@/utils/generate-unique-code";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const data = RegisterSchema.parse(body);
    const checkExistedEmail = await User.findOne({ email: data.email });
    if (checkExistedEmail) {
      return NextResponse.json(
        { success: false, type: "email", msg: "Email này đã được đăng ký." },
        { status: 400 }
      );
    }

    const hashed = await hashPass(data.password);

    let code: string | undefined = undefined;

    if (["gv", "bcn", "pdt"].includes(data.role)) {
      code = await generateUniqueCode(data.role);
    }

    const objUser: TypesRegister = {
      name: data.name,
      email: data.email,
      role: data.role,
      gender: data.gender,
      birthday: data.birthday,
      school: data.school,
      password: hashed,
      ...(data.role === "sv" && {
        cohort: data.cohort,
        major: data.major,
      }),
      ...(data.role === "gv" && {
        faculty: data.faculty,
      }),
      ...((data.role === "pdt" ||
        data.role === "bcn" ||
        data.role === "gv") && {
        code: code,
      }),
    };

    const createU = await User.create(objUser);

    if (!createU) {
      return NextResponse.json(
        {
          success: false,
          msg: "Đăng ký thất bại.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        msg: "Đăng ký thành công",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
