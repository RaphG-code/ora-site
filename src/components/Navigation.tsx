import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

type NavigationProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBookCall?: () => void;
  currentPage: "home" | "for-business";
  onNavigate: (page: "home" | "for-business") => void;
};

const links = [
  { label: "Fonctionnalités", id: "features" },
  { label: "Comment ça marche", id: "how-it-works" },
  { label: "Tarifs", id: "pricing" },
];

const Navigation: React.FC<NavigationProps> = ({
  onBookCall,
  currentPage,
  onNavigate,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setScrolled(window.scrollY > 12);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (currentPage !== "home") {
      onNavigate("home");
      setTimeout(() => {
        const lenis = (window as any).__lenis;
        if (lenis) lenis.scrollTo(`#${id}`);
        else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } else {
      const lenis = (window as any).__lenis;
      if (lenis) lenis.scrollTo(`#${id}`);
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#fcfbf7]/90 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          : "bg-transparent",
      ].join(" ")}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-[68px]">

        {/* ── Left: Logo + nav links ─────────────────────────── */}
        <div className="flex items-center">
          {/* Logo */}
          <button
            onClick={() => {
              if (currentPage === "home") {
                const lenis = (window as any).__lenis;
                if (lenis) { lenis.start(); lenis.scrollTo(0, { immediate: true }); }
                window.scrollTo({ top: 0 });
              } else {
                onNavigate("home");
              }
            }}
            className="flex-shrink-0 mr-7"
            aria-label="Ora — Accueil"
          >
            <img
              src="/logos/logo-color-dark.png"
              alt="Ora"
              className="h-9 w-auto"
            />
          </button>

          {/* Nav links — desktop, flush to logo */}
          <div className="hidden md:flex items-center gap-0">
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="px-3.5 py-2 text-[13.5px] font-medium font-inter text-gray-500 hover:text-gray-900 transition-colors duration-150 rounded-md hover:bg-gray-100/60"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setMobileOpen(false); onNavigate("for-business"); }}
              className={[
                "px-3.5 py-2 text-[13.5px] font-medium font-inter transition-colors duration-150 rounded-md",
                currentPage === "for-business"
                  ? "text-gray-900 bg-gray-100/60"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60",
              ].join(" ")}
            >
              Solution
            </button>
          </div>
        </div>

        {/* ── Right: Log in + CTA + mobile hamburger ─────────── */}
        <div className="flex items-center gap-2">
          {/* Log in — desktop */}
          <button
            className={[
              "hidden md:inline-flex items-center px-4 py-2 rounded-full",
              "text-[13.5px] font-medium font-inter text-gray-600",
              "hover:text-gray-900 hover:bg-gray-100/70",
              "transition-colors duration-150",
            ].join(" ")}
          >
            Log in
          </button>

          {/* Réserver un appel — desktop */}
          <button
            onClick={onBookCall}
            className={[
              "hidden md:inline-flex items-center px-5 py-2.5 rounded-full",
              "text-[13.5px] font-semibold font-inter text-white",
              "bg-gradient-to-r from-[#3b82f6] to-[#0d9488]",
              "shadow-[0_2px_10px_rgba(59,130,246,0.22)]",
              "hover:shadow-[0_4px_18px_rgba(59,130,246,0.35)]",
              "hover:-translate-y-px active:translate-y-0",
              "transition-all duration-150",
            ].join(" ")}
          >
            Réserver un appel
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200/60 px-6 pb-5 pt-3 bg-[#fcfbf7]/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-left px-4 py-3 rounded-xl text-[15px] font-medium font-inter text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 transition-colors"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setMobileOpen(false); onNavigate("for-business"); }}
              className={[
                "text-left px-4 py-3 rounded-xl text-[15px] font-medium font-inter transition-colors",
                currentPage === "for-business"
                  ? "text-gray-900 bg-gray-100/70"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70",
              ].join(" ")}
            >
              Solution
            </button>
            <div className="mt-2 flex flex-col gap-2">
              <button
                className="w-full py-3 rounded-xl text-[15px] font-medium font-inter text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => { setMobileOpen(false); onBookCall?.(); }}
                className="w-full py-3 rounded-xl text-[15px] font-semibold font-inter text-white bg-gradient-to-r from-[#3b82f6] to-[#0d9488] shadow-[0_4px_14px_rgba(59,130,246,0.22)]"
              >
                Réserver un appel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
