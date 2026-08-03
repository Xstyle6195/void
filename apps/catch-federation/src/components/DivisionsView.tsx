import { DIVISIONS_INFO } from "../game/divisions"
import { useFederation, useStore } from "../state/store"

export function DivisionsView() {
  const federation = useFederation()
  const debloquerDivision = useStore((s) => s.debloquerDivision)

  return (
    <div className="vue">
      <h2>Divisions</h2>
      <div className="liste-divisions">
        {DIVISIONS_INFO.map((info) => {
          const debloquee = federation.divisionsDebloquees.includes(info.id)
          const effectif = federation.roster.filter((w) => w.division === info.id).length
          const semaineOk = federation.semaine >= info.semaineMinimum
          const argentOk = federation.argent >= info.cout

          return (
            <div key={info.id} className={`carte-division ${debloquee ? "debloquee" : ""}`}>
              <div className="carte-division-entete">
                <h3>{info.label}</h3>
                {debloquee && <span className="badge badge-titre">Active</span>}
              </div>
              <p className="texte-muted">{info.description}</p>

              {debloquee ? (
                <p className="carte-division-effectif">{effectif} lutteur{effectif > 1 ? "s" : ""}</p>
              ) : (
                <>
                  <p className="carte-division-condition">
                    Coût : {info.cout.toLocaleString("fr-FR")} € · Débloquable dès la semaine{" "}
                    {info.semaineMinimum}
                  </p>
                  <button
                    className="primaire"
                    onClick={() => debloquerDivision(info.id)}
                    disabled={!semaineOk || !argentOk}
                  >
                    {!semaineOk
                      ? `Disponible semaine ${info.semaineMinimum}`
                      : !argentOk
                        ? "Trésorerie insuffisante"
                        : "Débloquer"}
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
