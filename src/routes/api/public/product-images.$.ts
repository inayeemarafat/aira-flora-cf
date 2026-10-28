import { createFileRoute } from "@tanstack/react-router";
import { getAdmin } from "@/lib/supabase-public";

const EXT_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/**
 * Serves product images from the private "product-images" bucket.
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

        const admin = await getAdmin();
        const { data, error } = await admin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
