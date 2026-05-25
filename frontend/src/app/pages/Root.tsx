import { Outlet, useLocation } from "react-router";
import { PageTransition } from "../components/PageTransition";
import { AuthProvider } from "../../lib/auth/AuthContext";

export default function Root() {
  const location = useLocation();
  return (
    <AuthProvider>
      <PageTransition pageKey={location.pathname}>
        <Outlet />
      </PageTransition>
    </AuthProvider>
  );
}
