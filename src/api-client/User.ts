import { useQuery } from "@tanstack/react-query";
import axios from "../Auth/Axios_Inceptor";
import { TypesLogin } from "../interface/types_login";
import { RegisterInput } from "../utils/register-schema";

export const Login = async (data: TypesLogin) => {
  return await axios.post("/auth/login", data);
};

export const FetchUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: Get,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

export const Get = async () => {
  return await axios.get("/auth/login");
};

export const Logout = async (endpoint: string) => {
  return await axios.post("/auth/logout", { endpoint });
};

export const Register = async (data: RegisterInput) => {
  return await axios.post("/auth/register", data);
};
