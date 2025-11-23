export interface TypesLogin {
  email: string;
  password: string;
}
export interface TypesLoginError {
  type: "email" | "password";
  success: boolean;
  msg: string;
}
