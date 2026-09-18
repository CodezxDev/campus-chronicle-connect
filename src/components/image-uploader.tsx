import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/media.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  id: string;
}) {
  const upload = useServerFn(uploadImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataBase64 = await toBase64(file);
      const res = await upload({
        data: { fileName: file.name, contentType: file.type, dataBase64 },
      });
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar a imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3">
          <img
            src={value}
            alt="Pré-visualização da imagem escolhida"
            className="size-20 shrink-0 rounded-md object-cover"
          />
          <div className="flex flex-1 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Substituir
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onChange("")}
            >
              <Trash2 className="mr-1 size-4" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full justify-center"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Enviando imagem...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 size-4" /> Escolher foto do dispositivo
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP, até 10 MB.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
