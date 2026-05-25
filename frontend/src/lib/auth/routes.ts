import type { AuthUserResponse, UserRole } from "../../types/api";

export function routeForRole(role: UserRole, user?: AuthUserResponse | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "GUARDIAN":
      return "/guardian/dashboard";
    case "YOUTH":
      if (user && user.approvalStatus == null) return "/youth/profile";
      return "/youth";
    default:
      return "/";
  }
}
