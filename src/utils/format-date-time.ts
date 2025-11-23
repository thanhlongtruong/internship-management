export function formatVNDateTime(isoString: string): string {
  const date = new Date(isoString);

  // Tạo formatter theo múi giờ Việt Nam
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  // Dạng: "22:38, 06/10/2025"
  const formatted = new Intl.DateTimeFormat("vi-VN", options).format(date);

  // Đổi dấu phẩy thành dấu gạch ngang cho đúng yêu cầu
  return formatted.replace(",", " -");
}
