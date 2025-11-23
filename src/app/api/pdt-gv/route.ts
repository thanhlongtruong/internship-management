import user, { IUser } from "@/models/user";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { FilterQuery } from "mongoose";
import { verifyAuth } from "@/utils/verify-auth";
import { Schema } from "mongoose";

type ColumnFilter = {
  id: string;
  value: string;
};

export async function GET(req: Request) {
  try {
    await connectDB();

    const result = await verifyAuth();

    if (result instanceof Response) return result;

    const { User } = result;

    let idPdt: Schema.Types.ObjectId | undefined = undefined;
    if (User.role !== "pdt" && User.role !== "bcn") {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền truy cập" },
        { status: 400 }
      );
    }
    if (User.role !== "pdt" && User.role === "bcn") {
      idPdt = User.pdt;
    } else {
      idPdt = User._id;
    }

    const { searchParams } = new URL(req.url);

    const page_size = 20;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;

    const skip = (page - 1) * page_size;

    const columnFiltersParam = searchParams.get("filter");

    const columnFilters: ColumnFilter[] = columnFiltersParam
      ? JSON.parse(columnFiltersParam)
      : [];

    const query: FilterQuery<IUser> = {
      role: "gv",
      pdt: idPdt,
    };

    columnFilters.forEach((filter) => {
      const { id, value } = filter;
      if (value) {
        switch (id) {
          case "faculty":
            if (Array.isArray(value) && value.length > 0) {
              query[id] = { $in: value };
            }
            break;
        }
      }
    });

    const [totalLecturers, lecturers] = await Promise.all([
      user.countDocuments(query),

      user
        .find(query)
        .select("role email name gender birthday school faculty pdt -_id")
        .populate({
          path: "pdt",
          select: "email role code",
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(page_size)
        .lean(),
    ]);

    return NextResponse.json(
      {
        lecturers: lecturers,
        total: Math.ceil(totalLecturers / page_size),
        page: page,
        pageSize: page_size,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
