export function isAdmin2faRequired(): boolean {
  return process.env.ADMIN_REQUIRE_2FA !== "false";
}
