import { Outlet, useLocation } from "react-router";
import { PageTransition } from "../components/PageTransition";

export default function Root() {
  const location = useLocation();
  return (
    <PageTransition pageKey={location.pathname}>
      <Outlet />
    </PageTransition>
  );
}
