import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
const Scene = lazy(() => import('./Scene'));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="fallback-orb" aria-hidden="true" /> : this.props.children; }
}

function supportsWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setCanRender(supportsWebGL());
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <main className={entered ? 'experience entered' : 'experience'}>
    <div className="grain" aria-hidden="true" />
    <header className="topbar"><a className="wordmark" href="/" onClick={(e) => { e.preventDefault(); setEntered(false); }}>O<span>∕</span>S</a><span className="topnote">INDEPENDENT DIGITAL EXPERIMENT · 001</span><span className="status"><i /> LIVE EXPERIENCE</span></header>
    <div className="visual" aria-hidden="true">{canRender && !reduceMotion ? <SceneBoundary><Suspense fallback={<div className="fallback-orb" />}><Scene entered={entered} /></Suspense></SceneBoundary> : <div className="fallback-orb" />}</div>
    <div className="halo" aria-hidden="true" />
    <section className="hero" aria-live="polite">
      <p className="eyebrow">{entered ? 'CHAPTER 01 — THE DESCENT' : 'AN EXPERIMENT IN PERCEPTION'}</p>
      <h1>{entered ? <>YOU ARE<br/><em>ELSEWHERE.</em></> : <>BEYOND<br/><em>THE SCREEN.</em></>}</h1>
      <p className="description">{entered ? 'There is no map for what comes next. Only the unknown, and your curiosity.' : 'Reality is just the beginning. Step into a space beyond the ordinary.'}</p>
      <button className="enter" onClick={() => setEntered(v => !v)}><span className="arrow">{entered ? '↖' : '↗'}</span><span>{entered ? 'RETURN TO ORIGIN' : 'ENTER EXPERIENCE'}</span></button>
    </section>
    <footer className="footer"><span>OTHERSPACE © 2026</span><span>SCROLL LESS. FEEL MORE.</span><span>01 / 02</span></footer>
  </main>;
}
