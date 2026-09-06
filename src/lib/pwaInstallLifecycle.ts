export const pwaLifecycleFields = ["platform", "launch_context", "install_state", "local_copy_state", "offline_scope", "update_state", "remove_data_choice", "backup_entitlement_boundary", "next_action"] as const;

export type PwaPlatform = "ios_safari" | "android_chrome" | "desktop_chrome" | "desktop_edge" | "other";
export type LaunchContext = "browser_tab" | "installed_app" | "embedded_browser" | "unknown";
export type InstallState = "prompt_available" | "prompt_unavailable" | "dismissed" | "failed" | "installed_or_standalone" | "unsupported_or_managed";
export type LocalCopyState = "same_profile_unconfirmed" | "separate_or_unknown_copy" | "original_copy_found" | "storage_unavailable";
export type OfflineScope = "online_required" | "offline_fallback_only" | "open_page_not_guaranteed";
export type UpdateState = "current_unconfirmed" | "refresh_online" | "update_available" | "reload_blocked_by_unsaved_work";
export type RemoveDataChoice = "keep_installed" | "remove_app_only" | "delete_site_data_after_backup" | "effect_unknown";
export type BackupBoundary = "backup_not_checked" | "local_backup_ready" | "paid_access_separate" | "restore_route_needed";
export type PwaNextAction = "prompt_install" | "open_platform_steps" | "continue_web" | "verify_original_copy" | "backup_before_change" | "refresh_online" | "remove_app_only" | "delete_site_data_after_backup" | "restore_paid_access";

export type PwaInstallLifecycle = {
  platform: PwaPlatform;
  launch_context: LaunchContext;
  install_state: InstallState;
  local_copy_state: LocalCopyState;
  offline_scope: OfflineScope;
  update_state: UpdateState;
  remove_data_choice: RemoveDataChoice;
  backup_entitlement_boundary: BackupBoundary;
  next_action: PwaNextAction;
};

export type PwaLifecycleInput = Partial<Omit<PwaInstallLifecycle, "next_action">> & {
  needsOriginalCopy?: boolean;
  exposePlatformSteps?: boolean;
  installRequestAccepted?: boolean;
};

const allowed = {
  platform: ["ios_safari", "android_chrome", "desktop_chrome", "desktop_edge", "other"],
  launch_context: ["browser_tab", "installed_app", "embedded_browser", "unknown"],
  install_state: ["prompt_available", "prompt_unavailable", "dismissed", "failed", "installed_or_standalone", "unsupported_or_managed"],
  local_copy_state: ["same_profile_unconfirmed", "separate_or_unknown_copy", "original_copy_found", "storage_unavailable"],
  offline_scope: ["online_required", "offline_fallback_only", "open_page_not_guaranteed"],
  update_state: ["current_unconfirmed", "refresh_online", "update_available", "reload_blocked_by_unsaved_work"],
  remove_data_choice: ["keep_installed", "remove_app_only", "delete_site_data_after_backup", "effect_unknown"],
  backup_entitlement_boundary: ["backup_not_checked", "local_backup_ready", "paid_access_separate", "restore_route_needed"],
} as const;

function valid<K extends keyof typeof allowed>(field: K, candidate: unknown, fallback: (typeof allowed)[K][number]) {
  return (allowed[field] as readonly unknown[]).includes(candidate) ? candidate as (typeof allowed)[K][number] : fallback;
}

export function derivePwaInstallLifecycle(input: PwaLifecycleInput = {}): PwaInstallLifecycle {
  const platform = valid("platform", input.platform, "other");
  const launch = valid("launch_context", input.launch_context, "unknown");
  const install = valid("install_state", input.install_state, "prompt_unavailable");
  const copy = valid("local_copy_state", input.local_copy_state, "separate_or_unknown_copy");
  const offline = valid("offline_scope", input.offline_scope, "online_required");
  const update = valid("update_state", input.update_state, "current_unconfirmed");
  const remove = valid("remove_data_choice", input.remove_data_choice, "effect_unknown");
  const backup = valid("backup_entitlement_boundary", input.backup_entitlement_boundary, "backup_not_checked");
  const supported = platform !== "other";

  let next: PwaNextAction = "continue_web";
  if (backup === "restore_route_needed") next = "restore_paid_access";
  else if (remove === "delete_site_data_after_backup" && backup !== "local_backup_ready" && backup !== "paid_access_separate") next = "backup_before_change";
  else if (remove === "delete_site_data_after_backup") next = "delete_site_data_after_backup";
  else if (remove === "remove_app_only") next = "remove_app_only";
  else if (update === "reload_blocked_by_unsaved_work") next = "backup_before_change";
  else if (update === "update_available" || update === "refresh_online") next = "refresh_online";
  else if (input.needsOriginalCopy) next = "verify_original_copy";
  else if (launch === "installed_app" && remove === "effect_unknown" && copy === "separate_or_unknown_copy") next = "backup_before_change";
  else if (input.installRequestAccepted) next = "continue_web";
  else if (install === "installed_or_standalone") next = "continue_web";
  else if (install === "prompt_available" && platform !== "ios_safari" && supported) next = "prompt_install";
  else if ((install === "dismissed" || install === "failed") && supported) next = "open_platform_steps";
  else if (install === "unsupported_or_managed") next = platform === "desktop_edge" ? "open_platform_steps" : "continue_web";
  else if (supported || input.exposePlatformSteps) next = "open_platform_steps";

  return { platform, launch_context: launch, install_state: install, local_copy_state: copy, offline_scope: offline, update_state: update, remove_data_choice: remove, backup_entitlement_boundary: backup, next_action: next };
}
