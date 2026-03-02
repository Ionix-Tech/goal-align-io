import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageItem {
  id: string;
  name: string;
  url: string;
}

interface ImageMosaicProps {
  images: ImageItem[];
  className?: string;
}

export function ImageMosaic({ images, className }: ImageMosaicProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  if (images.length === 0) return null;

  const gridCols =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <>
      <div className={cn("grid gap-2 mt-2", gridCols, className)}>
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedImage(img)}
            className="group relative overflow-hidden rounded-md border bg-muted/30 hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-full max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
