import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-rose-deep text-background shadow-lg shadow-rose-deep/25 transition-all duration-300 hover:bg-primary md:bottom-6 md:right-6 ${
        visible
          ? "pointer-events-auto bottom-[calc(5.25rem+env(safe-area-inset-bottom))] translate-y-0 opacity-100"
          : "pointer-events-none bottom-[calc(5.25rem+env(safe-area-inset-bottom))] translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
