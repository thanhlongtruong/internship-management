"use client";

import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

import { useMutation } from "@tanstack/react-query";

import { TypesLogin, TypesLoginError } from "@/interface/types_login";
import { Login } from "@/api-client/User";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PageLogin() {
  const router = useRouter();

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setError: setErrorLogin,
    formState: { errors: errorsLogin },
  } = useForm<TypesLogin>();

  const mutationLogin = useMutation({
    mutationFn: Login,
    onSuccess: (response) => {
      const { msg, url } = response.data;
      toast.success(msg);
      router.replace(url);
    },
    onError: (error: AxiosError<TypesLoginError>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Đăng nhập thất bại.");
      } else {
        const { type, msg } = error.response?.data;

        setErrorLogin(`${type}`, {
          message: msg,
        });
      }
    },
  });

  const submitLogin: SubmitHandler<TypesLogin> = async (data) => {
    if (mutationLogin.isPending) return;
    mutationLogin.mutate(data);
  };

  return (
    <div className="max-w-[85.375rem] mx-auto">
      <Toaster position="bottom-center" richColors />
      <div className="md:w-1/2 lg:w-1/3 w-full p-4 md:p-0 mx-auto">
        <div className="gap-y-10 h-fit flex flex-col items-start py-6">
          <p className="w-full text-4xl font-extrabold uppercase text-stone-600">
            Đăng nhập
          </p>
          <form
            className="w-full flex flex-col gap-y-6"
            onSubmit={handleSubmitLogin(submitLogin)}>
            <div className="w-full inputBox">
              <input
                className={`${errorsLogin.email ? "inputTagBug" : "inputTag"}`}
                type="text"
                required
                {...registerLogin("email", {
                  required: "Vui lòng nhập Email.",
                })}
              />
              <span className="spanTag">Email</span>
              <div
                className={`${
                  errorsLogin.email
                    ? "h-fit opacity-100 mt-1"
                    : "h-0 overflow-hidden opacity-0"
                } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                <p className="text-base text-rose-500">*</p>
                <p className="text-sm">{errorsLogin?.email?.message}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="w-full inputBox">
                <input
                  className={`${
                    errorsLogin.password ? "inputTagBug" : "inputTag"
                  }`}
                  type="password"
                  required
                  {...registerLogin("password", {
                    required: "Vui lòng nhâp mật khẩu.",
                  })}
                />
                <span className="spanTag">Mật khẩu</span>
                <div
                  className={`${
                    errorsLogin.password
                      ? "h-fit opacity-100 mt-1"
                      : "h-0 overflow-hidden opacity-0"
                  } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                  <p className="text-base text-rose-500">*</p>
                  <p className="text-sm">{errorsLogin?.password?.message}</p>
                </div>
              </div>
              <p className="h-fit text-sm cursor-pointer">Quên mật khẩu?</p>
            </div>

            <div className="boxLogRes">
              <button className="styleLogin" type="submit">
                {mutationLogin.isPending ? (
                  <Bouncy size="30" speed="1.75" color="white" />
                ) : (
                  <p className="h-fit text-sm flex justify-center items-center uppercase cursor-pointer">
                    Đăng nhập
                  </p>
                )}
              </button>
              <Link href="/register" className="styleRes">
                <p className="h-fit text-sm flex justify-center items-center uppercase cursor-pointer">
                  Đăng ký
                </p>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PageLogin;
