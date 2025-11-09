import "express-session";
import { User } from "@shared/api";

declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}
