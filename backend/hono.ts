import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import superjson from "superjson";

console.log('🚀 Starting Hono backend server...');

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  console.log(`📥 ${c.req.method} ${c.req.url}`);
  await next();
  console.log(`📤 ${c.req.method} ${c.req.url} - ${c.res.status}`);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    transformer: superjson,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

console.log('✅ Hono backend server configured');

export default app;
