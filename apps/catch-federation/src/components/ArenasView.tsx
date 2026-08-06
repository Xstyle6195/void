import { ARENES, areneParId, areneSuivante } from "../game/arenas"
import { useFederation, useStore } from "../state/store"

export function ArenasView() {
  const federation = useFederation()
  const ameliorerArene = useStore((s) => s.ameliorerArene)

  return (
    <div className="vue">
      <h2>Arènes</h2>
      <div className="liste-divisions">
        {federation.divisions.map((d) => {
          const arene = areneParId(d.areneId)
          const suivante = areneSuivante(d.areneId)
          const fansOk = suivante ? federation.fans >= suivante.fansRequis : false
          const argentOk = suivante ? federation.argent >= suivante.coutUpgrade : false

          return (
            <div key={d.id} className="carte-arene-division">
              <h3>{d.nom}</h3>
              <div className="echelle-arenes">
                {ARENES.map((a) => (
                  <span
                    key={a.id}
                    className={`palier-arene ${a.id === arene.id ? "actuel" : ""}`}
                  >
                    {a.nom}
                  </span>
                ))}
              </div>
              <p className="texte-muted">{arene.description}</p>
              <div className="campagne-gains">
                <span>Capacité : {arene.capacite.toLocaleString("fr-FR")}</span>
                <span>Billet : {arene.prixBillet} €</span>
              </div>

              {suivante ? (
                <>
                  <p className="carte-division-condition">
                    Passer à {suivante.nom} : {suivante.coutUpgrade.toLocaleString("fr-FR")} €
                    {suivante.fansRequis > 0 &&
                      ` · dès ${suivante.fansRequis.toLocaleString("fr-FR")} fans`}
                  </p>
                  <button
                    className="primaire"
                    onClick={() => ameliorerArene(d.id)}
                    disabled={!fansOk || !argentOk}
                  >
                    {!fansOk
                      ? `Nécessite ${suivante.fansRequis.toLocaleString("fr-FR")} fans`
                      : !argentOk
                        ? "Trésorerie insuffisante"
                        : `Passer à ${suivante.nom}`}
                  </button>
                </>
              ) : (
                <p className="carte-division-condition">Palier maximum atteint.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
