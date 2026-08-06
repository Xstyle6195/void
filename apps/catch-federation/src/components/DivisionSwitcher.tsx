import { useFederation, useStore } from "../state/store"

export function DivisionSwitcher({ divisionId }: { divisionId: string }) {
  const federation = useFederation()
  const setDivisionActive = useStore((s) => s.setDivisionActive)

  if (federation.divisions.length <= 1) return null

  return (
    <select
      className="selecteur-division"
      value={divisionId}
      onChange={(e) => setDivisionActive(e.target.value)}
    >
      {federation.divisions.map((d) => (
        <option key={d.id} value={d.id}>
          {d.nom}
        </option>
      ))}
    </select>
  )
}
