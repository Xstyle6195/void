import { useState } from "react"
import {
  coutRecrutementRival,
  LABEL_PALIER,
  palierPourFans,
  valorisationRivale,
  type FederationRivale,
  type PalierRivale,
} from "../game/rivals"
import type { Wrestler } from "../game/types"
import { MAX_ROSTER_DIVISION, useFederation, useStore } from "../state/store"
import { Etoiles } from "./Etoiles"

const PALIERS: PalierRivale[] = ["locale", "regionale", "nationale", "mondiale"]

function CarteLutteurRival({ lutteur, rivale }: { lutteur: Wrestler; rivale: FederationRivale }) {
  const federation = useFederation()
  const recruterDepuisRivale = useStore((s) => s.recruterDepuisRivale)
  const [cible, setCible] = useState(federation.divisions[0]?.id ?? "")
  const divisionCible = federation.divisions.find((d) => d.id === cible)
  const divisionPleine = (divisionCible?.roster.length ?? 0) >= MAX_ROSTER_DIVISION
  const blesse = lutteur.blessureSemaines > 0
  const estChampion = rivale.titreChampionId === lutteur.id
  const cout = coutRecrutementRival(lutteur)
  const argentOk = federation.argent >= cout

  return (
    <div className="carte-lutteur carte-lutteur-rival">
      <div className="carte-lutteur-entete">
        <div>
          <h3>{lutteur.name}</h3>
          <span className="badge badge-genre">{lutteur.genre === "homme" ? "Catcheur" : "Catcheuse"}</span>
          <span className={`badge badge-${lutteur.alignment}`}>
            {lutteur.alignment === "face" ? "Face" : "Heel"}
          </span>
          <span className="badge badge-style">{lutteur.style}</span>
          {estChampion && <span className="badge badge-titre">🏆 Champion</span>}
          {blesse && <span className="badge badge-blessure">Blessé ({lutteur.blessureSemaines} sem.)</span>}
        </div>
      </div>
      <Etoiles label="Charisme" valeur={lutteur.charisme} />
      <Etoiles label="Technique" valeur={lutteur.technique} />
      <Etoiles label="Force" valeur={lutteur.force} />
      <div className="carte-lutteur-pied">
        <span>Âge {lutteur.age}</span>
        <span>{lutteur.popularite}% popularité</span>
      </div>
      <div className="carte-lutteur-actions">
        <select value={cible} onChange={(e) => setCible(e.target.value)}>
          {federation.divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom} ({d.roster.length}/{MAX_ROSTER_DIVISION})
            </option>
          ))}
        </select>
        <button
          className="primaire"
          onClick={() => recruterDepuisRivale(rivale.id, lutteur.id, cible)}
          disabled={blesse || !argentOk || divisionPleine}
        >
          {blesse
            ? "Indisponible"
            : divisionPleine
              ? "Division pleine"
              : `Débaucher (${cout.toLocaleString("fr-FR")} €)`}
        </button>
      </div>
    </div>
  )
}

function CarteRivale({ rivale }: { rivale: FederationRivale }) {
  const federation = useFederation()
  const racheterRivale = useStore((s) => s.racheterRivale)
  const [deplie, setDeplie] = useState(false)

  const rachetable = rivale.fans < federation.fans
  const cout = valorisationRivale(rivale)
  const argentOk = federation.argent >= cout
  const champion = rivale.roster.find((w) => w.id === rivale.titreChampionId)
  const roster = [...rivale.roster].sort((a, b) => b.popularite - a.popularite)

  return (
    <div className="carte-rivale">
      <div className="carte-rivale-entete">
        <h3>{rivale.nom}</h3>
      </div>
      <div className="campagne-gains">
        <span>{rivale.fans.toLocaleString("fr-FR")} fans</span>
        <span>{rivale.popularite}% popularité</span>
      </div>
      {champion && <p className="texte-muted texte-champion-rival">🏆 Champion : {champion.name}</p>}
      <button className="bouton-roster-rival" onClick={() => setDeplie((v) => !v)}>
        {deplie ? "Masquer le roster ▲" : `Voir le roster (${rivale.roster.length}) ▼`}
      </button>
      {deplie && (
        <div className="liste-roster-rival">
          {roster.map((w) => (
            <CarteLutteurRival key={w.id} lutteur={w} rivale={rivale} />
          ))}
        </div>
      )}
      {rachetable ? (
        <button className="primaire" onClick={() => racheterRivale(rivale.id)} disabled={!argentOk}>
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
