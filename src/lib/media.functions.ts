import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function safeName(name: string) {
  const ext = (name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
}

/** Envia uma imagem (PNG, JPG ou WEBP) para o armazenamento do portal. */
export const uploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fileName: string; contentType: string; dataBase64: string }) => data)
  .handler(async ({ data, context }) => {
    if (!ALLOWED.includes(data.contentType.toLowerCase())) {
      throw new Error("Formato não aceito. Envie uma imagem PNG, JPG ou WEBP.");
    }
    const binary = Buffer.from(data.dataBase64, "base64");
    if (binary.byteLength > MAX_BYTES) {
      throw new Error("A imagem é muito grande. Envie um arquivo de até 10 MB.");
    }
    const path = `uploads/${new Date().getFullYear()}/${safeName(data.fileName)}`;
    const { error } = await context.supabase.storage
      .from("portal-media")
      .upload(path, binary, { contentType: data.contentType, upsert: false });
    if (error) {
      if (error.message.toLowerCase().includes("row-level security")) {
        throw new Error(
          "Sua conta não tem permissão para enviar imagens. Peça acesso a um administrador.",
        );
      }
      throw new Error(error.message);
    }
    return { url: `/api/public/media/${path}` };
  });
