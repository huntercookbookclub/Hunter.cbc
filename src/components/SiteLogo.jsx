import { Link } from 'react-router-dom'
import logo from '../assets/club-logo.png'

// CookBook Club logo, top-left on every page except the landing page; it links home.
// `corner` pins it to the page's top-left (the map places it in its own header).
export default function SiteLogo({ corner = false }) {
  return (
    <Link to="/" className={`site-logo${corner ? ' corner' : ''}`} aria-label="CookBook Club home">
      <img src={logo} alt="CookBook Club" />
    </Link>
  )
}
