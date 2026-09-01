interface FooterMenuItem {
  title: string;
  links: {
    text: string;
    url?: string;
    onClick?: () => void;
  }[];
}

interface FooterProps {
  logo?: {
    src: string;
    alt: string;
    title: string;
    onClick?: () => void;
  };
  tagline?: string;
  menuItems?: FooterMenuItem[];
  /** Small-print legal line (company legal mentions) shown in the bottom bar. */
  legal?: string;
  copyright?: string;
  bottomLinks?: {
    text: string;
    url?: string;
    onClick?: () => void;
  }[];
}

const Footer = ({
  logo,
  tagline,
  menuItems = [],
  legal,
  copyright,
  bottomLinks = [],
}: FooterProps) => {
  return (
    <footer className="py-12 px-5 md:py-16 md:px-12 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:gap-8 lg:grid-cols-6">
          {/* Logo + tagline */}
          <div className="col-span-2 mb-4 lg:mb-0">
            {logo && (
              <div className="flex items-center gap-2">
                {logo.onClick ? (
                  /* ⚠ `focus:outline-none` RETIRÉ (audit du 2026-08-15) : il
                     était posé sans rien mettre à la place, et c'était le SEUL
                     endroit du site où l'anneau du navigateur était supprimé.
                     Un anneau de marque le remplace, visible seulement au
                     clavier grâce à `focus-visible`. */
                  <button
                    onClick={logo.onClick}
                    aria-label={logo.alt}
                    className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    <img src={logo.src} alt={logo.alt} className="h-6 md:h-8" />
                  </button>
                ) : (
                  <img src={logo.src} alt={logo.alt} className="h-6 md:h-8" />
                )}
              </div>
            )}
            {/* PIED DE PAGE, CORPS DE TEXTE (2026-08-22) : la baseline, les
                colonnes de liens et la mention légale tournaient à 11,5 / 11 /
                9,5 px. Ce sont des tailles de PIED DE BUREAU, où la colonne
                fait 300 px et se lit à 60 cm ; sur un téléphone tenu à 30 cm
                elles passent sous le seuil de lecture confortable. Les liens du
                pied sont en outre des CIBLES TACTILES. Le bureau ne bouge pas :
                toutes les valeurs `md:` sont inchangées. */}
            {tagline && (
              <p className="mt-2 text-[13.5px] leading-[1.5] text-gray-500 md:mt-4 md:text-sm md:leading-relaxed dark:text-gray-400 max-w-xs">
                {tagline}
              </p>
            )}
          </div>

          {/* Menu columns */}
          {menuItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <h3 className="mb-2.5 text-[11.5px] font-semibold text-gray-900 md:mb-4 md:text-sm dark:text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2.5 md:space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    {link.onClick ? (
                      <button
                        onClick={link.onClick}
                        className="text-left text-[13.5px] max-md:leading-snug text-gray-500 md:text-sm dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
                      >
                        {link.text}
                      </button>
                    ) : (
                      <a
                        href={link.url ?? "#"}
                        className="text-left text-[13.5px] max-md:leading-snug text-gray-500 md:text-sm dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
                      >
                        {link.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 border-t border-gray-200 pt-4 md:mt-10 md:pt-5 dark:border-gray-800">
          {legal && (
            <p className="mb-3 text-[11px] max-md:leading-[1.5] leading-relaxed text-gray-400 md:mb-4 md:text-[11px] dark:text-gray-500">
              {legal}
            </p>
          )}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          {copyright && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{copyright}</p>
          )}
          {bottomLinks.length > 0 && (
            <ul className="flex flex-wrap gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx}>
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
                    >
                      {link.text}
                    </button>
                  ) : (
                    <a
                      href={link.url ?? "#"}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
                    >
                      {link.text}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
export type { FooterProps, FooterMenuItem };
