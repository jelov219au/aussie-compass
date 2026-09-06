import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { derivePwaInstallLifecycle, pwaLifecycleFields } from "../src/lib/pwaInstallLifecycle.ts";

const tuple = (platform, launch_context, install_state, local_copy_state, offline_scope, update_state, remove_data_choice, backup_entitlement_boundary, next_action, flags={}) => ({ input: { platform, launch_context, install_state, local_copy_state, offline_scope, update_state, remove_data_choice, backup_entitlement_boundary, ...flags }, expected: { platform, launch_context, install_state, local_copy_state, offline_scope, update_state, remove_data_choice, backup_entitlement_boundary, next_action } });
const cases = [
  ["PI01", tuple("ios_safari","browser_tab","prompt_unavailable","separate_or_unknown_copy","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
  ["PI02", tuple("ios_safari","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","paid_access_separate","continue_web")],
  ["PI03", tuple("ios_safari","embedded_browser","unsupported_or_managed","separate_or_unknown_copy","online_required","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI04", tuple("android_chrome","browser_tab","prompt_available","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","prompt_install")],
  ["PI05", tuple("android_chrome","browser_tab","dismissed","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
  ["PI06", tuple("android_chrome","browser_tab","failed","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
  ["PI07", tuple("android_chrome","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","paid_access_separate","continue_web")],
  ["PI08", tuple("desktop_chrome","browser_tab","prompt_available","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","prompt_install")],
  ["PI09", tuple("desktop_chrome","browser_tab","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
  ["PI10", tuple("desktop_edge","browser_tab","unsupported_or_managed","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","effect_unknown","backup_not_checked","open_platform_steps")],
  ["PI11", tuple("desktop_edge","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","paid_access_separate","continue_web")],
  ["PI12", tuple("other","unknown","unsupported_or_managed","separate_or_unknown_copy","online_required","current_unconfirmed","effect_unknown","backup_not_checked","continue_web")],
  ["PI13", tuple("other","unknown","prompt_unavailable","same_profile_unconfirmed","online_required","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps",{exposePlatformSteps:true})],
  ["PI14", tuple("android_chrome","browser_tab","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","continue_web",{installRequestAccepted:true})],
  ["PI15", tuple("other","unknown","prompt_unavailable","separate_or_unknown_copy","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI16", tuple("other","browser_tab","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","refresh_online","keep_installed","backup_not_checked","refresh_online")],
  ["PI17", tuple("other","unknown","prompt_unavailable","same_profile_unconfirmed","open_page_not_guaranteed","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI18", tuple("other","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","update_available","keep_installed","backup_not_checked","refresh_online")],
  ["PI19", tuple("other","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","reload_blocked_by_unsaved_work","keep_installed","backup_not_checked","backup_before_change")],
  ["PI20", tuple("other","installed_app","installed_or_standalone","same_profile_unconfirmed","offline_fallback_only","refresh_online","keep_installed","paid_access_separate","refresh_online")],
  ["PI21", tuple("other","browser_tab","prompt_unavailable","original_copy_found","online_required","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI22", tuple("other","unknown","prompt_unavailable","separate_or_unknown_copy","online_required","current_unconfirmed","keep_installed","backup_not_checked","verify_original_copy",{needsOriginalCopy:true})],
  ["PI23", tuple("other","unknown","prompt_unavailable","storage_unavailable","online_required","current_unconfirmed","effect_unknown","backup_not_checked","continue_web")],
  ["PI24", { input: { platform:"bogus", install_state:"broken" }, expected: { platform:"other",launch_context:"unknown",install_state:"prompt_unavailable",local_copy_state:"separate_or_unknown_copy",offline_scope:"online_required",update_state:"current_unconfirmed",remove_data_choice:"effect_unknown",backup_entitlement_boundary:"backup_not_checked",next_action:"continue_web" } }],
  ["PI25", tuple("other","browser_tab","prompt_unavailable","original_copy_found","online_required","current_unconfirmed","keep_installed","local_backup_ready","continue_web")],
  ["PI26", tuple("other","installed_app","installed_or_standalone","separate_or_unknown_copy","online_required","current_unconfirmed","keep_installed","restore_route_needed","restore_paid_access")],
  ["PI27", tuple("other","installed_app","installed_or_standalone","same_profile_unconfirmed","online_required","current_unconfirmed","remove_app_only","paid_access_separate","remove_app_only")],
  ["PI28", tuple("other","installed_app","installed_or_standalone","separate_or_unknown_copy","online_required","current_unconfirmed","effect_unknown","backup_not_checked","backup_before_change")],
  ["PI29", tuple("other","browser_tab","prompt_unavailable","original_copy_found","online_required","current_unconfirmed","delete_site_data_after_backup","paid_access_separate","delete_site_data_after_backup")],
  ["PI30", tuple("other","unknown","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI31", tuple("other","unknown","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","continue_web")],
  ["PI32", tuple("other","unknown","prompt_unavailable","separate_or_unknown_copy","online_required","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps",{exposePlatformSteps:true})],
  ["PI33", tuple("desktop_chrome","browser_tab","prompt_unavailable","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
  ["PI34", tuple("android_chrome","browser_tab","dismissed","same_profile_unconfirmed","offline_fallback_only","current_unconfirmed","keep_installed","backup_not_checked","open_platform_steps")],
];
for (const [name, fixture] of cases) { const actual=derivePwaInstallLifecycle(fixture.input); assert.deepEqual(Object.keys(actual), pwaLifecycleFields, `${name} exact fields`); assert.deepEqual(actual, fixture.expected, name); }
const sw=await readFile(new URL("../public/sw.js",import.meta.url),"utf8");
assert.match(sw,/const CACHE_PREFIX = "hoju-compass-offline-"/); assert.match(sw,/key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/); assert.match(sw,/cache\.add\(OFFLINE_URL\)/); assert.doesNotMatch(sw,/cache\.put|STATIC_PATHS|icons/);
const button=await readFile(new URL("../src/components/pwa/InstallAppButton.tsx",import.meta.url),"utf8"); assert.doesNotMatch(button,/localStorage|sessionStorage|@vercel\/analytics|track\(/);
const page=await readFile(new URL("../src/app/install/page.tsx",import.meta.url),"utf8"); for(const phrase of ["DESKTOP · CHROME","DESKTOP · EDGE","새 service worker가 활성화돼도","JSON 백업에는 구매 이용권"]) assert.ok(page.includes(phrase),phrase);
console.log(`PWA_INSTALL_LIFECYCLE=PASS fixtures=${cases.length} exactFields=${pwaLifecycleFields.length} nativeWrites=0 storageWrites=0`);
