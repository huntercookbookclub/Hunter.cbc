import { Link } from 'react-router-dom'
import './Legal.css'

// Privacy Policy and Terms & Conditions. Starting drafts — have Hunter's Office
// of Student Activities or a lawyer review before launch. When the terms change,
// update EFFECTIVE_DATE and TERMS_VERSION in hooks/useAuth.js.
const CONTACT_EMAIL = 'cookbookhunter@gmail.com'
const EFFECTIVE_DATE = 'November 17, 2026'

function LegalPage({ title, children }) {
  return (
    <div className="legal-page">
      <article className="legal-card">
        <Link to="/" className="legal-back">
          ← Back to CookBook Club
        </Link>
        <h1>{title}</h1>
        <p className="legal-date">Effective {EFFECTIVE_DATE}</p>
        {children}
        <p className="legal-footer">
          Questions? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
          {title === 'Privacy Policy' ? <Link to="/terms">Terms &amp; Conditions</Link> : <Link to="/privacy">Privacy Policy</Link>}.
        </p>
      </article>
    </div>
  )
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This site is run by the CookBook Club, a group of Hunter College students (“we”, “us”).
        It is not an official website of Hunter College or CUNY. This policy explains what we
        collect, why, and your choices.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>If you browse without an account:</strong> nothing that identifies you. We
          don’t use analytics, advertising or tracking cookies.
        </li>
        <li>
          <strong>If you create an account:</strong> your email address, your password (stored
          encrypted by our login provider, so we can’t see it), a display name, an optional profile
          picture, the places and recipes you save, and the places you like.
        </li>
        <li>
          <strong>Likes and saves:</strong> each place shows its total number of likes to everyone.
          Who liked or saved a place is private by default. If you turn on{' '}
          <strong>Show my name and photo on places I like or save</strong> (in Account Settings or
          on any place card), your display name and profile picture can appear on places you’ve
          liked or saved, along with which one you did. Turn it off and they disappear. Saved recipes
          are always private. Your email is never shown.
        </li>
        <li>
          <strong>Your age:</strong> when you sign up we ask for your date of birth to confirm you
          are 13 or older. Your birthdate is checked in your browser and is <em>never</em> sent to
          us or stored. We only keep a yes/no record that you are 13 or older.
        </li>
        <li>
          <strong>E-board members</strong> who post content may also add a display name, role,
          profile picture, and the places, recipes and photos they post.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Only to run the site: to log you in, send you verification and password-reset codes, and
        show you your saved places, recipes and likes. We don’t sell your information, share it for
        advertising, or send marketing emails.
      </p>

      <h2>Services that handle data for us</h2>
      <p>
        Like most websites, loading this site sends your IP address and browser details to the
        services that power it:
      </p>
      <ul>
        <li>
          <strong>Supabase:</strong> accounts, login, the database and photo storage.
        </li>
        <li>
          <strong>Vercel:</strong> hosts the website.
        </li>
        <li>
          <strong>CARTO and OpenStreetMap:</strong> the map images on the CookBook Guide.
        </li>
        <li>
          <strong>Google:</strong> place search, used only by e-board members when adding a
          place.
        </li>
        <li>
          <strong>Image hosts</strong> such as Unsplash, which serve some recipe photos.
        </li>
      </ul>

      <h2>Stored on your device</h2>
      <p>
        If you log in, your browser stores a login session so you stay signed in. If the age check
        doesn’t allow an account, your browser remembers that so the form isn’t resubmitted. We
        don’t use tracking cookies.
      </p>

      <h2>Children</h2>
      <p>
        Accounts are only for people 13 and older. We don’t knowingly collect personal information
        from children under 13. If you believe a child under 13 has given us information, email us
        and we’ll delete it.
      </p>

      <h2>Your choices</h2>
      <p>
        You choose whether your name and photo show on places you like or save, and can change it
        any time in Account Settings. You can delete your account yourself at any time: log in, tap the ⚙️ button, then
        choose <strong>Delete account</strong>. This removes your account, saved places, saved
        recipes and likes right away, and can’t be undone. You can also ask us to see, correct or
        delete your data by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from
        your account’s email address. We keep account data until you delete your account or ask us
        to.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we’ll update the date at the top. Big changes will be shown on
        the site.
      </p>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms &amp; Conditions">
      <p>
        These terms cover your use of this site, run by the CookBook Club, a group of Hunter
        College students (“we”, “us”). It is not an official website of Hunter College or CUNY. By
        creating an account or using the site, you agree to these terms.
      </p>

      <h2>Who can have an account</h2>
      <p>
        You must be 13 or older to create an account. Give accurate information, keep your
        password private, and tell us if you think someone else has used your account.
      </p>

      <h2>Using the site</h2>
      <p>Please don’t:</p>
      <ul>
        <li>break the law, or harass, threaten or impersonate anyone;</li>
        <li>try to access accounts, data or parts of the site that aren’t yours;</li>
        <li>overload, scrape or interfere with the site or the services it runs on.</li>
      </ul>

      <h2>Content</h2>
      <p>
        Places, recipes, photos and other content on the site are posted by CookBook Club e-board
        members, who keep ownership of what they post. Everyone can add a display name and profile
        picture: only use a picture you have the right to use, and keep names and pictures
        respectful. We may remove a name or picture that breaks these rules. You may view and share links to it for
        personal, non-commercial use. If you believe something on the site infringes your
        copyright, email us and we’ll review it.
      </p>

      <h2>Recipes and restaurant info</h2>
      <p>
        Recipes are shared by club members for fun and haven’t been tested or checked for
        allergens or nutrition. Check ingredients for allergies and dietary needs, and cook
        safely. Restaurant details, prices and hours can change, so confirm with the place before
        you go.
      </p>

      <h2>No guarantees</h2>
      <p>
        The site is provided “as is”, without warranties of any kind. We may change, pause or
        remove any part of it at any time. To the extent the law allows, we aren’t responsible for
        any loss or harm from using the site or relying on its content.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time from the ⚙️ menu (Delete account), or by asking
        us. We may suspend or remove accounts that break these terms.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. We’ll change the date at the top, and if the changes are
        important we’ll ask you to agree again.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of the State of New York.</p>
    </LegalPage>
  )
}
