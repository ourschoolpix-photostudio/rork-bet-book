import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  console.log('tRPC Base URL:', baseUrl);
  console.log('All env vars:', process.env);
  
  if (baseUrl) {
    return baseUrl;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcReactClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('tRPC Request:', url, options?.method);
        return fetch(url, options).then(res => {
          console.log('tRPC Response:', res.status, res.statusText);
          return res;
        }).catch(err => {
          console.error('tRPC Fetch Error:', err);
          throw err;
        });
      },
    }),
  ],
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('tRPC Client Request:', url, options?.method);
        return fetch(url, options).then(res => {
          console.log('tRPC Client Response:', res.status, res.statusText);
          return res;
        }).catch(err => {
          console.error('tRPC Client Fetch Error:', err);
          throw err;
        });
      },
    }),
  ],
});
