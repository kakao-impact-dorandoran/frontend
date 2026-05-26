import { createBrowserRouter } from "react-router";
import { RequireAuth } from "../lib/auth/RequireAuth";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import YouthDashboard from "./pages/YouthDashboard";
import YouthProfile from "./pages/YouthProfile";
import YouthMatching from "./pages/YouthMatching";
import YouthSchedule from "./pages/YouthSchedule";
import YouthConversations from "./pages/YouthConversations";
import YouthActivityJournal from "./pages/YouthActivityJournal";
import YouthMyInfo from "./pages/YouthMyInfo";
import YouthCallScreen from "./pages/YouthCallScreen";
import YouthSeniors from "./pages/YouthSeniors";
import SeniorTablet from "./pages/SeniorTablet";
import SeniorProfileSetup from "./pages/SeniorProfileSetup";
import GuardianDashboard from "./pages/GuardianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      { path: "/",                          Component: Home              },
      { path: "/login",                     Component: Login             },
      { path: "/signup",                    Component: Signup            },
      {
        element: <RequireAuth allowedRoles={["YOUTH"]} />,
        children: [
          { path: "/youth",                     Component: YouthDashboard    },
          { path: "/youth/profile",             Component: YouthProfile      },
          { path: "/youth/myinfo",              Component: YouthMyInfo       },
          { path: "/youth/call",                Component: YouthCallScreen   },
          { path: "/youth/matching",            Component: YouthMatching     },
          { path: "/youth/schedule",            Component: YouthSchedule     },
          { path: "/youth/conversations",       Component: YouthConversations },
          { path: "/youth/journal",             Component: YouthActivityJournal },
          { path: "/youth/seniors",             Component: YouthSeniors      },
        ],
      },
      { path: "/senior",                    Component: SeniorTablet      },
      { path: "/guardian/dashboard",         Component: GuardianDashboard  },
      { path: "/guardian/senior-profile",   Component: SeniorProfileSetup },
      {
        element: <RequireAuth allowedRoles={["ADMIN"]} />,
        children: [
          { path: "/admin",                   Component: AdminDashboard    },
        ],
      },
      { path: "/about",                     Component: About             },
      { path: "/pricing",                   Component: Pricing           },
      { path: "/faq",                       Component: FAQ               },
      { path: "/contact",                   Component: Contact           },
      { path: "*",                          Component: NotFound          },
    ],
  },
]);
