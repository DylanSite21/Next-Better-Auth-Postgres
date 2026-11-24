import Image from "next/image";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { cache } from "react";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".jfif"]);

const getBookImageFiles = cache(async () => {
  const entries = await readdir(join(process.cwd(), "public", "books-images"), {
    withFileTypes: true,
  });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        imageExtensions.has(extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name);
});

function normalizeBookTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function findBookImage(title: string) {
  const normalizedTitle = normalizeBookTitle(title);
  const files = await getBookImageFiles();
  const filename = files.find((file) => {
    const extension = extname(file);
    return normalizeBookTitle(file.slice(0, -extension.length)) === normalizedTitle;
  });
  return filename ? `/books-images/${encodeURIComponent(filename)}` : null;
}

export async function BookCover({
  title,
  image,
}: {
  title: string;
  image: string | null;
}) {
  const imageSrc = image
    ? image.startsWith("http") || image.startsWith("/")
      ? image
      : `/uploads/${image}`
    : await findBookImage(title);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-emerald-50">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`Sampul ${title}`}
          fill
          sizes="(max-width: 768px) 50vw, 250px"
          unoptimized={
            imageSrc.startsWith("http") || /\.jfif(?:$|[?#])/i.test(imageSrc)
          }
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-5">
          <span className="text-center font-display text-lg font-bold text-brand">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
