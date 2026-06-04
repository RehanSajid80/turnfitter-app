// Generate a one-click sign-in link (bypasses email). Admin/service-role only.
// Run: node --env-file=.env.local scripts/generate-signin-link.mjs <email> [siteUrl]
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const SITE =
  process.argv[3] ||
  "https://turnfitter-app-git-main-rehansajid80s-projects.vercel.app";

if (!email) {
  console.error("Usage: generate-signin-link.mjs <email> [siteUrl]");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

// Make sure the user exists (passwordless, confirmed).
const { error: cuErr } = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
});
if (cuErr && !/already|registered|exists/i.test(cuErr.message)) {
  console.error("createUser:", cuErr.message);
}

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (error) {
  console.error("generateLink:", error.message);
  process.exit(1);
}

const tokenHash = data.properties.hashed_token;
const link = `${SITE}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/dashboard`;
console.log("\n=== ONE-CLICK SIGN-IN LINK (valid ~1 hour) ===\n");
console.log(link);
console.log("");
