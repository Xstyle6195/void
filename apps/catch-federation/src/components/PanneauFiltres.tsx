import {
  FILTRES_PAR_DEFAUT,
  filtresActifs,
  OPTIONS_FILTRE_ALIGNMENT,
  OPTIONS_FILTRE_CONTRAT,
  OPTIONS_FILTRE_GENRE,
  OPTIONS_FILTRE_STYLE,
  type FiltresLutteurs,
} from "../game/triLutteurs"

export function PanneauFiltres({
  filtres,
  onChange,
}: {
  filtres: FiltresLutteurs
  onChange: (f: FiltresLutteurs) => void
}) {
  return (
    <div className="panneau-filtres">
      <div className="barre-filtre">
        <label htmlFor="filtre-genre">Genre</label>
        <select
          id="filtre-genre"
          value={filtres.genre}
          onChange={(e) => onChange({ ...filtres, genre: e.target.value as FiltresLutteurs["genre"] })}
        >
          {OPTIONS_FILTRE_GENRE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="barre-filtre">
        <label htmlFor="filtre-style">Spécialité</label>
        <select
          id="filtre-style"
          value={filtres.style}
          onChange={(e) => onChange({ ...filtres, style: e.target.value as FiltresLutteurs["style"] })}
        >
          {OPTIONS_FILTRE_STYLE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="barre-filtre">
        <label htmlFor="filtre-alignment">Heel / Face</label>
        <select
          id="filtre-alignment"
          value={filtres.alignment}
          onChange={(e) => onChange({ ...filtres, alignment: e.target.value as FiltresLutteurs["alignment"] })}
        >
          {OPTIONS_FILTRE_ALIGNMENT.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="barre-filtre">
        <label htmlFor="filtre-contrat">Contrat</label>
        <select
          id="filtre-contrat"
          value={filtres.contrat}
          onChange={(e) => onChange({ ...filtres, contrat: e.target.value as FiltresLutteurs["contrat"] })}
        >
          {OPTIONS_FILTRE_CONTRAT.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {filtresActifs(filtres) && (
        <button className="danger bouton-reinitialiser-filtres" onClick={() => onChange(FILTRES_PAR_DEFAUT)}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}
