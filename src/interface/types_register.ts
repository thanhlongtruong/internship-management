import { create } from "zustand";

export interface TypesRegister {
  role: string;
  email: string;
  name: string;
  gender: string;
  birthday: string;
  school: string;
  faculty?: string;
  major?: string;
  cohort?: string;
  password: string;
  passwordConfirm?: string;
  verificationCode?: string | number;
}

export interface TypesRegisterError {
  success: boolean;
  type: string;
  msg: string;
}

interface RegisterState {
  selected: string;
  handleSelect: (id: string) => void;
  removeSelected: () => void;
}

export const useRegister = create<RegisterState>((set) => ({
  selected: "none",
  handleSelect: (id) => set({ selected: id }),
  removeSelected: () => set({ selected: "none" }),
}));
