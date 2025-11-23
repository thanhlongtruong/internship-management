"use client";

import React, { useState } from "react";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster, toast } from "sonner";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

import { useMutation } from "@tanstack/react-query";

import { TypesRegisterError } from "@/interface/types_register";
import { Universities } from "@/utils/university";
import { Role } from "@/utils/role";
import { Major } from "@/utils/major";
import { Faculty } from "@/utils/faculty";
import { removeAccents } from "@/utils/remove-accents";
import { Register } from "@/api-client/User";
import { AxiosError } from "axios";
import { RegisterInput, RegisterSchema } from "@/utils/register-schema";
import { useRouter } from "next/navigation";
import Link from "next/link";


function PageRegister() {
  const router = useRouter();

  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    setError: setErrorRegister,
    watch: watchRegister,
    control,
    formState: { errors: errorsRegister },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
  });

  const [isShowListUniversity, setShowListUniversity] =
    useState<boolean>(false);

  const mutationRegister = useMutation({
    mutationFn: Register,
    onSuccess: (response) => {
      toast.success(response?.data?.msg);
      router.push("/login");
    },
    onError: (error: AxiosError<TypesRegisterError>) => {
      if (!error.response || error?.status === 500) {
        toast.error("Đăng ký thất bại.");
      } else if (error.response) {
        const { type, msg } = error.response.data;
        setErrorRegister(`root.${type}`, {
          message: msg,
        });
      }
    },
  });

  const submitRegister: SubmitHandler<RegisterInput> = (data) => {
    mutationRegister.mutate(data);
  };

  return (
    <div className="max-w-[85.375rem] mx-auto">
      <Toaster position="bottom-center" richColors />
      <div className="md:w-1/2 lg:w-1/3 w-full h-fit px-4 py-6 md:px-0 mx-auto gap-y-10 flex flex-col">
        <p className="w-full text-4xl font-extrabold uppercase text-stone-600">
          Đăng ký
        </p>
        <form
          className="w-full flex flex-col gap-y-6"
          onSubmit={handleSubmitRegister(submitRegister)}>
          <div className="inputBox w-full">
            <input
              className={`${errorsRegister.name ? "inputTagBug" : "inputTag"}`}
              type="text"
              required
              autoComplete="off"
              placeholder="..."
              {...registerRegister("name")}
            />
            <span className="spanTag">Họ tên</span>

            <div
              className={`${
                errorsRegister.name
                  ? "h-fit opacity-100 mt-1"
                  : "h-0 overflow-hidden opacity-0"
              } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
              <p className="text-base text-rose-500">*</p>
              <p className="text-sm">{errorsRegister?.name?.message}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-wrap gap-y-6 justify-between">
            <Controller
              name="gender"
              control={control}
              defaultValue=""
              rules={{ required: "Vui lòng chọn giới tính." }}
              render={({ field }) => (
                <div className="inputBox w-full md:w-[48%]">
                  <select
                    {...field}
                    required
                    className={`${
                      errorsRegister.gender ? "inputTagBug" : "inputTag"
                    }`}>
                    <option value="" disabled>
                      -- Giới tính --
                    </option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <span className="spanTag">Giới tính</span>
                  <div
                    className={`${
                      errorsRegister.gender
                        ? "h-fit opacity-100 mt-1"
                        : "h-0 overflow-hidden opacity-0"
                    } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                    <p className="text-base text-rose-500">*</p>
                    <p className="text-sm">{errorsRegister?.gender?.message}</p>
                  </div>
                </div>
              )}
            />

            <div className="inputBox w-full md:w-[48%]">
              <input
                className={`${
                  errorsRegister.birthday ? "inputTagBug" : "inputTag"
                }`}
                type="date"
                required
                {...registerRegister("birthday")}
              />
              <span className="spanTag">Ngày sinh</span>
              <div
                className={`${
                  errorsRegister.birthday
                    ? "h-fit opacity-100 mt-1"
                    : "h-0 overflow-hidden opacity-0"
                } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                <p className="text-base text-rose-500">*</p>
                <p className="text-sm">{errorsRegister?.birthday?.message}</p>
              </div>
            </div>
          </div>

          <Controller
            name="school"
            control={control}
            defaultValue=""
            rules={{ required: "Vui lòng chọn 1 trường." }}
            render={({ field }) => (
              <div className="w-full inputBox">
                <input
                  {...field}
                  required
                  autoComplete="off"
                  placeholder="..."
                  className={`${
                    errorsRegister.school ? "inputTagBug" : "inputTag"
                  }`}
                  type="text"
                  {...registerRegister("school", {
                    onBlur: () => setShowListUniversity(false),
                  })}
                  onFocus={() => {
                    setShowListUniversity(true);
                  }}
                />
                <span className="spanTag">Trường</span>
                <div
                  className={`${
                    isShowListUniversity ? "scale-y-100" : "scale-y-0"
                  } origin-top absolute z-10 h-fit max-h-52 top-14 duration-500 transition-all rounded-md border overflow-y-auto overscroll-y-none bg-white w-full`}>
                  {(watchRegister("school")?.trim() === ""
                    ? Universities
                    : Universities?.filter((u) =>
                        removeAccents(u?.name.toLowerCase()).includes(
                          removeAccents(
                            watchRegister("school")?.trim()?.toLowerCase() ?? ""
                          )
                        )
                      )
                  ).length > 0 ? (
                    (watchRegister("school")?.trim() === ""
                      ? Universities
                      : Universities?.filter((u) =>
                          removeAccents(u?.name.toLowerCase()).includes(
                            removeAccents(
                              watchRegister("school")?.trim()?.toLowerCase() ??
                                ""
                            )
                          )
                        )
                    ).map((u, i) => (
                      <p
                        onClick={() => {
                          field.onChange(u.name);
                          setShowListUniversity(false);
                        }}
                        className="my-1 text-black cursor-pointer hover:bg-stone-100 py-2 px-3"
                        key={i}>
                        {u.name}
                      </p>
                    ))
                  ) : (
                    <p className="py-5 px-3 text-center">Không tìm thấy!</p>
                  )}
                </div>
                <div
                  className={`${
                    errorsRegister.school
                      ? "h-fit opacity-100 mt-1"
                      : "h-0 overflow-hidden opacity-0"
                  } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                  <p className="text-base text-rose-500">*</p>
                  <p className="text-sm">{errorsRegister?.school?.message}</p>
                </div>
              </div>
            )}
          />

          <div className="w-full flex flex-col md:flex-row gap-y-6 md:justify-between">
            <Controller
              name="role"
              control={control}
              defaultValue=""
              rules={{ required: "Vui lòng chọn vai trò." }}
              render={({ field }) => (
                <div
                  className={`inputBox ${
                    watchRegister("role") === "sv" ? "md:w-[48%]" : "w-full"
                  }`}>
                  <select
                    {...field}
                    required
                    className={`${
                      errorsRegister.role ? "inputTagBug" : "inputTag"
                    }`}>
                    <option value="" disabled>
                      -- Bạn là ...? --
                    </option>
                    {Role.map((r, i) => (
                      <option key={i} value={r.id}>
                        {r.value}
                      </option>
                    ))}
                  </select>
                  <span className="spanTag">Vai trò</span>
                  <div
                    className={`${
                      errorsRegister.role
                        ? "h-fit opacity-100 mt-1"
                        : "h-0 overflow-hidden opacity-0"
                    } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                    <p className="text-base text-rose-500">*</p>
                    <p className="text-sm">{errorsRegister?.role?.message}</p>
                  </div>
                </div>
              )}
            />

            <div
              className={`w-full md:w-[48%] ${
                watchRegister("role") === "sv"
                  ? "scale-x-100 inputBox"
                  : "scale-x-0 absolute"
              } origin-left duration-700 transition-transform`}>
              <input
                className={`${
                  errorsRegister.cohort ? "inputTagBug" : "inputTag"
                }`}
                type="number"
                required={watchRegister("role") === "sv" ? true : false}
                placeholder="yyyy"
                {...(watchRegister("role") !== "sv"
                  ? {}
                  : registerRegister("cohort"))}
              />
              <span className="spanTag">Khóa</span>
              <div
                className={`${
                  errorsRegister.cohort
                    ? "h-fit opacity-100 mt-1"
                    : "h-0 overflow-hidden opacity-0"
                } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                <p className="text-base text-rose-500">*</p>
                <p className="text-sm">{errorsRegister?.cohort?.message}</p>
              </div>
            </div>
          </div>

          <Controller
            name="major"
            control={control}
            defaultValue=""
            rules={
              watchRegister("role") === "sv"
                ? { required: "Vui lòng chọn ngành." }
                : {}
            }
            render={({ field }) => (
              <div
                className={`${
                  watchRegister("role") === "sv"
                    ? "scale-y-100 inputBox"
                    : "scale-y-100 hidden"
                } origin-top duration-700 transition-all w-full`}>
                <select
                  {...(watchRegister("role") === "sv" ? field : {})}
                  required={watchRegister("role") === "sv" ? true : false}
                  className={`${
                    errorsRegister.faculty ? "inputTagBug" : "inputTag"
                  }`}>
                  <option value="" disabled>
                    -- Bạn học ngành nào? --
                  </option>
                  {Major.map((m, i) => (
                    <option key={i} value={m.value}>
                      {m.value}
                    </option>
                  ))}
                </select>
                <span className="spanTag">Ngành</span>
                <div
                  className={`${
                    errorsRegister.major
                      ? "h-fit opacity-100 mt-1"
                      : "h-0 overflow-hidden opacity-0"
                  } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                  <p className="text-base text-rose-500">*</p>
                  <p className="text-sm">{errorsRegister?.major?.message}</p>
                </div>
              </div>
            )}
          />

          <Controller
            name="faculty"
            control={control}
            defaultValue=""
            rules={
              watchRegister("role") === "gv"
                ? { required: "Vui lòng chọn khoa." }
                : {}
            }
            render={({ field }) => (
              <div
                className={`${
                  watchRegister("role") === "gv"
                    ? "scale-y-100 inputBox block"
                    : "scale-y-0 hidden"
                } origin-top duration-700 transition-transform w-full`}>
                <select
                  required={
                    watchRegister("role") === "gv"
                      ? true
                      : false
                  }
                  {...(watchRegister("role") === "gv"
                    ? field
                    : {})}
                  className={`${
                    errorsRegister.faculty ? "inputTagBug" : "inputTag"
                  }`}>
                  <option value="" disabled>
                    -- Bạn ở khoa nào? --
                  </option>
                  {Faculty.map((f, i) => (
                    <option
                      key={i}
                      value={f.value}
                      className="hover:bg-amber-200">
                      {f.value}
                    </option>
                  ))}
                </select>
                <span className="spanTag">Khoa</span>
                <div
                  className={`${
                    errorsRegister.faculty
                      ? "h-fit opacity-100 mt-1"
                      : "h-0 overflow-hidden opacity-0"
                  } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
                  <p className="text-base text-rose-500">*</p>
                  <p className="text-sm">{errorsRegister?.faculty?.message}</p>
                </div>
              </div>
            )}
          />

          <div className="w-full inputBox">
            <input
              className={`${errorsRegister.email ? "inputTagBug" : "inputTag"}`}
              type="email"
              required
              placeholder="..."
              autoComplete="email"
              {...registerRegister("email")}
            />
            <span className="spanTag">Email</span>
            <div
              className={`${
                errorsRegister.email
                  ? "h-fit opacity-100 mt-1"
                  : "h-0 overflow-hidden opacity-0"
              } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
              <p className="text-base text-rose-500">*</p>
              <p className="text-sm">{errorsRegister?.email?.message}</p>
            </div>
          </div>

          <div className="w-full inputBox">
            <input
              className={`${
                errorsRegister.password ? "inputTagBug" : "inputTag"
              }`}
              type="password"
              required
              placeholder="..."
              autoComplete="new-password"
              {...registerRegister("password")}
            />
            <span className="spanTag">Mật khẩu</span>
            <div
              className={`${
                errorsRegister.password
                  ? "h-fit opacity-100 mt-1"
                  : "h-0 overflow-hidden opacity-0"
              } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
              <p className="text-base text-rose-500">*</p>
              <p className="text-sm">{errorsRegister?.password?.message}</p>
            </div>
          </div>

          <div className="w-full inputBox">
            <input
              className={`${
                errorsRegister.passwordConfirm ? "inputTagBug" : "inputTag"
              }`}
              type="password"
              autoComplete="new-password"
              placeholder="..."
              required
              {...registerRegister("passwordConfirm")}
            />
            <span className="spanTag">Xác nhận mật khẩu</span>
            <div
              className={`${
                errorsRegister.passwordConfirm
                  ? "h-fit opacity-100 mt-1"
                  : "h-0 overflow-hidden opacity-0"
              } duration-700 ease-linear transition-all flex items-start gap-1 w-full`}>
              <p className="text-base text-rose-500">*</p>
              <p className="text-sm">
                {errorsRegister?.passwordConfirm?.message}
              </p>
            </div>
          </div>

          <div className="boxLogRes">
            <Link href="/login" className="styleRes">
              <p className="h-fit text-sm flex justify-center items-center uppercase cursor-pointer">
                Đăng nhập
              </p>
            </Link>
            <button className="styleLogin" type="submit">
              {mutationRegister.isPending ? (
                <Bouncy size="30" speed="1.75" color="white" />
              ) : (
                <p className="h-fit text-sm flex justify-center items-center uppercase cursor-pointer">
                  Đăng ký
                </p>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PageRegister;
