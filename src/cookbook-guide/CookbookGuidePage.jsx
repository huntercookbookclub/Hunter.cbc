import { useEffect, useMemo, useState } from 'react';
import { usePlaces } from './hooks/usePlaces';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './hooks/useAuth';
import { useSaved } from './hooks/useSaved';
import { useLikes } from './hooks/useLikes';
import { groupPlaces } from './lib/groupPlaces';
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
  // selectedPlace is a place group: shared details + `reviews` (oldest first).
  const [selectedPlace, setSelectedPlace] = useState(null);

  // One entry (and one pin) per place, even if several people recommended it.
  const groups = useMemo(() => groupPlaces(places), [places]);
  // A place shows if any of its recommendations passes the filters.
  const visibleGroups = useMemo(() => {
    const ids = new Set(filters.filteredPlaces.map((p) => p.id));
    return groups.filter((g) => g.reviews.some((r) => ids.has(r.id)));
  }, [groups, filters.filteredPlaces]);
  // Type chips count places (pins), not recommendations.
  const placeCounts = useMemo(() => {
    const counts = { __total: groups.length };
    groups.forEach((g) => (counts[g.category] = (counts[g.category] || 0) + 1));
    return counts;
  }, [groups]);
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
  const { isLiked, likeCount, toggleLike } = useLikes(currentUser);

  // Saves and likes are stored against a recommendation's id. A place with
  // several recommendations has several ids: new saves/likes use the first one,
  // and one made earlier on any of them still counts for the place.
  const savedId = (group) => group.reviews.find((r) => isSaved(r.id))?.id;
  const likedId = (group) => group.reviews.find((r) => isLiked(r.id))?.id;
  const totalLikes = (group) => group.reviews.reduce((n, r) => n + likeCount(r.id), 0);
  const groupOf = (id) => groups.find((g) => g.reviews.some((r) => r.id === id));

  // Logged-out visitors are asked to log in instead.
  const handleToggleLike = async (group) => {
    if (!currentUser) {
      setLoginOpen(true);
      return;
    }
    const errMsg = await toggleLike(likedId(group) ?? group.id);
    if (errMsg) alert(`Couldn’t update your like: ${errMsg}`);
  };

  const handleToggleSave = async (group) => {
    if (!currentUser) {
      setLoginOpen(true);
      return;
    }
    const errMsg = await toggleSaved(savedId(group) ?? group.id);
    if (errMsg) alert(`Couldn’t update saved places: ${errMsg}`);
  };

  return (
    <div className="cookbook-guide-app">
      <TopBar
        filters={{ ...filters, typeCounts: placeCounts }}
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
          places={visibleGroups}
          onSelectPlace={setSelectedPlace}
          selectedId={selectedPlace?.id}
        />

        <PlaceDetailPanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          saved={!!selectedPlace && !!savedId(selectedPlace)}
          onToggleSave={() => handleToggleSave(selectedPlace)}
          liked={!!selectedPlace && !!likedId(selectedPlace)}
          likes={selectedPlace ? totalLikes(selectedPlace) : 0}
          onToggleLike={() => handleToggleLike(selectedPlace)}
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
        items={groups
          .filter((g) => savedId(g))
          .map((g) => ({ id: g.id, title: g.name, subtitle: [g.cuisine, g.address].filter(Boolean).join(' · ') }))}
        onOpenItem={(id) => setSelectedPlace(groupOf(id))}
        onRemove={(id) => handleToggleSave(groupOf(id))}
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
