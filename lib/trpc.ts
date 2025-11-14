import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  console.log('tRPC Base URL:', baseUrl);
  
  if (baseUrl) {
    return baseUrl;
  }

  console.error('❌ EXPO_PUBLIC_RORK_API_BASE_URL not found in environment');
  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcReactClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🔵 tRPC Request:', url, options?.method);
        try {
          const res = await fetch(url, options);
          console.log('✅ tRPC Response:', res.status, res.statusText);
          
          if (!res.ok) {
            const textPreview = await res.clone().text();
            console.error('❌ Non-OK Response Body:', textPreview.substring(0, 500));
          }
          
          return res;
        } catch (err) {
          console.error('❌ tRPC Fetch Error:', err);
          console.error('❌ Failed URL:', url);
          throw err;
        }
      },
    }),
  ],
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🔵 tRPC Client Request:', url, options?.method);
        
        try {
          const res = await fetch(url, options);
          console.log('✅ tRPC Client Response:', res.status, res.statusText);
          
          const clone = res.clone();
          try {
            const text = await clone.text();
            console.log('📄 Response Body Preview:', text.substring(0, 500));
            
            if (text.startsWith('<') || text.startsWith('<!')) {
              console.error('❌ ERROR: Received HTML instead of JSON. Backend may not be running or URL is incorrect.');
              console.error('❌ Expected URL:', `${getBaseUrl()}/api/trpc`);
            }
          } catch (e) {
            console.error('❌ Failed to read response body for logging:', e);
          }
          
          return res;
        } catch (err) {
          console.error('❌ tRPC Fetch Network Error:', err);
          console.error('❌ Failed URL:', url);
          console.error('❌ Base URL:', getBaseUrl());
          throw err;
        }
      },
    }),
  ],
});
