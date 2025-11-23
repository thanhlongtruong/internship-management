"use client";

import { Logout } from "@/api-client/User";
import { TypeSidebarGroup } from "@/lib/types";
import { useUserStore } from "@/store/use-user-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import ScrambledText from "./scrambled-text";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";
import Link from "next/link";
export function App_Sidebar({
  groups,
  ...props
}: React.ComponentProps<typeof Sidebar> & { groups: TypeSidebarGroup[] }) {
  const queryClient = useQueryClient();

  const { logout } = useUserStore();

  const mutationLogout = useMutation({
    mutationFn: Logout,
    onSuccess: (response) => {
      const { msg } = response.data;
      toast.success(msg);
      queryClient.clear();
      logout();
      window.location.replace("/login");
    },
    onError: () => {
      toast.error("Đăng xuất thất bại");
    },
  });

  const handleLogout = async () => {
    if (mutationLogout.isPending) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
    mutationLogout.mutate(sub?.endpoint || "");
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                className="uppercase text-xl md:text-2xl font-extrabold">
                <ScrambledText>FRUIT.</ScrambledText>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {groups.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url ?? "#"} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.key}>
                        {item.typeAction === "link" ? (
                          <SidebarMenuSubButton
                            asChild
                            isActive={item.isActive}>
                            <a href={item.url ?? "#"}>
                              <p className="relative w-full hover:pl-2 py-1 duration-500 transition-all hoverFuc">
                                {item.title}
                              </p>
                            </a>
                          </SidebarMenuSubButton>
                        ) : item.typeAction === "dialog" && item.element ? (
                          <SidebarMenuSubButton asChild>
                            <div>{item.element}</div>
                          </SidebarMenuSubButton>
                        ) : item.typeAction === "button" &&
                          item.key === "account_logout" ? (
                          <SidebarMenuSubButton asChild>
                            {mutationLogout.isPending ? (
                              <Ring size={15} stroke={2} color="red" />
                            ) : (
                              <button onClick={handleLogout} className="w-full">
                                <p className="w-full relative !text-red-500 hover:opacity-90 font-medium cursor-pointer hover:pl-2 py-1 duration-500 transition-all hoverFuc text-left">
                                  {item.title}
                                </p>
                              </button>
                            )}
                          </SidebarMenuSubButton>
                        ) : null}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
