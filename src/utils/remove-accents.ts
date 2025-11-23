export const removeAccents = (str:string) => {
  return str
    .normalize("NFD") // Chuyển đổi sang dạng chuẩn
    .replace(/[\u0300-\u036f]/g, ""); // Loại bỏ các dấu
};
