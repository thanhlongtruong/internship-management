import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { App_Sidebar } from "@/components/sidebar";
import { Role, TokenPayload } from "@/lib/types";
import { generateSidebarForRole } from "@/lib/sidebar";
import { Toaster } from "sonner";
import PopupInfoUser from "@/components/popup-info-user";
import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import UINotification from "@/components/notification";
import { BreadcrumbDynamic } from "@/components/breadcrumb-dynamic";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export default async function ProtectedRoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const roleTyped = role as Role;

  const { sidebarConfig } = await getLayoutData(roleTyped);

  return (
    <>
      <SidebarProvider>
        <App_Sidebar groups={sidebarConfig} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b justify-between top-0 sticky bg-white z-10">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbDynamic />
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-3">
              <UINotification />
            </div>
          </header>
          <Suspense
            fallback={
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                </div>
                <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
              </div>
            }>
            <Toaster position="bottom-center" richColors />
            <PopupInfoUser />
            <main className="flex flex-1 flex-col p-3">{children}</main>
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

const getLayoutData = cache(async (role: Role) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("act")?.value;

  if (!token) {
    redirect("/login");
  }

  let user: TokenPayload;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    user = payload as TokenPayload;
  } catch {
    redirect("/login");
  }

  if (role !== user.role) {
    redirect(`/${user.role}`);
  }

  const sidebarConfig = generateSidebarForRole(user.role, user.pdt);

  return { sidebarConfig };
});
