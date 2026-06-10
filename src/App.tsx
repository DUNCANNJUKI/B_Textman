import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Devices from "@/pages/Devices";
import DeviceDetail from "@/pages/DeviceDetail";
import Messages from "@/pages/Messages";
import BulkSms from "@/pages/BulkSms";
import ApiKeys from "@/pages/ApiKeys";
import Clients from "@/pages/Clients";
import Analytics from "@/pages/Analytics";
import Logs from "@/pages/Logs";
import Settings from "@/pages/Settings";
import ApiDocs from "@/pages/ApiDocs";
import Webhooks from "@/pages/Webhooks";
import AndroidClient from "@/pages/AndroidClient";
import MessageTrace from "@/pages/MessageTrace";
import NotFound from "@/pages/NotFound";

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/:id" element={<DeviceDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/bulk-sms" element={<BulkSms />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/webhooks" element={<Webhooks />} />
              <Route path="/android-client" element={<AndroidClient />} />
              <Route path="/message-trace" element={<MessageTrace />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
