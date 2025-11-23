import user from "../models/user";

export async function generateUniqueCode(role: string): Promise<string> {
  // Prefix theo role
  const prefixMap: Record<string, string> = {
    gv: "GV",
    pdt: "PDT",
    bcn: "BCN",
  };

  const prefix = prefixMap[role] ?? "U";

  let code: string;
  let exists = true;

  // Lặp cho đến khi ra mã chưa tồn tại
  do {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 ký tự ngẫu nhiên
    code = `${prefix}-${random}`;
    const found = await user.findOne({ code });
    exists = !!found;
  } while (exists);

  return code;
}
