import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import RecipeBook from './pages/RecipeBook'
import CookbookGuidePage from './cookbook-guide/CookbookGuidePage'
import BigBackLookback from './pages/BigBackLookback'
import { PrivacyPolicy, Terms } from './pages/Legal'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/recipe-book" element={<RecipeBook />} />
        <Route path="/cookbook-guide" element={<CookbookGuidePage />} />
        <Route path="/big-back-lookback" element={<BigBackLookback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
