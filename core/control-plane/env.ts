import * as fs from "node:fs";
import { IdeSettings } from "..";
import {
  getLocalEnvironmentDotFilePath,
  getStagingEnvironmentDotFilePath,
} from "../util/paths";
import { AuthType, ControlPlaneEnv, CustomAuthConfig } from "./AuthTypes";
import { getLicenseKeyData } from "./mdm/mdm";

export const EXTENSION_NAME = "continue";

const DEFAULT_CUSTOM_AUTH_CONFIG: CustomAuthConfig = {
  LOGIN_URL: "http://127.0.0.1:5500/login_simulation.html",
  USER_INFO_URL: "http://127.0.0.1:5500/getUserInfo",
  SITE_CODE: "http://127.0.0.1:5500/",
  SITE_NAME: "f-taas",
  LOCAL_SERVER_HOST: "127.0.0.1",
  LOCAL_SERVER_PORT: 34567,
  LOCAL_SERVER_CALLBACK_PATH: "/callback",
};

const WORKOS_CLIENT_ID_PRODUCTION = "client_01J0FW6XN8N2XJAECF7NE0Y65J";
const WORKOS_CLIENT_ID_STAGING = "client_01J0FW6XCPMJMQ3CG51RB4HBZQ";

const PRODUCTION_HUB_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api.continue.dev/",
  CONTROL_PLANE_URL: "https://api.continue.dev/",
  AUTH_TYPE: AuthType.WorkOsProd,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_PRODUCTION,
  APP_URL: "https://continue.dev/",
  customAuthConfig: DEFAULT_CUSTOM_AUTH_CONFIG,
};

const STAGING_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api.continue-stage.tools/",
  CONTROL_PLANE_URL: "https://api.continue-stage.tools/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "https://hub.continue-stage.tools/",
  customAuthConfig: DEFAULT_CUSTOM_AUTH_CONFIG,
};

const TEST_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api-test.continue.dev/",
  CONTROL_PLANE_URL: "https://api-test.continue.dev/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "https://app-test.continue.dev/",
  customAuthConfig: DEFAULT_CUSTOM_AUTH_CONFIG,
};

const LOCAL_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "http://localhost:3001/",
  CONTROL_PLANE_URL: "http://localhost:3001/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "http://localhost:3000/",
  customAuthConfig: DEFAULT_CUSTOM_AUTH_CONFIG,
};

export async function enableHubContinueDev() {
  return true;
}

export async function getControlPlaneEnv(
  ideSettingsPromise: Promise<IdeSettings>,
): Promise<ControlPlaneEnv> {
  const ideSettings = await ideSettingsPromise;
  return getControlPlaneEnvSync(ideSettings.continueTestEnvironment);
}

export function getControlPlaneEnvSync(
  ideTestEnvironment: IdeSettings["continueTestEnvironment"],
): ControlPlaneEnv {
  // MDM override
  const licenseKeyData = getLicenseKeyData();
  if (licenseKeyData?.unsignedData?.apiUrl) {
    const { apiUrl } = licenseKeyData.unsignedData;
    return {
      AUTH_TYPE: AuthType.OnPrem,
      DEFAULT_CONTROL_PLANE_PROXY_URL: apiUrl,
      CONTROL_PLANE_URL: apiUrl,
      APP_URL: "https://continue.dev/",
      customAuthConfig: DEFAULT_CUSTOM_AUTH_CONFIG,
    };
  }

  // Note .local overrides .staging
  if (fs.existsSync(getLocalEnvironmentDotFilePath())) {
    return LOCAL_ENV;
  }

  if (fs.existsSync(getStagingEnvironmentDotFilePath())) {
    return STAGING_ENV;
  }

  const env =
    ideTestEnvironment === "production"
      ? "hub"
      : ideTestEnvironment === "staging"
        ? "staging"
        : ideTestEnvironment === "local"
          ? "local"
          : process.env.CONTROL_PLANE_ENV;

  const controlPlaneEnv =
    env === "local"
      ? LOCAL_ENV
      : env === "staging"
        ? STAGING_ENV
        : env === "test"
          ? TEST_ENV
          : PRODUCTION_HUB_ENV;

  const mergedCustomAuthConfig: CustomAuthConfig = {
    ...DEFAULT_CUSTOM_AUTH_CONFIG,
    ...(controlPlaneEnv.customAuthConfig || {}),
    LOGIN_URL: process.env.LOGIN_URL || controlPlaneEnv.customAuthConfig?.LOGIN_URL || DEFAULT_CUSTOM_AUTH_CONFIG.LOGIN_URL,
    USER_INFO_URL: process.env.USER_INFO_URL || controlPlaneEnv.customAuthConfig?.USER_INFO_URL || DEFAULT_CUSTOM_AUTH_CONFIG.USER_INFO_URL,
    SITE_CODE: process.env.SITE_CODE || controlPlaneEnv.customAuthConfig?.SITE_CODE || DEFAULT_CUSTOM_AUTH_CONFIG.SITE_CODE,
    SITE_NAME: process.env.SITE_NAME || controlPlaneEnv.customAuthConfig?.SITE_NAME || DEFAULT_CUSTOM_AUTH_CONFIG.SITE_NAME,
    LOCAL_SERVER_HOST: process.env.LOCAL_SERVER_HOST || controlPlaneEnv.customAuthConfig?.LOCAL_SERVER_HOST || DEFAULT_CUSTOM_AUTH_CONFIG.LOCAL_SERVER_HOST,
    LOCAL_SERVER_PORT: process.env.LOCAL_SERVER_PORT ? parseInt(process.env.LOCAL_SERVER_PORT) : (controlPlaneEnv.customAuthConfig?.LOCAL_SERVER_PORT || DEFAULT_CUSTOM_AUTH_CONFIG.LOCAL_SERVER_PORT),
    LOCAL_SERVER_CALLBACK_PATH: process.env.LOCAL_SERVER_CALLBACK_PATH || controlPlaneEnv.customAuthConfig?.LOCAL_SERVER_CALLBACK_PATH || DEFAULT_CUSTOM_AUTH_CONFIG.LOCAL_SERVER_CALLBACK_PATH,
  };

  return {
    ...controlPlaneEnv,
    customAuthConfig: mergedCustomAuthConfig,
  };
}

export async function useHub(
  ideSettingsPromise: Promise<IdeSettings>,
): Promise<boolean> {
  const ideSettings = await ideSettingsPromise;
  return ideSettings.continueTestEnvironment !== "none";
}
