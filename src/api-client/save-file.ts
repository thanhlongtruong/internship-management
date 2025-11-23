import axios from "../Auth/Axios_Inceptor";

interface typeSaveFile {
  url: string;
  name: string;
}
export const saveFile = async (data: typeSaveFile) => {
  return await axios.post("/save-file", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getFile = async () => {
  return await axios.get("/save-file");
};
