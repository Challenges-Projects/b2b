import axios, { AxiosInstance } from "axios";

export const createHttpClient = (baseURL: string, token?: string): AxiosInstance => {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 10000,
  });
};
