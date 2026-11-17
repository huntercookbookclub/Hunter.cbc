import { useEffect, useState } from 'react';
import { usePlaces } from './hooks/usePlaces';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './hooks/useAuth';
import { useSaved } from './hooks/useSaved';
import MapView from './components/MapView';
import PlaceDetailPanel from './components/PlaceDetailPanel';
import TopBar from './components/TopBar';
import FilterPanel from './components/FilterPanel';
import EboardControls from './components/EboardControls';
import LoginModal from './components/LoginModal';
import AddPlaceModal from './components/AddPlaceModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import MyRecommendationsModal from './components/MyRecommendationsModal';
import SavedListModal from './components/SavedListModal';
import './fonts.css';
import './cookbook-guide.css';

export default function CookbookGuidePage() {
  const { places, loading, error, reload } = usePlaces();
  const filters = useFilters(places);
  const { currentUser, login, logout } = useAuth();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [myRecsOpen, setMyRecsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // Escape closes the place panel first, then the filter panel. (Pop-up boxes
  // handle their own Escape and stop it from reaching here.)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (selectedPlace) setSelectedPlace(null);
      else if (filterPanelOpen) setFilterPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPlace, filterPanelOpen]);
  const { isSaved, toggleSaved } = useSaved('place', currentUser);

  // Logged-out visitors are asked to log in instead.
  const handleToggleSave = async (place) => {
    if (!currentUser) {
      setLoginOpen(true);
      return;
    }
    const errMsg = await toggleSaved(place.id);
    if (errMsg) alert(`Couldn’t update saved places: ${errMsg}`);
  };

  return (
    <div className="cookbook-guide-app">
      <TopBar
        filters={filters}
        filterPanelOpen={filterPanelOpen}
        onToggleFilterPanel={() => setFilterPanelOpen((o) => !o)}
      />

      <div className="main">
        {loading && <div className="status-banner">Loading places…</div>}
        {error && <div className="status-banner status-error">Error: {error}</div>}

        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          filters={filters}
          places={places}
        />

        <MapView
          places={filters.filteredPlaces}
          onSelectPlace={setSelectedPlace}
          selectedId={selectedPlace?.id}
        />

        <PlaceDetailPanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          saved={!!selectedPlace && isSaved(selectedPlace.id)}
          onToggleSave={() => handleToggleSave(selectedPlace)}
        />
      </div>

      <EboardControls
        currentUser={currentUser}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenAccountSettings={() => setAccountSettingsOpen(true)}
        onOpenMyRecs={() => setMyRecsOpen(true)}
        onOpenSaved={() => setSavedOpen(true)}
        onLogout={logout}
        onOpenAddPlace={() => {
          setEditingPlace(null);
          setAddPlaceOpen(true);
        }}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />

      <AddPlaceModal
        open={addPlaceOpen}
        onClose={() => setAddPlaceOpen(false)}
        currentUser={currentUser}
        editingPlace={editingPlace}
        onSaved={reload}
      />

      <AccountSettingsModal
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        currentUser={currentUser}
      />

      <SavedListModal
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        title="Saved places"
        emptyText="No saved places yet. Tap Save on a place to keep it here."
        items={places
          .filter((p) => isSaved(p.id))
          .map((p) => ({ id: p.id, title: p.name, subtitle: [p.cuisine, p.address].filter(Boolean).join(' · ') }))}
        onOpenItem={(id) => setSelectedPlace(places.find((p) => p.id === id))}
        onRemove={(id) => handleToggleSave({ id })}
      />

      <MyRecommendationsModal
        open={myRecsOpen}
        onClose={() => setMyRecsOpen(false)}
        currentUser={currentUser}
        places={places}
        onEdit={(place) => {
          setEditingPlace(place);
          setAddPlaceOpen(true);
        }}
        onDeleted={reload}
      />
    </div>
  );
}
