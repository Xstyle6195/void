import { useState } from "react"
import { useStore } from "../state/store"

export function StartScreen() {
  const demarrerFederation = useStore((s) => s.demarrerFederation)
  const [nom, setNom] = useState("")

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

      <button
        className="primaire bouton-demarrer"
        onClick={() => demarrerFederation(nom, "normal")}
      >
        Créer la fédération
      </button>
    </div>
  )
}
