import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { createContext } from "@/backend/trpc/create-context";

console.log('🚀 [1/5] Starting Hono backend server...');

const app = new Hono();

console.log('🚀 [2/5] Hono app initialized');

app.use("*", cors());

console.log('🚀 [3/5] CORS configured');

app.use("*", async (c, next) => {
  const start = Date.now();
  console.log(`📥 ${c.req.method} ${c.req.url}`);
  await next();
  const duration = Date.now() - start;
  console.log(`📤 ${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
});

console.log('🚀 [4/5] Request logger configured');

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

app.get("/health", (c) => {
  return c.json({ 
    status: "healthy", 
    uptime: process.uptime(), 
    timestamp: new Date().toISOString() 
  });
});

console.log('🚀 [5/5] Setting up tRPC...');

const setupTRPC = async () => {
  try {
    const { appRouter } = await import("@/backend/trpc/app-router");
    
    app.use(
      "/api/trpc/*",
      trpcServer({
        router: appRouter,
        createContext,
      })
    );
    
    console.log('✅ tRPC configured successfully');
  } catch (error) {
    console.error('❌ Failed to setup tRPC:', error);
    throw error;
  }
};

setupTRPC().catch((error) => {
  console.error('❌ Critical error during tRPC setup:', error);
});

console.log('✅ Hono backend server ready');

export default app;
