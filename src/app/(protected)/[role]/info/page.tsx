import { redirect } from "next/navigation";

import { getUserServer } from "@/lib/get-user-server";

import PageInfoAccountClient from "./page-client";

export default async function PageInfoAccount() {
  const userData = await getUserServer();

  if (!userData) {
    redirect("/login");
  }

  return <PageInfoAccountClient user={userData} />;
}
