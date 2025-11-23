"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";

import {
  GetNotifications,
  AnswerNotify,
  UpdateNotiSeen,
  DeleteNoti,
} from "../api-client/notification";

import { PushSubscription } from "../api-client/push-sub";

import { useStatePopupInfoUser } from "../store/use-state-popup-info-user";
import { useStateOpenNoti } from "../store/use-state-open-notification";

import { TypesUser } from "../store/use-user-store";
import { TypesNotification } from "../types/notification";
import { NotificationType } from "@/models/notification";

import { formatVNDateTime } from "../utils/format-date-time";
import urlBase64ToUint8Array from "../utils/url-base64-to-uint8-array";

import {
  Bell,
  BellRing,
  CircleUserRound,
  EllipsisVertical,
  ListChecks,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Spinner } from "@/components/ui/spinner";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import Link from "next/link";

const EMPTY_ARRAY: TypesNotification[] = [];

type AnswerNotifyPayload = {
  noti_id: string;
  action: string;
  type: NotificationType;
};

function useNotificationActionMutation(
  mutationFn: (payload: AnswerNotifyPayload) => Promise<any>,
  queryClient: any,
  onSettledCallback: () => void
) {
  return useMutation({
    mutationFn,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(response.data.msg);
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      const errorMsg =
        error.response?.data?.msg || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      toast.error(errorMsg);
    },
    onSettled: () => {
      onSettledCallback();
    },
  });
}

