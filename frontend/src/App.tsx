import { createBrowserRouter, Navigate } from "react-router";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/PrivateRoute";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { AdvisoriesList } from "@/pages/AdvisoriesList";
import { AdvisoryDetail } from "@/pages/AdvisoryDetail";
import { AdvisoryForm } from "@/pages/AdvisoryForm";
import { Users } from "@/pages/Users";
import { AuditLogs } from "@/pages/AuditLogs";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "advisories", element: <AdvisoriesList /> },
      { path: "advisories/new", element: <AdvisoryForm /> },
      { path: "advisories/:id", element: <AdvisoryDetail /> },
      { path: "advisories/:id/edit", element: <AdvisoryForm /> },
      {
        path: "users",
        element: (
          <AdminRoute>
            <Users />
          </AdminRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <AdminRoute>
            <AuditLogs />
          </AdminRoute>
        ),
      },
    ],
  },
]);
