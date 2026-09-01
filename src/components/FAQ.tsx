import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * FAQ — preempts the finance/procurement objections (data location, access,
 * Excel skills, delivery time, deployment, security review, pricing). Answers
 * reflect what the product actually does; no fabricated certifications. The
 * "security review" answer is a process commitment — confirm you can honor it.
 */

export default function FAQ() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);

  const items = [
    {
      q: t({ fr: "Où sont stockées nos données ?", en: "Where is our data stored?" }),
      a: t({
        fr: "En Europe : Francfort et Genève, hors de portée du CLOUD Act américain. Vos fichiers sont chiffrés sur votre appareil avant tout envoi et restent illisibles sur nos serveurs.",
        en: "In Europe: Frankfurt and Geneva, out of reach of the US CLOUD Act. Your files are encrypted on your device before anything is sent and stay unreadable on our servers.",
      }),
    },
    {
      q: t({ fr: "Qui peut accéder à nos fichiers ?", en: "Who can access our files?" }),
      a: t({
        fr: "Uniquement les personnes que vous autorisez. L'accès est cloisonné par organisation, équipe et utilisateur (refusé par défaut), avec authentification et double facteur (MFA).",
        en: "Only the people you authorise. Access is isolated per organisation, team and user (deny-by-default), with authentication and multi-factor (MFA).",
      }),
    },
    {
      // Objection devenue ambiante depuis les déploiements Claude des Big Four
      // (décision client 2026-08-04) : frontale ICI, et seulement ici. Les
      // cartes de la section « bout en bout » restent obliques, sans nommer
      // l'IA générative. Ton : complémentarité, pas opposition.
      q: t({ fr: "Pourquoi ne pas simplement utiliser ChatGPT ou Claude ?", en: "Why not just use ChatGPT or Claude?" }),
      a: t({
        fr: "Pour rédiger un mail ou synthétiser un document, un chatbot fait très bien l'affaire. Vos livrables chiffrés sont un autre sujet : une IA générative produit un résultat plausible, différent à chaque essai, impossible à contrôler ligne à ligne. Ora repose sur des règles de calcul explicites : même fichier, même livrable, vérifiable et opposable. Et vos dossiers clients ne partent pas dans un chatbot.",
        en: "For drafting an email or summarising a document, a chatbot does the job. Your numbers deliverables are a different matter: generative AI produces a plausible result, different on every try, impossible to check line by line. Ora runs on explicit calculation rules: same file, same deliverable, verifiable and defensible. And your client files never go into a chatbot.",
      }),
    },
    {
      q: t({ fr: "Faut-il maîtriser Excel pour utiliser Ora ?", en: "Do we need to master Excel to use Ora?" }),
      a: t({
        fr: "Non. Vous décrivez votre tâche, on l'automatise. Vos équipes lancent l'automatisation sans connaître les formules ni les macros.",
        en: "No. You describe your task, we automate it. Your teams run the automation without knowing formulas or macros.",
      }),
    },
    {
      q: t({ fr: "Combien de temps pour automatiser un de nos processus ?", en: "How long to automate one of our processes?" }),
      a: t({
        fr: "Quelques jours. Vous nous décrivez votre processus, on le reproduit à l'identique. Pas de template générique, pas de mois d'attente.",
        en: "A few days. You describe your process, we reproduce it exactly. No generic template, no months of waiting.",
      }),
    },
    {
      q: t({ fr: "Et si notre processus évolue ?", en: "What if our process changes?" }),
      a: t({
        fr: "Les automatisations sont mises à jour et activées pour vous sans nouvelle installation. Chacune est signée et vérifiée à l'exécution.",
        en: "Automations are updated and enabled for you with no reinstall. Each one is signed and verified at runtime.",
      }),
    },
    {
      q: t({ fr: "Comment Ora se déploie sur nos postes ?", en: "How does Ora deploy on our machines?" }),
      a: t({
        fr: "Ora est une application desktop native, disponible sur macOS aujourd'hui, avec Windows en cours de déploiement. Vos fichiers Excel se synchronisent automatiquement à chaque enregistrement.",
        en: "Ora is a native desktop app, available on macOS today, with Windows rolling out. Your Excel files sync automatically on every save.",
      }),
    },
    {
      q: t({ fr: "Pouvez-vous répondre à notre revue de sécurité ?", en: "Can you support our security review?" }),
      a: t({
        fr: "Oui. Nous fournissons la documentation de sécurité et de conformité (hébergement, chiffrement, traitement des données) nécessaire à votre revue. Contactez-nous pour la recevoir.",
        en: "Yes. We provide the security and compliance documentation (hosting, encryption, data handling) your review needs. Contact us to receive it.",
      }),
    },
    {
      q: t({ fr: "Combien ça coûte ?", en: "How much does it cost?" }),
      a: t({
        fr: "Ora s'adapte à votre périmètre : abonnement annuel et accompagnement à la mise en place. Réservez un appel pour un devis adapté.",
        en: "Ora adapts to your scope: annual subscription and onboarding support. Book a call for a tailored quote.",
      }),
    },
  ];

  return (
    <section id="faq" className="relative py-16 md:py-32 px-5 md:px-12 bg-white dark:bg-black md:dark:bg-black scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-9 md:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400">
            {t({ fr: "FAQ", en: "FAQ" })}
          </span>
          <h2 className="font-poppins font-semibold text-[1.75rem] md:text-[2.75rem] tracking-[-0.03em] leading-[1.12] text-[#111827] dark:text-white mt-3 md:mt-4">
            {t({ fr: "Vos questions, nos réponses", en: "Your questions, answered" })}
          </h2>
        </div>

        <div className="flex flex-col gap-2.5 md:gap-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/70 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 md:gap-4 md:px-6 md:py-5"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                >
                  <span className="font-poppins font-semibold text-[14.5px] max-md:leading-snug md:text-[16px] text-gray-900 dark:text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {/* ⚠ `inert` SUR LE PANNEAU FERMÉ (audit du 2026-08-15). Le
                    repli se fait par `grid-template-rows: 0fr` plus un
                    `overflow-hidden` : visuellement le panneau disparaît, mais
                    il reste dans l'arbre d'accessibilité. Un lecteur d'écran
                    entendait donc les NEUF réponses à la suite, comme si tout
                    l'accordéon était ouvert, ce qui rend la section illisible et
                    vide la FAQ de sa fonction.
                    `inert` plutôt que `hidden` : il retire le contenu de l'arbre
                    et de la tabulation SANS toucher à l'affichage, donc
                    l'animation d'ouverture est conservée telle quelle. */}
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-button-${i}`}
                  inert={!isOpen}
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="font-inter px-5 pb-4 text-[13.5px] leading-relaxed md:px-6 md:pb-5 md:text-[14.5px] text-gray-500 dark:text-gray-400">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
