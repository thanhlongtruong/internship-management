import { create } from "zustand";

export type TypesUser = {
  role: string;
  email: string;
  name: string;
  gender: string;
  birthday: string;
  school: string;
  faculty?: string;
  major?: string;
  cohort?: string;
  code?: string;
  pdt: TypesUser | string;
  exp: number;
};

type UserState = {
  user: TypesUser | null;
  setUser: (user: TypesUser | null) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    set({ user: null });
  },
}));