function UINotification() {
  const queryClient = useQueryClient();

  const { setStore } = useStatePopupInfoUser();
  const { setOpenNoti, isOpenNoti } = useStateOpenNoti();

  const [processingBtnId, setProcessingBtnId] = useState<string | null>(null);

  const { data, status, refetch, isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: GetNotifications,
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: false,
  });

  const notifications: TypesNotification[] = data?.data?.notify ?? EMPTY_ARRAY;

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status_notify === "unread").length,
    [notifications]
  );
  const hasUnread = unreadCount > 0;

  const mutationUpdateNotiSeen = useMutation({
    mutationFn: UpdateNotiSeen,
    onSuccess: (response) => {
      const { msg } = response.data;
      if (msg) {
        toast.success(msg);
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const mutationDeleteNoti = useMutation({
    mutationFn: DeleteNoti,
    onSuccess: (response) => {
      const { msg } = response.data;
      if (msg) {
        toast.success(msg);
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleUpdateNoti = ({
    noti_id,
    type,
  }: {
    noti_id?: string;
    type: string;
  }) => {
    if (mutationUpdateNotiSeen.isPending) return;
    mutationUpdateNotiSeen.mutate({ noti_id, type });
  };

  const answerMutation = useNotificationActionMutation(
    AnswerNotify,
    queryClient,
    () => setProcessingBtnId(null)
  );

  const handleOpenDialogInfo = useCallback(
    (n: TypesNotification) => {
      if (n.action === "open_dialog" && n.data) {
        setStore(n.data as TypesUser);
      }
    },
    [setStore]
  );

  const handleChooseBtn = useCallback(
    (
      type: NotificationType,
      noti_id: string,
      btn: { _id: string; action: string }
    ) => {
      if (answerMutation.isPending) {
        return;
      }
      setProcessingBtnId(btn._id);

      let type_ = NotificationType.ARTJ;

      if (type === NotificationType.SITJ_PDT) {
        type_ = NotificationType.AITJ_PDT;
      } else if (type === NotificationType.SRT_ADVISOR) {
        type_ = NotificationType.ART_ADVISOR;
      } else {
        toast.error("Loại thông báo không hợp lệ.");
        return;
      }
      const payload = {
        noti_id: noti_id,
        action: btn.action,
        type: type_,
      };

      answerMutation.mutate(payload);
    },
    [answerMutation]
  );

  const mutationPushSub = useMutation({
    mutationFn: PushSubscription,
    onSuccess: (response) => {
      const { msg } = response.data;
      toast.success(msg);
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const handleSubscribe = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.info("Trình duyệt không hỗ trợ Web Push");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.info("Bạn đã chặn thông báo website này.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      mutationPushSub.mutate(subscription);
    } catch {
      toast.info("Quyền bị từ chối bởi trình duyệt.");
    }
  };

  return (
    <div className="isolate relative h-6 w-6 notification-container z-50">
      {hasUnread ? (
        <>
          <BellRing
            className="cursor-pointer bell-ring-animate select-none"
            size={24}
            onClick={() => setOpenNoti(!isOpenNoti)}
          />
          <Badge
            className="absolute h-5 min-w-5 -right-3 -top-2 rounded-full px-1 font-mono tabular-nums"
            variant="destructive">
            {unreadCount}
          </Badge>
        </>
      ) : (
        <Bell
          className="cursor-pointer"
          size={24}
          onClick={() => setOpenNoti(!isOpenNoti)}
        />
      )}

      <div
        className={`${
          isOpenNoti ? "scale-y-100 isolate" : "scale-y-0"
        } notification-box origin-top duration-500 transition-transform divide-y divide-gray-300 bg-white`}>
        <div className="sticky top-0 z-10 bg-white h-9 border-b px-3 py-6 flex items-center justify-between">
          <p className="font-medium text-lg">Thông báo</p>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  disabled={isFetching}
                  onClick={() => refetch()}>
                  <RefreshCw className={`${isFetching && "animate-spin"}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reload</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Submit">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Menu</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent className="w-fit" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => handleUpdateNoti({ type: "mark_all" })}>
                    Đánh dấu đã đọc
                    <DropdownMenuShortcut>
                      {mutationUpdateNotiSeen.isPending ? (
                        <Spinner />
                      ) : (
                        <ListChecks />
                      )}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => mutationDeleteNoti.mutate()}>
                    Xóa tất cả
                    <DropdownMenuShortcut>
                      {mutationDeleteNoti.isPending ? <Spinner /> : <Trash2 />}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {mutationPushSub.isPending ? (
                    <DropdownMenuItem>
                      Please wait...
                      <DropdownMenuShortcut>
                        <Spinner />
                      </DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleSubscribe}>
                      Cho phép nhận thông báo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label="button"
                  onClick={() => setOpenNoti(!isOpenNoti)}>
                  <X />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đóng</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {status === "pending" && (
          <div className="h-fit mx-auto w-fit py-7 flex items-center gap-2">
            <Spinner />
            <p className="text-zinc-500">Đang tải....</p>
          </div>
        )}

        {status !== "pending" &&
          (!notifications || notifications.length === 0) && (
            <div className="h-fit mx-auto w-fit py-7 flex flex-col items-center justify-center gap-6">
              <p className="text-3xl">{"(>_<)"}</p>
              <p>Bạn không có thông báo nào.</p>
            </div>
          )}

        {notifications.length > 0 &&
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              processingBtnId={processingBtnId}
              onOpenDialog={handleOpenDialogInfo}
              onChooseAction={handleChooseBtn}
              handleUpdateNoti={handleUpdateNoti}
              answerMutation={answerMutation.isPending}
            />
          ))}
      </div>
    </div>
  );
}

type NotificationItemProps = {
  notification: TypesNotification;
  processingBtnId: string | null;
  onOpenDialog: (notification: TypesNotification) => void;
  handleUpdateNoti: (payload: { noti_id: string; type: string }) => void;
  onChooseAction: (
    type: NotificationType,
    noti_id: string,
    btn: { _id: string; action: string }
  ) => void;
  answerMutation: boolean;
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification: n,
  processingBtnId,
  onOpenDialog,
  onChooseAction,
  handleUpdateNoti,
  answerMutation,
}) => {
  const getMessageClassName = () => {
    if (n.action === "open_dialog") {
      return "cursor-pointer";
    }
    const targetTypes = [
      NotificationType.ARTJ,
      NotificationType.AITJ_PDT,
      NotificationType.ART_ADVISOR,
    ];
    if (
      targetTypes.includes(n.type_notify as NotificationType) &&
      (n.note === "rejected" || n.note === "accepted")
    ) {
      return n.note === "rejected" ? "text-red-500" : "text-green-500";
    }

    return "text-zinc-600";
  };

  const renderActionButtons = () => {
    if (
      n.reply !== "none" ||
      (n.type_notify !== NotificationType.SRTJ &&
        n.type_notify !== NotificationType.SITJ_PDT &&
        n.type_notify !== NotificationType.SRT_ADVISOR)
    ) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-6">
        {n.btns?.map((b) => {
          const isThisButtonProcessing = processingBtnId === b._id;

          return (
            <Button
              key={b.action}
              size="sm"
              variant={b.action === "reject" ? "destructive" : "outline"}
              disabled={isThisButtonProcessing || answerMutation}
              onClick={() =>
                onChooseAction(n.type_notify as NotificationType, n._id, b)
              }>
              {isThisButtonProcessing ? (
                <>
                  <Spinner className="mr-2" />
                  Vui lòng đợi...
                </>
              ) : (
                b.label
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-2 p-3 bg-white relative`}
      onClick={() => {
        if (n.status_notify === "seen") return;
        handleUpdateNoti({ noti_id: n._id, type: "mark_one" });
      }}>
      {n.status_notify === "unread" && (
        <span className="absolute top-4 right-5 flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex size-1.5 rounded-full bg-sky-500"></span>
        </span>
      )}
      <CircleUserRound size={24} className="shrink-0 stroke-1" />
      <div className="flex flex-col gap-2 w-full">
        <p className="select-none text-sm font-medium">{n.title}</p>
        <p
          className={`text-sm font-normal break-all ${getMessageClassName()}`}
          onClick={() => onOpenDialog(n)}>
          {n.message}
        </p>

        {n.type_notify === NotificationType.CUSTOM_NOTIFICATION &&
          n.files &&
          n.files.length > 0 && (
            <div className="flex flex-col gap-1 w-full">
              <p className="text-sm font-medium">Các file đính kèm:</p>
              {n.files.map((f, idx) => (
                <Link
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  className="text-sm text-zinc-700 hover:underline">
                  {idx + 1}. {f.name}
                </Link>
              ))}
            </div>
          )}

        {(n.type_notify === NotificationType.SRTJ ||
          n.type_notify === NotificationType.SRT_ADVISOR) &&
          n.reply === "answered" && (
            <p
              className={`${
                n.note === "accepted" ? "text-green-500" : "text-red-500"
              } text-sm`}>
              {n.note === "accepted" ? "Đã chấp nhận." : "Đã từ chối."}
            </p>
          )}
        {(n.type_notify === NotificationType.SITJ_PDT ||
          n.type_notify === NotificationType.AITJ_PDT) &&
          n.reply === "answered" && (
            <p
              className={`${
                n.note === "accepted" ? "text-green-500" : "text-red-500"
              } text-sm`}>
              {n.note === "accepted" ? "Đã chấp nhận." : "Đã từ chối."}
            </p>
          )}

        <div className="flex flex-col items-end justify-end">
          {n.type_notify === NotificationType.CUSTOM_NOTIFICATION && n.note && (
            <p className="text-xs font-normal text-zinc-600">({n.note})</p>
          )}
          <p className="text-sm text-right font-normal text-zinc-600">
            {formatVNDateTime(n.createdAt)}
          </p>
        </div>

        {renderActionButtons()}
      </div>
    </div>
  );
};

export default UINotification;
