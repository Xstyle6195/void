import { useState } from "react"
import type { Difficulte } from "../game/types"
import { useStore } from "../state/store"

const DIFFICULTES: { value: Difficulte; label: string; description: string }[] = [
  { value: "facile", label: "Facile", description: "25 000 € de départ, 30% de popularité." },
  { value: "normal", label: "Normal", description: "15 000 € de départ, 20% de popularité." },
  { value: "difficile", label: "Difficile", description: "8 000 € de départ, 10% de popularité." },
]

export function StartScreen() {
  const demarrerFederation = useStore((s) => s.demarrerFederation)
  const [nom, setNom] = useState("")
  const [difficulte, setDifficulte] = useState<Difficulte>("normal")

  return (
    <div className="ecran-accueil">
      <h1 className="titre-accueil">Catch Fédération</h1>
      <p className="texte-muted">Crée et dirige ta propre fédération de catch.</p>

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

      <span className="champ-label">Difficulté</span>
      <div className="selecteur-difficulte">
        {DIFFICULTES.map((d) => (
          <button
            key={d.value}
            className={`carte-difficulte ${difficulte === d.value ? "selectionnee" : ""}`}
            onClick={() => setDifficulte(d.value)}
          >
            <span className="carte-difficulte-titre">{d.label}</span>
            <span className="carte-difficulte-description">{d.description}</span>
          </button>
        ))}
      </div>

      <button
        className="primaire bouton-demarrer"
        onClick={() => demarrerFederation(nom, difficulte)}
      >
        Créer la fédération
      </button>
    </div>
  )
}
