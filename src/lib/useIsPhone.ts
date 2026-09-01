import { useEffect, useState } from "react";

/**
 * `true` sous 768 px de large.
 *
 * POURQUOI UN CROCHET ET PAS UNE CLASSE `md:` : certaines décisions ne sont pas
 * des décisions d'affichage mais de CHARGE — combien de particules semer, faut-il
 * ouvrir un contexte WebGL. `hidden md:block` monte le composant et le peint
 * quand même : le coût est payé, seul le résultat est caché. Ici on veut
 * l'inverse, ne pas payer, ou payer moins.
 *
 * ⚠ Le premier rendu répond DÉJÀ la bonne valeur (l'initialiseur lit la
 * fenêtre), et pas `false` corrigé au montage : un composant WebGL monté puis
 * démonté ouvre et referme un contexte graphique pour rien, et les navigateurs
 * en plafonnent le nombre par onglet.
 */
export function useIsPhone(upTo = 768) {
  const [phone, setPhone] = useState(
    () => typeof window !== "undefined" && window.innerWidth < upTo,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${upTo - 0.02}px)`);
    const read = () => setPhone(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [upTo]);

  return phone;
}

export default useIsPhone;
