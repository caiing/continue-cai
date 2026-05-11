import * as fs from "node:fs";
import * as path from "node:path";
import * as YAML from "yaml";
import { IdeSettings } from "..";
import {
  getContinueGlobalPath,
  getLocalEnvironmentDotFilePath,
  getStagingEnvironmentDotFilePath,
} from "../util/paths";
import { AuthType, ControlPlaneEnv } from "./AuthTypes";
import { getLicenseKeyData } from "./mdm/mdm";

export const EXTENSION_NAME = "continue";

const WORKOS_CLIENT_ID_PRODUCTION = "client_01J0FW6XN8N2XJAECF7NE0Y65J";
const WORKOS_CLIENT_ID_STAGING = "client_01J0FW6XCPMJMQ3CG51RB4HBZQ";

const PRODUCTION_HUB_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api.continue.dev/",
  CONTROL_PLANE_URL: "https://api.continue.dev/",
  AUTH_TYPE: AuthType.WorkOsProd,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_PRODUCTION,
  APP_URL: "https://continue.dev/",
};

const STAGING_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api.continue-stage.tools/",
  CONTROL_PLANE_URL: "https://api.continue-stage.tools/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "https://hub.continue-stage.tools/",
};

const TEST_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "https://api-test.continue.dev/",
  CONTROL_PLANE_URL: "https://api-test.continue.dev/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "https://app-test.continue.dev/",
};

const LOCAL_ENV: ControlPlaneEnv = {
  DEFAULT_CONTROL_PLANE_PROXY_URL: "http://localhost:3001/",
  CONTROL_PLANE_URL: "http://localhost:3001/",
  AUTH_TYPE: AuthType.WorkOsStaging,
  WORKOS_CLIENT_ID: WORKOS_CLIENT_ID_STAGING,
  APP_URL: "http://localhost:3000/",
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
  // 从 config.yaml 中读取控制面配置的辅助函数
  const getControlPlaneFromYaml = (): any => {
    try {
      const configPath = path.join(getContinueGlobalPath(), "config.yaml");
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf8");
        const parsed = YAML.parse(content);
        return parsed?.controlPlane || {};
      }
    } catch (e) {
      console.warn("Failed to parse config.yaml for controlPlane:", e);
    }
    return {};
  };

  const fillEnvFields = (controlPlaneEnv: ControlPlaneEnv): ControlPlaneEnv => {
    const proxyUrl = controlPlaneEnv.DEFAULT_CONTROL_PLANE_PROXY_URL;
    const yamlConfig = getControlPlaneFromYaml();

    return {
      ...controlPlaneEnv,
      // 字段合并优先级：环境变量 > config.yaml > 默认值/基于 proxyUrl 的生成
      APP_URL:
        process.env.APP_URL || yamlConfig.appUrl || controlPlaneEnv.APP_URL,
      LOGIN_REQUIRED:
        yamlConfig.loginRequired !== undefined
          ? yamlConfig.loginRequired
          : (controlPlaneEnv.LOGIN_REQUIRED ?? true),
    };
  };

  // MDM override
  const licenseKeyData = getLicenseKeyData();
  if (licenseKeyData?.unsignedData?.apiUrl) {
    const { apiUrl } = licenseKeyData.unsignedData;
    const controlPlaneEnv = {
      AUTH_TYPE: AuthType.OnPrem as const,
      DEFAULT_CONTROL_PLANE_PROXY_URL: apiUrl,
      CONTROL_PLANE_URL: apiUrl,
      APP_URL: "https://continue.dev/",
    };
    return fillEnvFields(controlPlaneEnv);
  }

  // Note .local overrides .staging
  if (fs.existsSync(getLocalEnvironmentDotFilePath())) {
    return fillEnvFields(LOCAL_ENV);
  }

  if (fs.existsSync(getStagingEnvironmentDotFilePath())) {
    return fillEnvFields(STAGING_ENV);
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

  return fillEnvFields(controlPlaneEnv);
}

export async function useHub(
  ideSettingsPromise: Promise<IdeSettings>,
): Promise<boolean> {
  const ideSettings = await ideSettingsPromise;
  return ideSettings.continueTestEnvironment !== "none";
}
