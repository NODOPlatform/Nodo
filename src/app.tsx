import { LocationProvider, Router, Route } from 'preact-iso'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { OfflineBanner } from './components/layout/OfflineBanner'
import { InstallBanner } from './components/layout/InstallBanner'
import { UpdateBanner } from './components/layout/UpdateBanner'
import { Home } from './pages/Home'
import { NeedHelp } from './pages/NeedHelp'
import { OfferHelp } from './pages/OfferHelp'
import { SearchPerson } from './pages/SearchPerson'
import { ReportFound } from './pages/ReportFound'
import { MapView } from './pages/MapView'
import { VerifiedInfo } from './pages/VerifiedInfo'
import { Detail } from './pages/Detail'
import { Emergencies } from './pages/Emergencies'
import { Shelters } from './pages/Shelters'
import { CollectionCenters } from './pages/CollectionCenters'
import { ReportIncident } from './pages/ReportIncident'
import { Admin } from './pages/Admin'
import { AdminShelters } from './pages/AdminShelters'
import { About } from './pages/About'
import { HealthRequest } from './pages/HealthRequest'
import { Campaigns } from './pages/Campaigns'
import { CampaignDetail } from './pages/CampaignDetail'
import { Collaborate } from './pages/Collaborate'
import { DesignSystem } from './pages/DesignSystem'
import { SituationCenter } from './pages/SituationCenter'
import { initOnlineListener } from './hooks/useOnlineStatus'
import { startQueueMonitor } from './hooks/useOfflineQueue'
import { loadActiveEmergency } from './store/emergency'

initOnlineListener()
startQueueMonitor()
loadActiveEmergency()

export function App() {
  return (
    <LocationProvider>
      <div class="min-h-screen bg-nodo-dark text-nodo-text">
        <Header />
        <InstallBanner />
        <OfflineBanner />
        <main class="max-w-lg lg:max-w-[1100px] mx-auto">
          <Router>
            <Route path="/" component={Home} />
            <Route path="/necesito-ayuda" component={NeedHelp} />
            <Route path="/quiero-ayudar" component={OfferHelp} />
            <Route path="/buscar-persona" component={SearchPerson} />
            <Route path="/reportar-persona" component={ReportFound} />
            <Route path="/reportar-incidente" component={ReportIncident} />
            <Route path="/mapa" component={MapView} />
            <Route path="/info" component={VerifiedInfo} />
            <Route path="/emergencias" component={Emergencies} />
            <Route path="/refugios" component={Shelters} />
            <Route path="/centros-acopio" component={CollectionCenters} />
            <Route path="/solicitud-salud" component={HealthRequest} />
            <Route path="/campanas" component={Campaigns} />
            <Route path="/campana/:id" component={CampaignDetail} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/refugios" component={AdminShelters} />
            <Route path="/colaborar" component={Collaborate} />
            <Route path="/situacion" component={SituationCenter} />
            <Route path="/design-system" component={DesignSystem} />
            <Route path="/acerca" component={About} />
            <Route path="/detalle/:type/:id" component={Detail} />
            <Route default component={Home} />
          </Router>
        </main>
        <BottomNav />
        <UpdateBanner />
      </div>
    </LocationProvider>
  )
}
