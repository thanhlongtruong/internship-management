import { connectDB } from "./connectDB";

import user, { IUser } from "@/models/user";

import { cookies } from "next/headers";

import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getUserServer(): Promise<IUser | null> {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token = cookieStore.get("act")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as { _id: string };

    const userData = await user
      .findById(decoded._id)
      .select(
        "name email role gender birthday school major cohort faculty code pdt -_id"
      )
      .populate("pdt", "role email code school -_id")
      .lean<IUser>();

    return userData;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
