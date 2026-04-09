import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedHeroTitle() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["reportings", "modèles", "dashboard"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <h1 className="hero-stagger hero-d1 font-poppins text-[clamp(2.6rem,6.5vw,4.8rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-[#111827] text-center">
      <span className="block">Plus jamais de</span>
      <span className="flex items-baseline justify-center gap-[0.22em]">
        {/* Grid trick: container width = widest word, no overflow-hidden */}
        <span
          className="relative inline-grid pb-3 overflow-visible"
          style={{ gridTemplateColumns: "1fr" }}
        >
          {/* Invisible spacers to size the container */}
          {titles.map((title) => (
            <span
              key={`spacer-${title}`}
              className="[grid-area:1/1] invisible pointer-events-none select-none"
              aria-hidden="true"
            >
              {title}
            </span>
          ))}

          {/* AnimatePresence mode="wait" → exit completes before enter starts */}
          <AnimatePresence mode="wait">
            <motion.span
              key={titleNumber}
              className="[grid-area:1/1] text-center text-brand-gradient"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {titles[titleNumber]}
            </motion.span>
          </AnimatePresence>
        </span>

        <span>manuels.</span>
      </span>
    </h1>
  );
}
