export const countDownDate = (date: string) => {
  const now = new Date();
  const deadline = new Date(date);

  if (now > deadline) return "Đã hết";

  const diff = deadline.getTime() - now.getTime();

  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} ngày ${diffHours} giờ`;
  } else if (diffHours > 0) {
    return `${diffHours} giờ ${diffMinutes} phút`;
  } else {
    return `${diffMinutes} phút`;
  }
};
