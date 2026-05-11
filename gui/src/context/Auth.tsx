import {
  ProfileDescription,
  SerializedOrgWithProfiles,
} from "core/config/ProfileLifecycleManager";
import { ControlPlaneSessionInfo } from "core/control-plane/AuthTypes";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useWebviewListener } from "../hooks/useWebviewListener";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setConfigLoading } from "../redux/slices/configSlice";
import {
  selectCurrentOrg,
  selectSelectedProfile,
  setOrganizations,
  setSelectedOrgId,
} from "../redux/slices/profilesSlice";
import { IdeMessengerContext } from "./IdeMessenger";

interface AuthContextType {
  session: ControlPlaneSessionInfo | undefined;
  isSessionLoading: boolean;
  isInitialLoading: boolean;
  hasCachedSession: boolean;
  loginRequired: boolean;
  logout: () => void;
  login: (useOnboarding: boolean) => Promise<boolean>;
  selectedProfile: ProfileDescription | null;
  profiles: ProfileDescription[] | null;
  refreshProfiles: (reason?: string) => Promise<void>;
  organizations: SerializedOrgWithProfiles[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_SESSION_CACHE_KEY = "continue.auth.hasSession";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const ideMessenger = useContext(IdeMessengerContext);
  // Session
  const [session, setSession] = useState<ControlPlaneSessionInfo | undefined>(
    undefined,
  );
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasCachedSession, setHasCachedSession] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(AUTH_SESSION_CACHE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [loginRequired, setLoginRequired] = useState(true);

  // Orgs
  const orgs = useAppSelector((store) => store.profiles.organizations);

  // Profiles
  const currentOrg = useAppSelector(selectCurrentOrg);
  const selectedProfile = useAppSelector(selectSelectedProfile);

  const setSessionCache = (hasSession: boolean) => {
    setHasCachedSession(hasSession);
    try {
      if (hasSession) {
        window.localStorage.setItem(AUTH_SESSION_CACHE_KEY, "1");
      } else {
        window.localStorage.removeItem(AUTH_SESSION_CACHE_KEY);
      }
    } catch {
      // ignore persistence failures
    }
  };

  const login: AuthContextType["login"] = async (useOnboarding: boolean) => {
    setIsSessionLoading(true);
    try {
      const result = await ideMessenger.request("getControlPlaneSessionInfo", {
        silent: false,
        useOnboarding,
      });

      if (result.status === "error") {
        console.error("Login failed:", result.error);
        setSession(undefined);
        setSessionCache(false);
        return false;
      }

      const session = result.content;
      setSession(session);
      setSessionCache(Boolean(session));
      return Boolean(session);
    } catch (error: any) {
      console.error("Login request failed:", error);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  };

  const logout = () => {
    React.startTransition(() => {
      ideMessenger.post("logoutOfControlPlane", undefined);
      dispatch(setOrganizations(orgs.filter((org) => org.id === "personal")));
      dispatch(setSelectedOrgId("personal"));
      setSession(undefined);
      setSessionCache(false);
      setIsSessionLoading(false);
    });
  };

  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      try {
        const [sessionResult, envResult] = await Promise.all([
          ideMessenger.request("getControlPlaneSessionInfo", {
            silent: true,
            useOnboarding: false,
          }),
          ideMessenger.request("controlPlane/getEnvironment", undefined),
        ]);

        if (sessionResult.status === "success") {
          setSession(sessionResult.content);
          setSessionCache(Boolean(sessionResult.content));
        } else {
          setSession(undefined);
          setSessionCache(false);
        }

        if (envResult.status === "success") {
          setLoginRequired(envResult.content.LOGIN_REQUIRED ?? true);
        }
      } catch {
        setSession(undefined);
        setSessionCache(false);
      } finally {
        setIsInitialLoading(false);
      }
    }
    void init();
  }, [ideMessenger]);

  useWebviewListener(
    "sessionUpdate",
    async (data) => {
      React.startTransition(() => {
        setSession(data.sessionInfo);
        setSessionCache(Boolean(data.sessionInfo));
        setIsInitialLoading(false);
        setIsSessionLoading(false);
      });
    },
    [],
  );

  const refreshProfiles = useCallback(
    async (reason?: string) => {
      try {
        dispatch(setConfigLoading(true));
        await ideMessenger.request("config/refreshProfiles", {
          reason,
        });
        ideMessenger.post("showToast", ["info", "Config refreshed"]);
      } catch (e) {
        console.error("Failed to refresh profiles", e);
        ideMessenger.post("showToast", ["error", "Failed to refresh config"]);
      } finally {
        dispatch(setConfigLoading(false));
      }
    },
    [ideMessenger],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        isSessionLoading,
        isInitialLoading,
        hasCachedSession,
        loginRequired,
        logout,
        login,
        selectedProfile,
        profiles: currentOrg?.profiles ?? [],
        refreshProfiles,
        organizations: orgs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
