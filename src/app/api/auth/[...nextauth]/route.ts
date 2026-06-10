// Route handler NextAuth — délègue à la config centrale.
import { handlers } from "@/lib/auth/config";

export const { GET, POST } = handlers;
