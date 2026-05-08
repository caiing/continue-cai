import { ToolPolicy } from "@continuedev/terminal-security";

/**
 * Evaluates file access policy based on whether the file is within allowed boundaries
 * (workspace or ~/.continue directory)
 *
 * @param basePolicy - The base policy from tool definition or user settings
 * @param isWithinAllowedZone - Whether the file/directory is within allowed zones
 * @returns The evaluated policy - more restrictive for files outside allowed zones
 */
export function evaluateFileAccessPolicy(
  basePolicy: ToolPolicy,
  isWithinAllowedZone: boolean,
): ToolPolicy {
  // If tool is disabled, keep it disabled
  if (basePolicy === "disabled") {
    return "disabled";
  }

  // Files within allowed zones use the base policy (typically "allowedWithoutPermission")
  if (isWithinAllowedZone) {
    return basePolicy;
  }

  // Files outside allowed zones always require permission for security
  return "allowedWithPermission";
}
