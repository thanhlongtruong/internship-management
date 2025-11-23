// src/app/_components/AuthInitializer.tsx
"use client";

import { useEffect } from "react";
import { FetchUser } from "../api-client/User";
import { useUserStore } from "../store/use-user-store";

export default function AuthInitializer() {
  const { data, status } = FetchUser();
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (status === "success" && data?.data?.user) {
      if (!user || user.email !== data.data.user.email) {
        setUser(data.data.user);
      }
    }
  }, [data, status, user, setUser]);
  return null;
}
