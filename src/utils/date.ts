// utils/date.ts
export function pad(num: number) {
  return String(num).padStart(2, "0");
}

/** Chuyển Date (local) -> chuỗi cho input datetime-local: "YYYY-MM-DDTHH:mm" */
export function formatDateToInputValue(d?: Date | null) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Chuyển chuỗi input datetime-local -> Date local chính xác */
export function parseInputValueToDate(v: string | undefined | null) {
  if (!v) return undefined;
  // v expected "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  const [datePart, timePart] = v.split("T");
  if (!datePart || !timePart) return undefined;
  const [y, m, d] = datePart.split("-").map((x) => Number(x));
  const timeParts = timePart.split(":").map((x) => Number(x));
  const hh = timeParts[0] ?? 0;
  const mm = timeParts[1] ?? 0;
  const ss = timeParts[2] ?? 0;
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, ss || 0); // local time
}
