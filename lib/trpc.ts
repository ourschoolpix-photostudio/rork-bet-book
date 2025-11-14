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
          
          if (!res.ok) {
            const clone = res.clone();
            const text = await clone.text();
            console.error('❌ Non-OK Response Status:', res.status);
            console.error('❌ Response Body:', text.substring(0, 1000));
            
            if (!text || text.trim() === '') {
              throw new Error(`Empty response from server (Status: ${res.status})`);
            }
            
            if (text.startsWith('<') || text.startsWith('<!')) {
              throw new Error('Backend returned HTML instead of JSON. The backend may not be running or the URL is incorrect.');
            }
            
            try {
              JSON.parse(text);
            } catch (e) {
              throw new Error(`Server returned invalid JSON (Status: ${res.status}): ${text.substring(0, 100)}`);
            }
          } else {
            const clone = res.clone();
            try {
              const text = await clone.text();
              console.log('📄 Response Body Preview:', text.substring(0, 500));
              
              if (!text || text.trim() === '') {
                console.error('⚠️ WARNING: Empty response body with OK status');
              } else if (text.startsWith('<') || text.startsWith('<!')) {
                console.error('⚠️ WARNING: Received HTML instead of JSON');
                throw new Error('Backend returned HTML instead of JSON. The backend may not be running correctly.');
              } else {
                try {
                  JSON.parse(text);
                } catch (e) {
                  console.error('⚠️ WARNING: Response is not valid JSON:', text.substring(0, 100));
                  throw new Error(`Server returned invalid JSON: ${text.substring(0, 100)}`);
                }
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('JSON')) {
                throw e;
              }
              console.error('❌ Failed to read response body for logging:', e);
            }
          }
          
          return res;
        } catch (err) {
          console.error('❌ tRPC Fetch Error:', err);
          console.error('❌ Failed URL:', url);
          console.error('❌ Base URL:', getBaseUrl());
          throw err;
        }
      },
    }),
  ],
});
