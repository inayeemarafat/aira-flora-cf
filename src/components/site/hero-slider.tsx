import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    img: "/images/hero-1.jpg",
    eyebrow: "The Spring Collection 2026",
    title: "Elegance, quietly spoken",
    copy: "Flowing silhouettes, soft luxurious fabrics — designed in Dhaka for the modern wardrobe.",
  },
  {
    img: "/images/hero-2.jpg",
    eyebrow: "New In — Limited Pieces",
    title: "Soft tailoring, every day",
    copy: "Discover knitwear, outerwear and dresses crafted to move with you. Cash on delivery nationwide.",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index] ?? SLIDES[0]!;

  return (
    <section className="relative h-[74vh] min-h-[520px] w-full overflow-hidden bg-primary">
      {SLIDES.map((s, i) => (
        <img
          key={s.img}
          src={s.img}
          alt=""
          aria-hidden={i !== index}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/75 via-primary/35 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 lg:px-8">
        <div key={slide.title} className="max-w-xl animate-fade-up">
          <p className="eyebrow text-background/85">{slide.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] text-background md:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-background/85">
            {slide.copy}
          </p>
          <Button asChild className="mt-8 h-12 rounded-none bg-background px-10 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-primary hover:bg-background/90">
            <Link to="/shop">
              Shop the collection <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.img}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1 rounded-full transition-all ${i === index ? "w-8 bg-background" : "w-4 bg-background/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
