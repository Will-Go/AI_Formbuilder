"use client";
//THIS FUNCTION IS USED FOR AUTHENTICATED USERS
import axios, { AxiosProgressEvent } from "axios";
import axiosInstance from "@/shared/services/axiosService";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface ApiRequestConfig<T = unknown> {
  method: HttpMethod;
  url: string;
  data?: T;
  params?: Record<string, string | number | boolean | undefined | null>;
  customHeaders?: Record<string, string>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  responseType?:
    | "arraybuffer"
    | "document"
    | "json"
    | "text"
    | "stream"
    | "blob";
  timeout?: number;
}

export async function apiRequest<T>({
  method,
  url,
  data,
  params,
  customHeaders,
  onUploadProgress,
  timeout,
}: ApiRequestConfig): Promise<T> {
  try {
    // Make the request
    const response = await axiosInstance({
      method,
      url,
      data,

      params, // Pass params to the request
      headers: {
        ...customHeaders,
      },
      onUploadProgress,
      timeout,
    });

    return response?.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = error?.response?.data?.error;
      throw new Error(errorMsg || "unexpected_error").message;
    }
    throw new Error("unexpected_error").message;
  }
}
