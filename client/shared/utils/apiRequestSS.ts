//Server imports
//This is a server-side version of the apiRequest function
//ONLY USE ON THE SERVER (e.g., in Next.js API routes or server components)

import { cookies, headers } from "next/headers";
import { ApiRequestConfig } from "./apiRequest";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function apiRequestSS<T>({
  method,
  url,
  data,
  params,
  customHeaders,
  responseType,
}: ApiRequestConfig): Promise<T> {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  // Build URL with params if provided
  let fullUrl: string;
  if (apiBaseUrl.startsWith("http")) {
    fullUrl = `${apiBaseUrl}${url}`;
  } else {
    // Get current host from request headers for relative paths
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    fullUrl = `${protocol}://${host}${apiBaseUrl}${url}`;
  }

  const urlWithParams = new URL(fullUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlWithParams.searchParams.set(key, String(value));
      }
    });
  }

  // Build request configuration
  const requestConfig: RequestInit = {
    method: method.toUpperCase(),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieString,
      ...customHeaders,
    },
  };

  // Add body for POST, PUT, PATCH requests
  if (data && ["post", "put", "patch"].includes(method.toLowerCase())) {
    requestConfig.body = JSON.stringify(data);
  }
  const response = await fetch(urlWithParams.toString(), requestConfig);

  if (!response.ok) {
    console.error(response);
    throw new Error(`HTTP error! status: ${response}`);
  }

  // Handle different response types
  if (responseType === "text") {
    return (await response.text()) as T;
  } else if (responseType === "blob") {
    return (await response.blob()) as T;
  } else if (responseType === "arraybuffer") {
    return (await response.arrayBuffer()) as T;
  } else {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    } else {
      throw new Error("Response is not valid JSON");
    }
  }
}
