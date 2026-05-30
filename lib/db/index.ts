import { createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || "https://insforge.tirulescu.com";
const apiKey = process.env.INSFORGE_API_KEY || "";

export const insforge = createAdminClient({ baseUrl, apiKey });
export * from "./types";
