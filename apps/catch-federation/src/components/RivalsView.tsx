import { LABEL_PALIER, palierPourFans, valorisationRivale, type FederationRivale, type PalierRivale } from "../game/rivals"
import { useFederation, useStore } from "../state/store"

const PALIERS: PalierRivale[] = ["locale", "regionale", "nationale", "mondiale"]

function CarteRivale({ rivale }: { rivale: FederationRivale }) {
  const federation = useFederation()
  const racheterRivale = useStore((s) => s.racheterRivale)

  const rachetable = rivale.fans < federation.fans
  const cout = valorisationRivale(rivale)
  const argentOk = federation.argent >= cout

  return (
    <div className="carte-rivale">
      <div className="carte-rivale-entete">
        <h3>{rivale.nom}</h3>
      </div>
      <div className="campagne-gains">
        <span>{rivale.fans.toLocaleString("fr-FR")} fans</span>
        <span>{rivale.popularite}% popularité</span>
      </div>
      {rachetable ? (
        <button
          className="primaire"
          onClick={() => racheterRivale(rivale.id)}
          disabled={!argentOk}
        >
          {argentOk ? `Racheter (${cout.toLocaleString("fr-FR")} €)` : "Trésorerie insuffisante"}
        </button>
      ) : (
        <p className="texte-muted">Trop grande pour être rachetée.</p>
      )}
    </div>
  )
}

export function RivalsView() {
  const federation = useFederation()
  const palierJoueur = palierPourFans(federation.fans)

  return (
    <div className="vue">
      <h2>Fédérations rivales</h2>
      <p className="texte-muted">
        {federation.nom} évolue en division {LABEL_PALIER[palierJoueur]}, avec{" "}
        {federation.fans.toLocaleString("fr-FR")} fans.
      </p>

      {PALIERS.map((palier) => {
        const rivalesDuPalier = federation.rivales
          .filter((r) => r.palier === palier)
          .sort((a, b) => b.fans - a.fans)
        return (
          <div key={palier} className="groupe-palier">
            <h3 className="titre-palier">
              {LABEL_PALIER[palier]}
              {palier === palierJoueur && " · votre division"}
            </h3>
            <div className="liste-campagnes">
              {palier === palierJoueur && (
                <div className="carte-rivale carte-rivale-joueur">
                  <h3>{federation.nom} (vous)</h3>
                  <div className="campagne-gains">
                    <span>{federation.fans.toLocaleString("fr-FR")} fans</span>
                    <span>{federation.popularite}% popularité</span>
                  </div>
                </div>
              )}
              {rivalesDuPalier.map((r) => (
                <CarteRivale key={r.id} rivale={r} />
              ))}
              {rivalesDuPalier.length === 0 && palier !== palierJoueur && (
                <p className="texte-muted">Aucune fédération à ce palier pour le moment.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
