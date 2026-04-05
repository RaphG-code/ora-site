import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

type NavigationProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBookCall?: () => void;
  currentPage: "home" | "for-business";
  onNavigate: (page: "home" | "for-business") => void;
};

const links = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
];

const Navigation: React.FC<NavigationProps> = ({
  theme,
  onToggleTheme,
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
      // Give the page time to mount before scrolling
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

  const dk = theme === "dark";

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? dk
            ? "bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            : "bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "bg-transparent",
      ].join(" ")}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        {/* Logo */}
        <button
          onClick={() => {
            if (currentPage === "home") {
              const lenis = (window as any).__lenis;
              if (lenis) {
                lenis.start();
                lenis.scrollTo(0, { immediate: true });
              }
              // Force native scroll as well — handles edge cases
              window.scrollTo({ top: 0 });
            } else {
              onNavigate("home");
            }
          }}
          className={[
            "text-[22px] font-thin tracking-[-0.04em] transition-colors",
            dk ? "text-white" : "text-black",
          ].join(" ")}
        >
          Ora
        </button>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={[
                "px-4 py-2 rounded-full text-[13px] font-thin tracking-[-0.01em] transition-colors duration-200",
                dk
                  ? "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  : "text-black hover:text-black hover:bg-gray-100/70",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { setMobileOpen(false); onNavigate("for-business"); }}
            className={[
              "px-4 py-2 rounded-full text-[13px] font-thin tracking-[-0.01em] transition-colors duration-200",
              currentPage === "for-business"
                ? dk
                  ? "text-white bg-white/[0.08]"
                  : "text-black bg-gray-100/80"
                : dk
                  ? "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  : "text-black hover:text-black hover:bg-gray-100/70",
            ].join(" ")}
          >
            For Business
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className={[
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200",
              dk
                ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
                : "text-black hover:text-black hover:bg-gray-100",
            ].join(" ")}
            aria-label="Toggle theme"
          >
            {dk ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* CTA — desktop */}
          <button
            onClick={onBookCall}
            className={[
              "hidden md:inline-flex items-center px-5 py-2 rounded-full text-[13px] font-thin transition-all duration-200",
              "bg-gradient-to-r from-sky-400 to-sky-500 text-white",
              "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(14,165,233,0.25)]",
              "hover:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_6px_20px_rgba(14,165,233,0.35)]",
              "hover:-translate-y-px active:translate-y-0",
            ].join(" ")}
          >
            Get Started
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={[
              "md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              dk
                ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
                : "text-black hover:text-black hover:bg-gray-100",
            ].join(" ")}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={[
            "md:hidden border-t px-6 pb-5 pt-3",
            dk
              ? "bg-[#020617]/95 backdrop-blur-xl border-white/[0.06]"
              : "bg-white/95 backdrop-blur-xl border-gray-200/60",
          ].join(" ")}
        >
          <div className="flex flex-col gap-1">
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={[
                  "text-left px-4 py-3 rounded-xl text-[15px] font-thin transition-colors",
                  dk
                    ? "text-gray-300 hover:bg-white/[0.06]"
                    : "text-black hover:bg-gray-50",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setMobileOpen(false); onNavigate("for-business"); }}
              className={[
                "text-left px-4 py-3 rounded-xl text-[15px] font-thin transition-colors",
                currentPage === "for-business"
                  ? dk ? "text-white bg-white/[0.06]" : "text-black bg-gray-50"
                  : dk ? "text-gray-300 hover:bg-white/[0.06]" : "text-black hover:bg-gray-50",
              ].join(" ")}
            >
              For Business
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onBookCall?.();
              }}
              className="mt-2 w-full py-3 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-r from-sky-400 to-sky-500 shadow-[0_4px_12px_rgba(14,165,233,0.25)]"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
