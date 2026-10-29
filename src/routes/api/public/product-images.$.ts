import { createFileRoute } from "@tanstack/react-router";
import { getImagesBucket } from "@/lib/db";

const EXT_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/**
 * Serves product images from the R2 bucket bound as `IMAGES`.
 * Public read-only endpoint: objects are non-sensitive product photos,
 * paths are validated server-side (single random-named file, no traversal).
 */
export const Route = createFileRoute("/api/public/product-images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!path || path.includes("..") || path.includes("/")) {
          return new Response("Not found", { status: 404 });
        }
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const contentType = EXT_CONTENT_TYPES[ext];
        if (!contentType) return new Response("Not found", { status: 404 });

        const bucket = await getImagesBucket();
        const object = await bucket.get(path);
        if (!object) return new Response("Not found", { status: 404 });

        return new Response(object.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
