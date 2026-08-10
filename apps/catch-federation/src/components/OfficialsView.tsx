import { conseilAdjoint, conseilArtistique, conseilMarketing, etatEffectif } from "../game/conseils"
import { CANDIDATS_OFFICIELS, candidatParId, ROLES_INFO, type RoleOfficiel } from "../game/officials"
import type { FederationState } from "../game/types"
import { useFederation, useStore } from "../state/store"

const ROLES: RoleOfficiel[] = ["marketing", "artistique", "adjoint"]

const CONSEILS: Record<RoleOfficiel, (f: FederationState) => string> = {
  marketing: conseilMarketing,
  artistique: conseilArtistique,
  adjoint: conseilAdjoint,
}

function BlocRole({ role }: { role: RoleOfficiel }) {
  const federation = useFederation()
  const recruterOfficiel = useStore((s) => s.recruterOfficiel)
  const licencierOfficiel = useStore((s) => s.licencierOfficiel)
  const info = ROLES_INFO[role]
  const officielId = federation.officiels[role]
  const officiel = officielId ? candidatParId(officielId) : undefined
  const candidats = CANDIDATS_OFFICIELS.filter((c) => c.role === role)

  return (
    <div className="carte-officiel">
      <h3>{info.label}</h3>
      <p className="texte-muted">{info.description}</p>

      {officiel ? (
        <>
          <div className="officiel-en-poste">
            <div>
              <strong>{officiel.nom}</strong>
              <span className="badge">{officiel.niveau}</span>
            </div>
            <span className="texte-muted">
              +{officiel.bonus} {info.uniteBonus} · {officiel.salaire} €/sem.
            </span>
          </div>
          <p className="conseil-officiel">💬 {CONSEILS[role](federation)}</p>
          <button className="danger" onClick={() => licencierOfficiel(role)}>
            Licencier
          </button>
        </>
      ) : (
        <div className="liste-candidats">
          {candidats.map((c) => (
            <div key={c.id} className="ligne-candidat">
              <div>
                <strong>{c.nom}</strong>
                <span className="badge">{c.niveau}</span>
                <span className="texte-muted">
                  {" "}
                  · +{c.bonus} {info.uniteBonus} · {c.salaire} €/sem.
                </span>
              </div>
              <button
                className="primaire"
                onClick={() => recruterOfficiel(c.id)}
                disabled={federation.argent < c.coutRecrutement}
              >
                Recruter ({c.coutRecrutement.toLocaleString("fr-FR")} €)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function OfficialsView() {
  const federation = useFederation()
  const effectif = etatEffectif(federation)
  const auMoinsUnOfficiel = ROLES.some((r) => federation.officiels[r])

  return (
    <div className="vue">
      <h2>Officiels</h2>

      {auMoinsUnOfficiel && (
        <div className="carte-etat-effectif">
          <h3>État de l'effectif</h3>
          <p className="texte-muted">Rapport de vos managers.</p>
          <div className="campagne-gains">
            <span>{effectif.total} lutteurs</span>
            <span>{effectif.blesses} blessé{effectif.blesses > 1 ? "s" : ""}</span>
            <span>Moral moyen {effectif.moralMoyen}</span>
            <span>Forme moyenne {effectif.formeMoyenne}</span>
          </div>
        </div>
      )}

      {ROLES.map((role) => (
        <BlocRole key={role} role={role} />
      ))}
    </div>
  )
}
