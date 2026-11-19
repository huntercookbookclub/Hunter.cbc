import { Link } from 'react-router-dom'
import './Legal.css'
import SiteLogo from '../components/SiteLogo'

// Privacy Policy and Terms & Conditions. Starting drafts — have a lawyer (or the
// club's school office) review before launch. When the terms change,
// update EFFECTIVE_DATE and TERMS_VERSION in hooks/useAuth.js.
const CONTACT_EMAIL = 'cookbookhunter@gmail.com'
const EFFECTIVE_DATE = 'November 17, 2026'

// DMCA designated agent, exactly as registered with the U.S. Copyright Office
// (dmca.copyright.gov, registration DMCA-1086785). Keep this in sync whenever the
// registration is amended, and renew it before it expires (November 2029).
const DMCA_AGENT = {
  name: 'Copyright Agent',
  organization: 'CookBook Club',
  address: '85 Chrystie St, New York, NY 10002',
  phone: '(347) 559-0148',
  email: 'copyright@cookbookclub.nyc',
}

const LEGAL_PAGES = [
  { title: 'Privacy Policy', to: '/privacy' },
  { title: 'Terms & Conditions', to: '/terms' },
  { title: 'Copyright & DMCA', to: '/copyright' },
]

function LegalPage({ title, children }) {
  return (
    <div className="legal-page">
      <SiteLogo corner />
      <article className="legal-card">
        <h1>{title}</h1>
        <p className="legal-date">Effective {EFFECTIVE_DATE}</p>
        {children}
        <p className="legal-footer">
          Questions? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also:{' '}
          {LEGAL_PAGES.filter((page) => page.title !== title).map((page, i) => (
            <span key={page.to}>
              {i > 0 && ' · '}
              <Link to={page.to}>{page.title}</Link>
            </span>
          ))}
        </p>
      </article>
    </div>
  )
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This site is run by the CookBook Club (“we”, “us”). This policy explains what we collect,
        why, and your choices.
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
          picture, and the places and recipes you save or like.
        </li>
        <li>
          <strong>Likes and saves:</strong> each place and recipe shows its total number of likes to everyone.
          Who liked or saved something is private by default. If you turn on{' '}
          <strong>Show my name and photo on places and recipes I like or save</strong> (in Account Settings or
          on any place or recipe), your display name and profile picture can appear on places and
          recipes you’ve liked or saved, along with which one you did. Turn it off and they
          disappear. Your email is never shown.
        </li>
        <li>
          <strong>Your age:</strong> when you sign up we ask for your date of birth to confirm you
          are 13 or older. Your birthdate is checked in your browser and is <em>never</em> sent to
          us or stored. We only keep a yes/no record that you are 13 or older.
        </li>
        <li>
          <strong>What you post:</strong> places, recipes and Big Back Lookback photos you add (and their
          details) are public, shown with your display name. Places also show your profile picture
          (and role, for e-board members).
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
          <strong>Google:</strong> place search, used when someone adds a place to the map.
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
        any time in Account Settings. You can delete your account yourself at any time: log in, open{' '}
        <strong>⚙️ → Account Settings → Delete account</strong>, and confirm with your password. This removes your account, saved places, saved
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
        These terms cover your use of this site, run by the CookBook Club (“we”, “us”). By creating
        an account or using the site, you agree to these terms.
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
        Any member with an account can post places on the map, recipes and Big Back Lookback
        photos, and add a display name and profile picture.
        You keep ownership of what you post, and you let us show it on this site. Only post
        recipes, photos and pictures you have the right to share, and keep everything respectful.
        We may remove anything that breaks these rules. You may view and share links to content
        here for personal, non-commercial use. If you believe something on the site infringes
        your copyright, see our <Link to="/copyright">Copyright &amp; DMCA</Link> page. We
        remove the accounts of people who repeatedly post content that infringes copyright.
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
        You can delete your account at any time in Account Settings (Delete account), or by asking
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

export function Copyright() {
  const agent = DMCA_AGENT
  return (
    <LegalPage title="Copyright & DMCA">
      <p>
        Members can post recipes, photos and profile pictures on this site. We respect copyright
        and respond to notices of claimed infringement under the Digital Millennium Copyright Act
        (DMCA).
      </p>

      <h2>Reporting content that infringes your copyright</h2>
      <p>Send a written notice to our designated agent (below) that includes:</p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>The copyrighted work you believe was infringed.</li>
        <li>
          Where the material is on this site, with enough detail for us to find it (for example
          the page link and the recipe, photo or profile it appears on).
        </li>
        <li>Your name, mailing address, phone number and email.</li>
        <li>
          A statement that you believe in good faith the use isn’t authorized by the copyright
          owner, its agent or the law.
        </li>
        <li>
          A statement that the information in your notice is accurate and, under penalty of
          perjury, that you are the copyright owner or authorized to act for them.
        </li>
      </ol>
      <p>When we receive a valid notice, we remove or disable the material promptly.</p>

      <h2>Designated agent</h2>
      <address className="legal-address">
        {agent.name}
        <br />
        {agent.organization}
        <br />
        {agent.address}
        <br />
        Phone: {agent.phone}
        <br />
        Email: <a href={`mailto:${agent.email}`}>{agent.email}</a>
      </address>

      <h2>If your content was removed</h2>
      <p>
        If you believe something you posted was removed by mistake or misidentification, you can
        send a counter-notice to the same agent with: your signature; the material that was
        removed and where it appeared; a statement under penalty of perjury that you believe in
        good faith it was removed by mistake or misidentification; your name, address and phone
        number; and a statement that you consent to the jurisdiction of the federal court for your
        address and will accept service from the person who sent the original notice. We may then
        restore the material unless the copyright owner tells us they’ve filed a court action.
      </p>

      <h2>Repeat infringers</h2>
      <p>
        We remove the accounts of members who repeatedly post content that infringes copyright.
      </p>
    </LegalPage>
  )
}
