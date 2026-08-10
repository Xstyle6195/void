import "./App.css"
import { TopBar } from "./components/TopBar"
import { RosterView } from "./components/RosterView"
import { BookingView } from "./components/BookingView"
import { ResultsView } from "./components/ResultsView"
import { TitlesView } from "./components/TitlesView"
import { MarketView } from "./components/MarketView"
import { MarketingView } from "./components/MarketingView"
import { OfficialsView } from "./components/OfficialsView"
import { DivisionsView } from "./components/DivisionsView"
import { RivalsView } from "./components/RivalsView"
import { ActualitesView } from "./components/ActualitesView"
import { StartScreen } from "./components/StartScreen"
import { RecrutementInitialScreen } from "./components/RecrutementInitialScreen"
import { useEcran, useFederation, usePhase, useStore } from "./state/store"
import type { Screen } from "./game/types"

const ONGLETS: { value: Screen; label: string; icone: string }[] = [
  { value: "effectif", label: "Effectif", icone: "👥" },
  { value: "booking", label: "Booking", icone: "🥊" },
  { value: "resultats", label: "Résultats", icone: "📊" },
  { value: "titres", label: "Titres", icone: "🏆" },
  { value: "marche", label: "Marché", icone: "💰" },
  { value: "marketing", label: "Marketing", icone: "📣" },
  { value: "officiels", label: "Officiels", icone: "🧑‍💼" },
  { value: "divisions", label: "Divisions", icone: "🗂️" },
  { value: "rivales", label: "Rivales", icone: "⚔️" },
  { value: "actualites", label: "Actus", icone: "📰" },
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
    case "officiels":
      return <OfficialsView />
    case "divisions":
      return <DivisionsView />
    case "rivales":
      return <RivalsView />
    case "actualites":
      return <ActualitesView />
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

  if (phase === "recrutement-initial") {
    return (
      <div className="app">
        <RecrutementInitialScreen />
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
      <div className="corps-app">
        <nav className="sidebar">
          {ONGLETS.map((o) => (
            <button
              key={o.value}
              className={`onglet-lateral ${ecran === o.value ? "actif" : ""}`}
              onClick={() => setEcran(o.value)}
            >
              <span className="onglet-icone">{o.icone}</span>
              <span className="onglet-label">{o.label}</span>
            </button>
          ))}
        </nav>
        <main className="contenu">
          <ContenuEcran ecran={ecran} />
        </main>
      </div>
    </div>
  )
}

export default App
