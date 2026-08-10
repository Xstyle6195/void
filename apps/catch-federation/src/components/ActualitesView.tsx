import { useFederation } from "../state/store"

export function ActualitesView() {
  const federation = useFederation()

  return (
    <div className="vue">
      <h2>Actualités du monde du catch</h2>
      <p className="texte-muted">Ce qui se passe chez les autres fédérations, semaine après semaine.</p>

      {federation.actualites.length === 0 ? (
        <p className="texte-muted">
          Pas encore d'actualités. Reviens après avoir lancé quelques shows pour suivre la vie des
          fédérations rivales.
        </p>
      ) : (
        <div className="liste-actualites">
          {federation.actualites.map((a) => {
            const rivale = a.rivaleId ? federation.rivales.find((r) => r.id === a.rivaleId) : undefined
            return (
              <div key={a.id} className="carte-actualite">
                <div className="actualite-entete">
                  <span className="actualite-semaine">Semaine {a.semaine}</span>
                  {rivale && <span className="badge">{rivale.nom}</span>}
                </div>
                <h3 className="actualite-titre">{a.titre}</h3>
                <p className="actualite-corps">{a.corps}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
