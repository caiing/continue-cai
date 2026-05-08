export interface HubSessionInfo {
  AUTH_TYPE: AuthType.WorkOsProd | AuthType.WorkOsStaging;
  accessToken: string;
  account: {
    label: string;
    id: string;
  };
}

export interface OnPremSessionInfo {
  AUTH_TYPE: AuthType.OnPrem;
}

export type ControlPlaneSessionInfo = HubSessionInfo | OnPremSessionInfo;

export function isOnPremSession(
  sessionInfo: ControlPlaneSessionInfo | undefined,
): sessionInfo is OnPremSessionInfo {
  return sessionInfo !== undefined && sessionInfo.AUTH_TYPE === AuthType.OnPrem;
}

export enum AuthType {
  WorkOsProd = "continue",
  WorkOsStaging = "continue-staging",
  OnPrem = "on-prem",
}

export interface CustomAuthConfig {
  LOGIN_URL: string;
  USER_INFO_URL: string;
  SITE_CODE: string;
  SITE_NAME: string;
  LOCAL_SERVER_HOST: string;
  LOCAL_SERVER_PORT: number;
  LOCAL_SERVER_CALLBACK_PATH: string;
}

export interface HubEnv {
  DEFAULT_CONTROL_PLANE_PROXY_URL: string;
  CONTROL_PLANE_URL: string;
  AUTH_TYPE: AuthType.WorkOsProd | AuthType.WorkOsStaging;
  WORKOS_CLIENT_ID: string;
  WORKOS_URL?: string;
  APP_URL: string;
  customAuthConfig: CustomAuthConfig;
}

export interface OnPremEnv {
  AUTH_TYPE: AuthType.OnPrem;
  DEFAULT_CONTROL_PLANE_PROXY_URL: string;
  CONTROL_PLANE_URL: string;
  APP_URL: string;
  customAuthConfig: CustomAuthConfig;
  KEYCLOAK_URL?: string;
  KEYCLOAK_REALM?: string;
  KEYCLOAK_CLIENT_ID?: string;
}

export type ControlPlaneEnv = HubEnv | OnPremEnv;

export function isHubEnv(env: ControlPlaneEnv): env is HubEnv {
  return (
    "AUTH_TYPE" in env &&
    env.AUTH_TYPE !== "on-prem" &&
    "WORKOS_CLIENT_ID" in env
  );
}

export interface KeycloakEnv extends OnPremEnv {
  KEYCLOAK_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
}

export function isKeycloakEnv(env: ControlPlaneEnv): env is KeycloakEnv {
  return (
    "AUTH_TYPE" in env &&
    env.AUTH_TYPE === "on-prem" &&
    "KEYCLOAK_URL" in env &&
    env.KEYCLOAK_URL !== undefined &&
    "KEYCLOAK_REALM" in env &&
    env.KEYCLOAK_REALM !== undefined &&
    "KEYCLOAK_CLIENT_ID" in env &&
    env.KEYCLOAK_CLIENT_ID !== undefined
  );
}
