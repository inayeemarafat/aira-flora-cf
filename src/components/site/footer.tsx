import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Minus, Phone, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/shop.functions";

const Facebook = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden>
    <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
);
const Instagram = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <defs>
      <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#FEDA75" />
        <stop offset=".4" stopColor="#FA7E1E" />
        <stop offset=".7" stopColor="#D62976" />
        <stop offset="1" stopColor="#4F5BD5" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
    <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
  </svg>
);
const YouTube = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
    <path d="M10 8.8v6.4l5.6-3.2z" fill="#fff" />
  </svg>
);
const TikTok = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z" fill="#25F4EE" transform="translate(-0.8 -0.6)" />
    <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z" fill="#FE2C55" transform="translate(0.8 0.6)" />
    <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z" fill="#fff" />
  </svg>
);

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTube },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTok },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left md:pointer-events-none md:py-0"
        aria-expanded={open}
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">{title}</h3>
        <span className="text-neutral-400 md:hidden">{open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
      </button>
      <div className={`${open ? "block" : "hidden"} pb-5 md:mt-5 md:block md:pb-0`}>{children}</div>
    </div>
  );
}

const linkCls = "text-sm text-neutral-400 transition-colors hover:text-white";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await subscribeNewsletter({ data: { email } });
      toast.success("You're on the list — welcome to Aira Flora.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="bg-[#0F0F0F] text-neutral-300">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-12 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[0.12em] text-white">STAY IN THE LOOP</h2>
            <p className="mt-2 text-sm text-neutral-400">New drops, private sales and styling notes — straight to your inbox.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="h-12 flex-1 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-12 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#0F0F0F] transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {busy ? "…" : "Subscribe"}
            </button>
          </form>
        </div>

        <div className="grid gap-0 pt-8 md:grid-cols-4 md:gap-10 md:pt-12">
          <div className="pb-8 md:pb-0">
            <span className="font-display text-2xl font-semibold tracking-[0.12em] text-white">AIRA FLORA</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-400">
              Quiet luxury for everyday wardrobes. Designed in Dhaka, delivered to your door.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <Section title="Links & Info">
            <ul className="space-y-3">
              <li><Link to="/" className={linkCls}>About Us</Link></li>
              <li><Link to="/" className={linkCls}>Terms & Conditions</Link></li>
              <li><Link to="/" className={linkCls}>Privacy Policy</Link></li>
            </ul>
          </Section>
          <Section title="Help">
            <ul className="space-y-3">
              <li><Link to="/" className={linkCls}>Return Policy</Link></li>
              <li><Link to="/" className={linkCls}>Shipping Info</Link></li>
              <li><Link to="/" className={linkCls}>FAQs</Link></li>
            </ul>
          </Section>
          <Section title="Contact">
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white" />House 12, Road 7, Banani, Dhaka 1213</li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-white" /><a href="tel:+8801700000000" className="hover:text-white">+880 1700-000000</a></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-white" /><a href="mailto:hello@airaflora.com" className="hover:text-white">hello@airaflora.com</a></li>
            </ul>
          </Section>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[0.65rem] tracking-[0.18em] text-neutral-500 sm:flex-row">
          <span>© 2026 AIRA FLORA. ALL RIGHTS RESERVED.</span>
          <Link to="/admin" className="uppercase hover:text-white">Store Admin</Link>
        </div>
      </div>
    </footer>
  );
}
