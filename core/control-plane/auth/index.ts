import { v4 as uuidv4 } from "uuid";
import { IDE, IdeSettings } from "../..";
import { isHubEnv, isKeycloakEnv } from "../AuthTypes";
import { getControlPlaneEnv } from "../env";

export async function getAuthUrlForTokenPage(
  ideSettingsPromise: Promise<IdeSettings>,
  useOnboarding: boolean,
  ide?: IDE,
): Promise<string> {
  const env = await getControlPlaneEnv(ideSettingsPromise);

  const baseRedirectUri = `${env.APP_URL}tokens/${useOnboarding ? "onboarding-" : ""}callback`;
  const redirectUri = await getRedirectUri(baseRedirectUri, ide);

  if (isHubEnv(env)) {
    const workosAuthUrl = env.WORKOS_URL
      ? `${env.WORKOS_URL}/user_management/authorize`
      : "https://api.workos.com/user_management/authorize";
    const url = new URL(workosAuthUrl);
    const params = {
      response_type: "code",
      client_id: env.WORKOS_CLIENT_ID,
      redirect_uri: redirectUri,
      state: uuidv4(),
      provider: "authkit",
    };
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value),
    );
    return url.toString();
  }

  if (isKeycloakEnv(env)) {
    const keycloakAuthUrl = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/auth`;
    const url = new URL(keycloakAuthUrl);
    const params = {
      response_type: "code",
      client_id: env.KEYCLOAK_CLIENT_ID,
      redirect_uri: redirectUri,
      state: uuidv4(),
      scope: "openid email profile",
    };
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value),
    );
    return url.toString();
  }

  throw new Error("Sign in disabled");
}

async function getRedirectUri(baseUri: string, ide?: IDE): Promise<string> {
  if (ide?.getExternalUri) {
    try {
      return await ide.getExternalUri(baseUri);
    } catch {
      return baseUri;
    }
  }
  return baseUri;
}
