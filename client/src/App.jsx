import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BadgeIndianRupee, Calculator, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Download, Home, Landmark, Menu, Percent, PiggyBank, RotateCcw, WalletCards } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const COLORS = ['#6558e8', '#e4e1fa'];

function getSchedule(principal, annualRate, months, emi) {
  let balance = principal;
  const monthlyRate = annualRate / 1200;
  return Array.from({ length: months }, (_, index) => {
    const interest = balance * monthlyRate;
    const payment = Math.min(emi, balance + interest);
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    return { month: index + 1, payment, principal: principalPaid, interest, balance };
  });
}

function Field({ label, value, onChange, suffix, min, max, step = 1, prefix, hint }) {
  return <div className="field-block">
    <div className="field-head"><label>{label}</label>{hint && <span className="field-hint">{hint}</span>}</div>
    <div className="number-input">{prefix && <span className="input-affix prefix">{prefix}</span>}<input type="number" min={min} max={max} step={step} value={value} onChange={onChange} /><span className="input-affix">{suffix}</span></div>
    <input aria-label={`${label} slider`} className="range" type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
    <div className="range-ends"><span>{prefix}{number.format(min)}{suffix}</span><span>{prefix}{number.format(max)}{suffix}</span></div>
  </div>;
}

function LoanPlanner({ user, onLogout }) {
  const [loanType, setLoanType] = useState('home');
  const [amount, setAmount] = useState(4800000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState(false);
  const months = years * 12;
  const calc = useMemo(() => {
    const r = rate / 1200;
    const emi = r === 0 ? amount / months : amount * r * (1 + r) ** months / ((1 + r) ** months - 1);
    return { emi, total: emi * months, interest: emi * months - amount };
  }, [amount, rate, months]);
  const schedule = useMemo(() => getSchedule(amount, rate, months, calc.emi), [amount, rate, months, calc.emi]);
  const visibleRows = schedule.slice(page * 12, page * 12 + 12);
  const totalPages = Math.ceil(schedule.length / 12);
  const chartData = [{ name: 'Principal amount', value: amount }, { name: 'Total interest', value: calc.interest }];
  const saveCalculation = async () => {
    setSaved(false);
    try {
      const response = await fetch('/api/calculations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanType, principal: amount, annualRate: rate, tenureMonths: months }) });
      if (!response.ok) throw new Error('The save service is unavailable. Start the API and connect MongoDB to save this calculation.');
      setSaved(true); setToast('Calculation saved to your history.');
    } catch (error) { setToast(error.message); }
    window.setTimeout(() => setToast(''), 4500);
  };
  const downloadSchedule = () => {
    const header = 'Month,EMI,Principal,Interest,Balance';
    const rows = schedule.map((row) => [row.month, row.payment, row.principal, row.interest, row.balance].map((v) => Math.round(v * 100) / 100).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${loanType}-loan-amortization.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  const reset = () => { setLoanType('home'); setAmount(4800000); setRate(8.5); setYears(20); setPage(0); };

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-mark"><Landmark size={21} strokeWidth={2.2}/></span><span>clearpath<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav className="side-nav">
        <a className="nav-item" href="#top"><span className="nav-icon"><Calculator size={18}/></span>Overview</a>
        <a className="nav-item active" href="#calculator"><span className="nav-icon"><BadgeIndianRupee size={18}/></span>Loan planner</a>
        <a className="nav-item" href="#schedule"><span className="nav-icon"><CalendarDays size={18}/></span>Amortization</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><strong>Need a hand?</strong><p>Learn how your EMI is worked out.</p><a href="#how-it-works">Explore the guide <span>↗</span></a></div>
        <div className="profile"><div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.email}</span></div><button className="logout-button" onClick={onLogout}>Log out</button></div>
      </div>
    </aside>

    <main className="main-area" id="top">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Loan planner</strong></div><div className="topbar-right"><span className="updated-dot"></span><span>All changes saved</span><div className="top-avatar">A</div></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"></span>PLAN WITH CLARITY</div><h1>Make your next move<br className="desktop-break"/> with confidence.</h1><p className="welcome-sub">A clearer picture of your loan, from the first payment to the last.</p></div><div className="welcome-note"><div className="note-icon"><PiggyBank size={18}/></div><span>A little planning today<br/><strong>goes a long way.</strong></span></div></section>

        <section className="calculator-grid" id="calculator">
          <div className="panel input-panel">
            <div className="panel-heading"><div><div className="section-kicker">LET'S GET STARTED</div><h2>Your loan details</h2></div><button className="reset-button" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
            <div className="loan-toggle" role="tablist" aria-label="Loan type"><button role="tab" aria-selected={loanType === 'home'} className={loanType === 'home' ? 'selected' : ''} onClick={() => setLoanType('home')}><Home size={16}/> Home loan</button><button role="tab" aria-selected={loanType === 'personal'} className={loanType === 'personal' ? 'selected' : ''} onClick={() => setLoanType('personal')}><WalletCards size={16}/> Personal loan</button></div>
            <Field label="Loan amount" value={amount} onChange={(e) => setAmount(Math.max(100000, Number(e.target.value)))} min={100000} max={10000000} step={50000} prefix="₹" suffix="" hint="INR" />
            <Field label="Interest rate" value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value)))} min={0} max={20} step={0.1} suffix="%" hint="per year" />
            <Field label="Loan tenure" value={years} onChange={(e) => { setYears(Math.max(1, Number(e.target.value))); setPage(0); }} min={1} max={30} suffix="yrs" />
            <div className="assumption-note"><span className="assumption-dot"></span>Fixed interest rate for the full loan term</div>
          </div>

          <div className="panel result-panel">
            <div className="result-topline"><span className="result-label">YOUR MONTHLY EMI</span><span className="result-live"><span></span> LIVE ESTIMATE</span></div>
            <div className="emi-value">{currency.format(calc.emi)}<span>/mo</span></div>
            <p className="emi-caption">Your estimated monthly payment</p>
            <div className="result-divider"></div>
            <div className="metrics-row"><div className="metric"><span className="metric-label">Principal amount</span><strong>{currency.format(amount)}</strong><span className="metric-meta">The amount you borrow</span></div><div className="metric"><span className="metric-label">Total interest</span><strong>{currency.format(calc.interest)}</strong><span className="metric-meta">{((calc.interest / calc.total) * 100).toFixed(1)}% of total payment</span></div></div>
            <div className="total-payment"><span>Total payment over {years} years</span><strong>{currency.format(calc.total)}</strong></div>
            <button className="save-button" onClick={saveCalculation}><span>Save this calculation</span><ArrowUpRight size={16}/></button>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel breakdown-panel"><div className="panel-heading"><div><div className="section-kicker">THE BIG PICTURE</div><h2>Payment breakdown</h2></div><button className="more-button" aria-label="More chart details">···</button></div>
            <div className="chart-layout"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" innerRadius="70%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>{chartData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]}/>)}</Pie><Tooltip formatter={(value) => currency.format(value)} contentStyle={{ border: '1px solid #edeaf5', borderRadius: 10, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><span>Loan amount</span><strong>{currency.format(calc.total)}</strong><small>Total repayment</small></div></div>
              <div className="chart-legend"><div className="legend-item"><span className="legend-swatch principal-swatch"></span><div><span>Principal</span><strong>{currency.format(amount)}</strong></div><b>{(amount / calc.total * 100).toFixed(0)}%</b></div><div className="legend-item"><span className="legend-swatch interest-swatch"></span><div><span>Interest</span><strong>{currency.format(calc.interest)}</strong></div><b>{(calc.interest / calc.total * 100).toFixed(0)}%</b></div><div className="legend-foot">A longer tenure means a smaller EMI, but more interest paid over time.</div></div></div>
          </div>
          <div className="panel insight-panel"><div className="insight-art"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-sun"></div><div className="art-hill hill-back"></div><div className="art-hill hill-front"></div><div className="art-house"><div className="house-roof"></div><div className="house-body"><i></i><b></b></div></div><div className="art-spark spark-a">✦</div><div className="art-spark spark-b">✧</div></div><div className="insight-copy"><span className="insight-tag">A THOUGHT TO TAKE WITH YOU</span><h3>Small steps.<br/>Big milestones.</h3><p>Knowing your numbers is the first step toward a place to call your own.</p></div></div>
        </section>

        <section className="panel schedule-panel" id="schedule"><div className="panel-heading schedule-heading"><div><div className="section-kicker">EVERY STEP, MAPPED OUT</div><h2>Amortization schedule</h2><p className="panel-subtitle">See how each payment brings your balance down.</p></div><button className="download-button" onClick={downloadSchedule}><Download size={15}/> Download CSV</button></div>
          <div className="table-scroll"><table><thead><tr><th>MONTH</th><th>EMI PAYMENT</th><th>PRINCIPAL</th><th>INTEREST</th><th>REMAINING BALANCE</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.month}><td><span className="month-cell">{String(row.month).padStart(2, '0')}</span><span className="month-date">Month {row.month}</span></td><td>{currency.format(row.payment)}</td><td className="principal-cell">{currency.format(row.principal)}</td><td className="interest-cell">{currency.format(row.interest)}</td><td><div className="balance-cell"><span>{currency.format(row.balance)}</span><div className="balance-track"><i style={{ width: `${row.balance / amount * 100}%` }}></i></div></div></td></tr>)}</tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{page * 12 + 1}–{Math.min((page + 1) * 12, months)}</strong> of <strong>{number.format(months)}</strong> monthly payments</span><div className="pagination"><button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={15}/></button><span>{page + 1} / {totalPages}</span><button aria-label="Next page" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight size={15}/></button></div></div>
        </section>
        <section className="panel guide-panel" id="how-it-works">
          <div className="guide-heading"><div><div className="section-kicker">A QUICK, CLEAR GUIDE</div><h2>How your EMI is worked out</h2><p className="panel-subtitle">EMI means Equated Monthly Instalment: the same scheduled payment each month, split between interest and principal.</p></div><div className="guide-badge"><CircleHelp size={17}/></div></div>
          <div className="formula-box"><span>THE EMI FORMULA</span><strong>EMI = P × r × (1 + r)<sup>n</sup> ÷ ((1 + r)<sup>n</sup> − 1)</strong><small>When the interest rate is 0%, EMI = P ÷ n.</small></div>
          <div className="guide-definitions"><div><b>P</b><span>Principal: the amount borrowed, currently <strong>{currency.format(amount)}</strong>.</span></div><div><b>r</b><span>Monthly interest rate: annual rate ÷ 12 ÷ 100, currently <strong>{(rate / 12).toFixed(4)}%</strong>.</span></div><div><b>n</b><span>Number of monthly payments: tenure in years × 12, currently <strong>{number.format(months)} months</strong>.</span></div></div>
          <div className="guide-bottom"><div><h3>What happens each month?</h3><ol><li>Interest is calculated on the remaining loan balance.</li><li>Your EMI pays that month’s interest first; the rest reduces the principal.</li><li>As the balance shrinks, less of each payment goes to interest and more goes to principal.</li></ol></div><div className="worked-example"><span>YOUR FIRST PAYMENT, ESTIMATED</span><div><span>Monthly EMI</span><strong>{currency.format(calc.emi)}</strong></div><div><span>First month interest</span><strong>{currency.format(amount * rate / 1200)}</strong></div><div><span>First month principal</span><strong>{currency.format(calc.emi - amount * rate / 1200)}</strong></div></div></div>
          <p className="guide-footnote"><Clock3 size={14}/> This estimate assumes a fixed rate and monthly compounding. Lender fees, rate changes, and payment dates can change the final schedule.</p>
        </section>
        <footer><a className="footer-brand" href="#top">clearpath<span>.</span></a><span>Clarity for the decisions that move you forward.</span><span>© 2025 Clearpath</span></footer>
      </div>
    </main>
    {toast && <div className={`toast ${saved ? 'success' : ''}`}>{saved && <span>✓</span>}{toast}</div>}
  </div>;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not sign in.');
      onAuthenticated(data.user);
    } catch (requestError) { setError(requestError.message || 'Could not reach the server.'); }
    finally { setBusy(false); }
  };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <a className="brand auth-brand" href="#"><span className="brand-mark"><Landmark size={21}/></span><span>clearpath<span className="brand-dot">.</span></span></a>
    <div className="eyebrow"><span className="eyebrow-line"></span>YOUR FINANCIAL PLAN, IN ONE PLACE</div>
    <h1>{mode === 'login' ? 'Welcome back.' : 'Start with clarity.'}</h1>
    <p className="auth-description">{mode === 'login' ? 'Sign in to access your loan planner and saved calculations.' : 'Create an account to save and revisit your loan calculations.'}</p>
    {mode === 'register' && <label className="auth-label">Full name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} /></label>}
    <label className="auth-label">Email address<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
    <label className="auth-label">Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'register' ? 12 : 1} maxLength={72} />{mode === 'register' && <small>Use 12 or more characters.</small>}</label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="save-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowUpRight size={16}/></button>
    <p className="auth-switch">{mode === 'login' ? 'New to Clearpath?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    <p className="auth-security">Protected with secure, HttpOnly sessions.</p>
  </form></main>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.ok ? response.json() : null).then((data) => setUser(data?.user || null)).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); };
  if (checking) return <div className="auth-loading">Loading your secure session…</div>;
  return user ? <LoanPlanner user={user} onLogout={logout}/> : <AuthScreen onAuthenticated={setUser}/>;
}

export default App;
