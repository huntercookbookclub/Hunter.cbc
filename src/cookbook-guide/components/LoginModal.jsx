import { useState } from 'react';
import Modal from './Modal';
import {
  requestPasswordReset,
  resendSignupCode,
  resetPasswordWithCode,
  signUp,
  verifySignupCode,
} from '../hooks/useAuth';

const titles = {
  login: 'Log in',
  signup: 'Create account',
  verify: 'Verify your email',
  request: 'Forgot password',
  reset: 'Reset password',
};

// One box, five steps:
//   login   → email + password
//   signup  → display name + email + password + confirm, sends a one-time code
//   verify  → code from the signup email (logs the user in when done)
//   request → email, sends a one-time password-reset code
//   reset   → code + new password + confirm (logs the user in when done)
export default function LoginModal({ open, onClose, onLogin }) {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const goTo = (next) => {
    setStep(next);
    setError('');
    setNotice('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    goTo('login');
    onClose();
  };

  // Runs an async auth call with the busy flag; returns true on success.
  const run = async (action) => {
    setError('');
    setBusy(true);
    const errMsg = await action();
    setBusy(false);
    if (errMsg) setError(errMsg);
    return !errMsg;
  };

  const passwordsMatch = () => {
    if (!password) {
      setError('Enter a password.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('The two passwords don’t match.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (await run(() => onLogin(email.trim(), password))) {
      setEmail('');
      handleClose();
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!passwordsMatch()) return;
    if (await run(() => signUp(email.trim(), password, birthDate, agreedToTerms, displayName))) {
      setBirthDate('');
      setDisplayName('');
      setAgreedToTerms(false);
      goTo('verify');
      setNotice(`We sent a one-time code to ${email.trim()}.`);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Enter the code from the email.');
      return;
    }
    if (await run(() => verifySignupCode(email.trim(), code.trim()))) {
      setEmail('');
      handleClose();
    }
  };

  const handleResend = async () => {
    if (await run(() => resendSignupCode(email.trim()))) {
      setNotice(`Sent a new code to ${email.trim()}.`);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if (await run(() => requestPasswordReset(email.trim()))) {
      goTo('reset');
      // Same message whether or not the email has an account, so the form
      // doesn't reveal who is registered.
      setNotice(`If ${email.trim()} has an account, we sent it a one-time code.`);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Enter the code from the email.');
      return;
    }
    if (!passwordsMatch()) return;
    if (await run(() => resetPasswordWithCode(email.trim(), code.trim(), password))) {
      setEmail('');
      handleClose();
    }
  };

  const emailInput = (placeholder = 'Email') => (
    <input
      type="email"
      className="e-input"
      placeholder={placeholder}
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="next"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  );

  const codeInput = (
    <input
      type="text"
      className="e-input"
      placeholder="One-time code"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="go"
      value={code}
      onChange={(e) => setCode(e.target.value)}
    />
  );

  // Shown as you type, not only after submitting.
  const mismatch = confirmPassword !== '' && password !== confirmPassword;

  const newPasswordInputs = (newLabel) => (
    <>
      <input
        type="password"
        className="e-input"
        placeholder={newLabel}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        className="e-input"
        placeholder={`Confirm ${newLabel.toLowerCase()}`}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        aria-invalid={mismatch}
        aria-describedby={mismatch ? 'password-mismatch' : undefined}
      />
      {mismatch && (
        <p className="e-field-error" id="password-mismatch" role="status">
          Passwords don’t match yet.
        </p>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title={titles[step]} width="clamp(260px, 22vw, 340px)">
      {step === 'login' && (
        <form className="e-form" onSubmit={handleLogin}>
          {emailInput()}
          <input
            type="password"
            className="e-input"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="e-btn-primary" disabled={busy}>
            Log in
          </button>
          <button type="button" className="e-link" onClick={() => goTo('request')}>
            Forgot password?
          </button>
          <button type="button" className="e-link" onClick={() => goTo('signup')}>
            New here? Create an account
          </button>
        </form>
      )}

      {step === 'signup' && (
        <form className="e-form" onSubmit={handleSignup}>
          <input
            type="text"
            className="e-input"
            placeholder="Display name (e.g. Maya C.)"
            autoComplete="nickname"
            maxLength={40}
            enterKeyHint="next"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          {emailInput()}
          {newPasswordInputs('Password')}
          {/* Neutral age screen: no hint about the cutoff age. */}
          <label className="e-field-label">
            Date of birth
            <input
              type="date"
              className="e-input"
              autoComplete="bday"
              max={new Date().toISOString().slice(0, 10)}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>
          <label className="e-check">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </span>
          </label>
          <button type="submit" className="e-btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
          <button type="button" className="e-link" onClick={() => goTo('login')}>
            Already have an account? Log in
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form className="e-form" onSubmit={handleVerify}>
          {notice && <p className="e-hint">{notice}</p>}
          {codeInput}
          <button type="submit" className="e-btn-primary" disabled={busy}>
            {busy ? 'Checking…' : 'Verify email'}
          </button>
          <button type="button" className="e-link" onClick={handleResend} disabled={busy}>
            Didn’t get a code? Send again
          </button>
        </form>
      )}

      {step === 'request' && (
        <form className="e-form" onSubmit={handleRequestCode}>
          <p className="e-hint">Enter your account email and we’ll send you a one-time code.</p>
          {emailInput()}
          <button type="submit" className="e-btn-primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
          <button type="button" className="e-link" onClick={() => goTo('login')}>
            ← Back to log in
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form className="e-form" onSubmit={handleReset}>
          {notice && <p className="e-hint">{notice}</p>}
          {codeInput}
          {newPasswordInputs('New password')}
          <button type="submit" className="e-btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Reset password'}
          </button>
          <button type="button" className="e-link" onClick={() => goTo('request')}>
            Didn’t get a code? Send again
          </button>
        </form>
      )}

      <div className="e-error">{error}</div>
    </Modal>
  );
}
