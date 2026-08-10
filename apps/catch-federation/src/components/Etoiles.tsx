function valeurEnEtoiles(valeur: number): number {
  const brut = (valeur / 100) * 5
  const arrondi = Math.round(brut * 2) / 2
  return Math.max(0.5, Math.min(5, arrondi))
}

export function Etoiles({ label, valeur }: { label: string; valeur: number }) {
  const note = valeurEnEtoiles(valeur)

  return (
    <div className="ligne-etoiles">
      <span className="etoiles-label">{label}</span>
      <span className="etoiles-affichage" role="img" aria-label={`${note} sur 5 étoiles`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const remplissage = Math.max(0, Math.min(1, note - i)) * 100
          return (
            <span className="etoile" key={i}>
              <span className="etoile-fond">★</span>
              <span className="etoile-remplissage" style={{ width: `${remplissage}%` }}>
                ★
              </span>
            </span>
          )
        })}
      </span>
    </div>
  )
}
