import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedHeroTitle() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => [
    "reportings manuels",
    "consolidations fastidieuses",
    "retraitements Excel",
    "dashboards à la main",
  ], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <h1 className="hero-stagger hero-d1 font-poppins text-[clamp(2.6rem,6.5vw,4.8rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-[#111827] dark:text-white text-center">
      <span className="block">Plus jamais de</span>
      <span className="block relative pb-3" style={{ clipPath: "inset(0 -9999px)" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={titleNumber}
            className="inline-block text-brand-gradient whitespace-nowrap"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {titles[titleNumber]}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}
