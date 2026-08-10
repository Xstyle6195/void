import { useState } from "react"
import { ORDRE_RANGS, PRESETS_RANG } from "../game/rangDepart"
import { LABEL_PALIER, type PalierRivale } from "../game/rivals"
import { useStore } from "../state/store"

const LOGOS = ["🦁", "🐺", "⚡", "🔥", "💀", "👑", "🦂", "🐉", "⭐", "💪", "🥊", "🦅"]

export function StartScreen() {
  const demarrerFederation = useStore((s) => s.demarrerFederation)
  const [nom, setNom] = useState("")
  const [logo, setLogo] = useState(LOGOS[0])
  const [rang, setRang] = useState<PalierRivale>("locale")

  return (
    <div className="ecran-accueil">
      <h1 className="titre-accueil">Catch Fédération</h1>
      <p className="texte-muted">Crée et dirige ta propre fédération de catch.</p>

      <label className="champ-label">Logo de la fédération</label>
      <div className="grille-logos">
        {LOGOS.map((l) => (
          <button
            key={l}
            type="button"
            className={`bouton-logo ${logo === l ? "actif" : ""}`}
            onClick={() => setLogo(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <label className="champ-label" htmlFor="nom-federation">
        Nom de la fédération
      </label>
      <input
        id="nom-federation"
        className="champ-nom"
        type="text"
        placeholder="Ma Fédération"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        maxLength={30}
      />

      <label className="champ-label">Rang de départ</label>
      <div className="grille-rangs">
        {ORDRE_RANGS.map((r) => {
          const preset = PRESETS_RANG[r]
          return (
            <button
              key={r}
              type="button"
              className={`carte-rang ${rang === r ? "actif" : ""}`}
              onClick={() => setRang(r)}
            >
              <span className="carte-rang-nom">{LABEL_PALIER[r]}</span>
              <span className="carte-rang-stats">
                {preset.argent.toLocaleString("fr-FR")} € · {preset.fans.toLocaleString("fr-FR")} fans
              </span>
              <span className="carte-rang-description">{preset.description}</span>
            </button>
          )
        })}
      </div>

      <button
        className="primaire bouton-demarrer"
        onClick={() => demarrerFederation(nom, logo, rang)}
      >
        Créer la fédération
      </button>
    </div>
  )
}
