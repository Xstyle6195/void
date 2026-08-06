import { CAMPAGNES_MARKETING, PALIERS_MARKETING, type CampagneMarketing } from "../game/marketing"
import { useFederation, useStore } from "../state/store"

function CarteCampagne({ campagne }: { campagne: CampagneMarketing }) {
  const federation = useFederation()
  const lancerCampagne = useStore((s) => s.lancerCampagne)

  const fansOk = federation.fans >= campagne.fansRequis
  const argentOk = federation.argent >= campagne.cout
  const derniereUtilisation = federation.derniereCampagne[campagne.id]
  const semainesRestantes =
    derniereUtilisation !== undefined
      ? campagne.cooldownSemaines - (federation.semaine - derniereUtilisation)
      : 0
  const enCooldown = semainesRestantes > 0

  let libelleBouton = "Lancer"
  if (!fansOk) libelleBouton = `Nécessite ${campagne.fansRequis.toLocaleString("fr-FR")} fans`
  else if (enCooldown) libelleBouton = `Disponible dans ${semainesRestantes} sem.`
  else if (!argentOk) libelleBouton = "Trésorerie insuffisante"

  return (
    <div className="carte-campagne">
      <h3>{campagne.nom}</h3>
      <p className="texte-muted">{campagne.description}</p>
      <div className="campagne-gains">
        <span>Coût : {campagne.cout.toLocaleString("fr-FR")} €</span>
        <span>+{campagne.gainFans.toLocaleString("fr-FR")} fans</span>
        {campagne.gainPopularite > 0 && <span>+{campagne.gainPopularite}% popularité</span>}
      </div>
      <button
        className="primaire"
        onClick={() => lancerCampagne(campagne.id)}
        disabled={!fansOk || !argentOk || enCooldown}
      >
        {libelleBouton}
      </button>
    </div>
  )
}

export function MarketingView() {
  const paliers = [1, 2, 3, 4] as const

  return (
    <div className="vue">
      <h2>Marketing</h2>
      {paliers.map((palier) => (
        <div key={palier} className="groupe-palier">
          <h3 className="titre-palier">{PALIERS_MARKETING[palier]}</h3>
          <div className="liste-campagnes">
            {CAMPAGNES_MARKETING.filter((c) => c.palier === palier).map((c) => (
              <CarteCampagne key={c.id} campagne={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
