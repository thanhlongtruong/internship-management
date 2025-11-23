import user, { IUser } from "@/models/user";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { FilterQuery } from "mongoose";
import { verifyAuth } from "@/utils/verify-auth";

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

    const { searchParams } = new URL(req.url);

    const page_size = 20;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;

    const skip = (page - 1) * page_size;

    const columnFiltersParam = searchParams.get("filter");
    const columnFilters: ColumnFilter[] = columnFiltersParam
      ? JSON.parse(columnFiltersParam)
      : [];

    const query: FilterQuery<IUser> = {
      role: "sv",
      pdt: User._id,
    };

    columnFilters.forEach((filter) => {
      const { id, value } = filter;
      if (value) {
        switch (id) {
          case "major":
          case "cohort":
            if (Array.isArray(value) && value.length > 0) {
              query[id] = { $in: value };
            }
            break;
          case "email":
            query[id] = { $regex: value, $options: "i" };
            break;
        }
      }
    });

    const [totalStudents, students] = await Promise.all([
      user.countDocuments(query),

      user
        .find(query)
        .select("role email name gender birthday school major cohort pdt -_id")
        .populate({
          path: "pdt",
          select: "email role code",
        })
        .sort({ cohort: -1, name: 1 })
        .skip(skip)
        .limit(page_size)
        .lean(),
    ]);

    return NextResponse.json(
      {
        students: students,
        total: Math.ceil(totalStudents / page_size),
        page: page,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
