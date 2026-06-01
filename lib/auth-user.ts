import type { UserSchema } from "@insforge/shared-schemas";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export function mapInsforgeUser(user: UserSchema): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name || undefined,
    image: user.profile?.avatar_url || undefined,
  };
}
