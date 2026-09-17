import { createServerFn } from "@tanstack/react-start";

const QUICK_ADMIN_EMAIL = "admin@portalaurora.app";
const QUICK_ADMIN_PASSWORD = "12345";

function derivedPassword(input: string) {
  return `portal-aurora-${input}-admin`;
}

/**
 * Acesso rápido: a pessoa digita apenas a senha da administração.
 * A senha é conferida no servidor e a conta fixa de administrador é criada
 * (ou atualizada) com permissão de admin.
 */
export const quickAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password !== QUICK_ADMIN_PASSWORD) {
      return { ok: false as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret = derivedPassword(QUICK_ADMIN_PASSWORD);

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email === QUICK_ADMIN_EMAIL);

    let userId = existing?.id;
    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: secret,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: QUICK_ADMIN_EMAIL,
        password: secret,
        email_confirm: true,
        user_metadata: { full_name: "Administração" },
      });
      if (error) throw new Error(error.message);
      userId = created.user?.id;
    }

    if (userId) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }

    return { ok: true as const, email: QUICK_ADMIN_EMAIL, secret };
  });
