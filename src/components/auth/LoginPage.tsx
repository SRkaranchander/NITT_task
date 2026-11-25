import React, { useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Factory,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';

interface LoginPageProps {
  profiles: UserProfile[];
  onLogin: (profile: UserProfile) => void;
}

const roleOptions: { role: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  { role: 'OWNER', label: 'Owner', description: 'Overview & decisions', icon: LayoutDashboard },
  { role: 'ADMIN', label: 'Admin', description: 'Orders & billing', icon: ClipboardList },
  { role: 'PRODUCTION', label: 'Production', description: 'Batches & inventory', icon: Factory },
  { role: 'SALESMAN', label: 'Sales', description: 'Retailer orders', icon: ShoppingBag },
  { role: 'AUDITOR', label: 'Auditor', description: 'Reports & ledgers', icon: ShieldCheck },
];

const demoPassword = 'noir2026';

export const LoginPage: React.FC<LoginPageProps> = ({ profiles, onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [email, setEmail] = useState(profiles.find((profile) => profile.role === 'OWNER')?.email ?? '');
  const [password, setPassword] = useState(demoPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(profiles.find((profile) => profile.role === role)?.email ?? '');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profile = profiles.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.role === selectedRole && candidate.isActive
    );

    if (!profile || password !== demoPassword) {
      setError('Those demo credentials do not match this role. Check the email and try again.');
      return;
    }

    setError('');
    onLogin(profile);
  };

  return (
    <main className="login-portal">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-orb login-orb-three" />
      <div className="login-grid-texture" />

      <div className="login-layout">
        <section className="login-story">
          <a className="login-brand" href="#home" aria-label="NOIR home">
            <span className="login-brand-mark">N<span>.</span></span>
            <span><strong>NOIR</strong><small>FACTORY INTELLIGENCE</small></span>
          </a>

          <div className="login-story-copy">
            <div className="login-eyebrow"><Sparkles size={15} /> ORDER TO AUDIT, IN ONE FLOW</div>
            <h1>Make every move<br />count.</h1>
            <p>One bright workspace for orders, production, stock and accounts. Sign in with your role to pick up exactly where your team works.</p>
          </div>

          <div className="login-feature-row">
            <div className="login-feature-icon"><Boxes size={19} /></div>
            <div><strong>Live factory picture</strong><span>Stock, yield and order status stay connected.</span></div>
            <CheckCircle2 className="login-feature-check" size={18} />
          </div>
          <div className="login-story-foot"><span className="login-live-dot" /> DEMO WORKSPACE <span>•</span> TIRUCHIRAPPALLI, TN</div>
        </section>

        <section className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-heading">
              <div className="login-heading-icon"><LockKeyhole size={18} /></div>
              <div className="login-demo-tag">DEMO ACCESS</div>
            </div>
            <h2>Welcome back</h2>
            <p className="login-card-subtitle">Choose your workspace role to continue.</p>

            <form onSubmit={handleSubmit}>
              <div className="login-field-label">YOUR ROLE</div>
              <div className="login-role-grid">
                {roleOptions.map(({ role, label, description, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    className={`login-role-option ${selectedRole === role ? 'is-selected' : ''} ${role === 'AUDITOR' ? 'role-wide' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                    aria-pressed={selectedRole === role}
                  >
                    <Icon size={17} />
                    <span><strong>{label}</strong><small>{description}</small></span>
                    {selectedRole === role && <span className="role-selected-dot" />}
                  </button>
                ))}
              </div>

              <label className="login-field-label" htmlFor="login-email">WORK EMAIL</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input id="login-email" autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@factory.com" required />
              </div>

              <label className="login-field-label password-label" htmlFor="login-password">PASSWORD</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input id="login-password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="login-helper"><span>Demo password</span><code>{demoPassword}</code></div>
              {error && <div className="login-error" role="alert">{error}</div>}
              <button className="login-submit" type="submit">Enter workspace <ArrowRight size={17} /></button>
            </form>

            <div className="login-security-note"><ShieldCheck size={15} /> Role-based demo access <span>·</span> Sample data only</div>
          </div>
          <div className="login-card-caption"><Factory size={14} /> Crafted for the rhythm of a real factory</div>
        </section>
      </div>
      <div className="login-footer"><span>NOIR FACTORY OS</span><span>Every material. Every movement. Accounted for.</span><span>v1.0 · NIT TIRUCHIRAPPALLI</span></div>
    </main>
  );
};
