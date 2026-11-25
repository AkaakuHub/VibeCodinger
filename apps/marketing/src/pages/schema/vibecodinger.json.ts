import type { APIRoute } from "astro";

import { buildVibeCodingerProjectFileJsonSchema } from "@vibecodinger/shared/vibeCodingerProjectFile";

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(buildVibeCodingerProjectFileJsonSchema(), null, 2)}\n`, {
    headers: { "Content-Type": "application/json" },
  });
