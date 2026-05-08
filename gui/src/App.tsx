import { RouterProvider, createMemoryRouter } from "react-router-dom";
import Layout from "./components/Layout";
import { MainEditorProvider } from "./components/mainInput/TipTapEditor";
import { AuthProvider } from "./context/Auth";
import { IdeMessengerProvider } from "./context/IdeMessenger";
import { LocalStorageProvider } from "./context/LocalStorage";
import { SubmenuContextProvidersProvider } from "./context/SubmenuContextProviders";
import { VscThemeProvider } from "./context/VscTheme";
import ParallelListeners from "./hooks/ParallelListeners";
import ConfigPage from "./pages/config";
import ErrorPage from "./pages/error";
import Chat from "./pages/gui";
import History from "./pages/history";
import Login from "./pages/Login";
import Stats from "./pages/stats";
import ThemePage from "./styles/ThemePage";
import { ROUTES } from "./util/navigation";

const router = createMemoryRouter([
  {
    path: ROUTES.HOME,
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/index.html",
        element: <Chat />,
      },
      {
        path: ROUTES.HOME,
        element: <Chat />,
      },
      {
        path: "/history",
        element: <History />,
      },
      {
        path: ROUTES.STATS,
        element: <Stats />,
      },
      {
        path: ROUTES.CONFIG,
        element: <ConfigPage />,
      },
      {
        path: ROUTES.THEME,
        element: <ThemePage />,
      },
      {
        path: "/login",
        element: <Login loginAction={() => Promise.resolve(true)} />, // 登录页路由，具体逻辑在 Layout 中处理
      },
    ],
  },
]);

/*
  ParallelListeners prevents entire app from rerendering on any change in the listeners,
  most of which interact with redux etc.
*/
function App() {
  return (
    <IdeMessengerProvider>
      <LocalStorageProvider>
        <AuthProvider>
          <VscThemeProvider>
            <MainEditorProvider>
              <SubmenuContextProvidersProvider>
                <RouterProvider router={router} />
              </SubmenuContextProvidersProvider>
            </MainEditorProvider>
            <ParallelListeners />
          </VscThemeProvider>
        </AuthProvider>
      </LocalStorageProvider>
    </IdeMessengerProvider>
  );
}

export default App;
