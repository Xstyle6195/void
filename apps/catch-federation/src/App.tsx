import "./App.css"
import { TopBar } from "./components/TopBar"
import { RosterView } from "./components/RosterView"
import { BookingView } from "./components/BookingView"
import { ResultsView } from "./components/ResultsView"
import { TitlesView } from "./components/TitlesView"
import { MarketView } from "./components/MarketView"
import { MarketingView } from "./components/MarketingView"
import { DivisionsView } from "./components/DivisionsView"
import { StartScreen } from "./components/StartScreen"
import { useEcran, useFederation, usePhase, useStore } from "./state/store"
import type { Screen } from "./game/types"

const ONGLETS: { value: Screen; label: string }[] = [
  { value: "effectif", label: "Effectif" },
  { value: "booking", label: "Booking" },
  { value: "resultats", label: "Résultats" },
  { value: "titres", label: "Titres" },
  { value: "marche", label: "Marché" },
  { value: "marketing", label: "Marketing" },
  { value: "divisions", label: "Divisions" },
]

function ContenuEcran({ ecran }: { ecran: Screen }) {
  switch (ecran) {
    case "effectif":
      return <RosterView />
    case "booking":
      return <BookingView />
    case "resultats":
      return <ResultsView />
    case "titres":
      return <TitlesView />
    case "marche":
      return <MarketView />
    case "marketing":
      return <MarketingView />
    case "divisions":
      return <DivisionsView />
    default:
      return null
  }
}

function App() {
  const phase = usePhase()

  if (phase === "accueil") {
    return (
      <div className="app">
        <StartScreen />
      </div>
    )
  }

  return <Jeu />
}

function Jeu() {
  const [ecran, setEcran] = useEcran()
  const federation = useFederation()
  const recommencer = useStore((s) => s.recommencer)

  if (federation.gameOver) {
    return (
      <div className="app app-game-over">
        <h1>Faillite</h1>
        <p>
          La fédération {federation.nom} a fait faillite à la semaine {federation.semaine}.
        </p>
        <button className="primaire" onClick={recommencer}>
          Recommencer
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar />
      <main className="contenu">
        <ContenuEcran ecran={ecran} />
      </main>
      <nav className="onglets">
        {ONGLETS.map((o) => (
          <button
            key={o.value}
            className={`onglet ${ecran === o.value ? "actif" : ""}`}
            onClick={() => setEcran(o.value)}
          >
            {o.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
