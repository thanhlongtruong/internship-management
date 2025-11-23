import bcrypt from "bcryptjs";

const salt = 10;

const hashPass = (password: string) => {
  return bcrypt.hash(password, salt);
};

const comparePass = (password: string, passwordUser: string) => {
  return bcrypt.compare(password, passwordUser);
};

export { hashPass, comparePass };
