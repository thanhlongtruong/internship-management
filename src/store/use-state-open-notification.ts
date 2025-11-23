import { create } from "zustand";

type StateOpenNoti = {
  isOpenNoti: boolean;
  setOpenNoti: (state: boolean) => void;
};

export const useStateOpenNoti = create<StateOpenNoti>()((set) => ({
  isOpenNoti: false,
  setOpenNoti: (state) => set({ isOpenNoti: state }),
}));
