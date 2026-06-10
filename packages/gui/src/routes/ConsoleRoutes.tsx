import { useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthGate from "../components/Auth/AuthGate";
import AppConfigBridge from "../components/Root/AppConfigBridge";
import { useAppConfig } from "../contexts/AppConfigContext";
import { AuthProvider } from "../contexts/AuthContext";
import { AppLayout } from "../layouts/AppLayout";
import { DebugPage } from "../pages/DebugPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PluginPage } from "../pages/PluginPage";

const ConsoleRoutes = () => {
  const { pluginPages } = useAppConfig();

  const sortedPages = useMemo(
    () => [...pluginPages].sort((a, b) => b.path.length - a.path.length),
    [pluginPages],
  );

  return (
    <AuthProvider>
      <AuthGate>
        <AppConfigBridge>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={<Navigate to="/overview/overview" replace />}
              />
              <Route path="/debug" element={<DebugPage />} />
              {sortedPages.map((page) => (
                <Route
                  key={page.id}
                  path={`/${page.path}/*`}
                  element={
                    <PluginPage
                      scope={page.scope}
                      module={page.module}
                      pluginKey={page.pluginKey}
                    />
                  }
                />
              ))}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AppConfigBridge>
      </AuthGate>
    </AuthProvider>
  );
};

export default ConsoleRoutes;
