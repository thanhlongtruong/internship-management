import axios from "../Auth/Axios_Inceptor";

export const PushSubscription = async (subscription: object) => {
  return await axios.post("/subscribe-noti", { subscription });
};
