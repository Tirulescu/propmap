import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { insforgeSessionOptions } from "@/lib/auth-config";

export const { POST } = createRefreshAuthRouter(insforgeSessionOptions);
