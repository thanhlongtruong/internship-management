import { create } from "zustand";
import { TypesUser } from "./use-user-store";

interface statePopupInfoUser {
  isOpen: boolean;
  user: TypesUser | null;
  setStore: (user: TypesUser | null) => void;
  reset: () => void;
}

export const useStatePopupInfoUser = create<statePopupInfoUser>((set) => ({
  isOpen: false,
  user: null,
  setStore: (user) => set({ user, isOpen: true }),
  reset: () => set({ isOpen: false, user: null }),
}));
