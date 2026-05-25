import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { routeForRole } from "./routes";
import type { UserRole } from "../../types/api";

type RequireAuthProps = {
  allowedRoles?: UserRole[];
  children?: ReactNode;
};

export function RequireAuth({ allowedRoles, children }: RequireAuthProps) {
  const location = useLocation();
  const { status, user } = useAuth();

  if (status === "idle" || status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}
      >
        <p className="text-sm text-gray-500">로그인 상태를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={routeForRole(user.role, user)} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
