export const ADMIN_ODER_IDS = [
  "naver_3jwXU-uzU_DxOHlTErn3pButLuujkIixr-ByameONwc", // jakelee0824@naver.com
];

export function isAdminOderId(oderId?: string | null) {
  if (!oderId) return false;
  return ADMIN_ODER_IDS.includes(oderId);
}
