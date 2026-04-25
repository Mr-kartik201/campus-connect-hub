import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PhotoUploader({
  bucket,
  userId,
  photos,
  setPhotos,
  max = 3,
}: {
  bucket: string;
  userId: string;
  photos: string[];
  setPhotos: (p: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = max - photos.length;
    const slice = files.slice(0, remaining);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of slice) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setPhotos([...photos, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const remove = (url: string) => setPhotos(photos.filter((p) => p !== url));

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((url) => (
          <div key={url} className="relative h-24 w-24 rounded-lg overflow-hidden border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(url)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground mt-1">Add</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Up to {max} photos</p>
    </div>
  );
}
