import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
const PhoneScene = lazy(() => import('./PhoneScene'));

const chapters = [
  {no:'01',eyebrow:'ПЕРВОЕ ВПЕЧАТЛЕНИЕ',title:<>НЕ ПРОСТО<br/><em>ТЕЛЕФОН.</em></>,description:'Предмет, который хочется рассмотреть со всех сторон. Знакомься с формой через движение.',tag:'THE OBJECT / 001'},
  {no:'02',eyebrow:'ДИЗАЙН И ФОРМА',title:<>ТОЧНОСТЬ<br/><em>В ЛИНИЯХ.</em></>,description:'Плавные грани. Выверенный силуэт. Ничего лишнего — только характер и детали.',tag:'DESIGN / 002'},
  {no:'03',eyebrow:'МАТЕРИАЛЫ',title:<>МЕТАЛЛ.<br/><em>СТЕКЛО. СВЕТ.</em></>,description:'Серебристые отражения, глубокие тени и игра света на каждой поверхности.',tag:'MATERIAL / 003'},
  {no:'04',eyebrow:'ДВИЖЕНИЕ',title:<>ДРУГОЙ<br/><em>РАКУРС.</em></>,description:'Прокручивай страницу. Объект меняет положение, раскрывая новые стороны.',tag:'MOTION / 004'},
  {no:'05',eyebrow:'ДЕТАЛИ',title:<>ВНИМАНИЕ<br/><em>К МЕЛОЧАМ.</em></>,description:'Каждый изгиб и каждый блик становятся частью одной визуальной истории.',tag:'DETAIL / 005'},
  {no:'06',eyebrow:'ФИНАЛ',title:<>ФОРМА<br/><em>В ДВИЖЕНИИ.</em></>,description:'Экспериментальная 3D-презентация. Создана, чтобы смотреть, листать и исследовать.',tag:'FINALE / 006'},
];

class ModelBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<PhoneFallback/>:this.props.children;}
}
function PhoneFallback(){return <div className="model-missing" role="status"><strong>3D-МОДЕЛЬ НЕ ЗАГРУЖЕНА</strong><span>Добавьте оригинальный файл phone.glb в папку public репозитория.</span></div>;}
function canRender3D(){try{const canvas=document.createElement('canvas');return !!(canvas.getContext('webgl2')||canvas.getContext('webgl'));}catch{return false;}}

export default function App(){
  const progressRef=useRef(0);
  const [progress,setProgress]=useState(0);
  const [active,setActive]=useState(0);
  const [webgl,setWebgl]=useState(false);
  const [reduced,setReduced]=useState(false);
  useLayoutEffect(()=>{
    if('scrollRestoration' in history)history.scrollRestoration='manual';
    window.scrollTo({top:0,left:0,behavior:'instant'});
  },[]);
  useEffect(()=>{
    setWebgl(canRender3D());
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let raf=0;
    const update=()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
        const p=Math.min(1,Math.max(0,window.scrollY/max));
        progressRef.current=p;
        setProgress(p);
        const current=Math.min(chapters.length-1,Math.floor((window.scrollY+window.innerHeight*.5)/Math.max(1,window.innerHeight)));
        setActive(current);
      });
    };
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);cancelAnimationFrame(raf);};
  },[]);
  useEffect(()=>{
    const sections=[...document.querySelectorAll<HTMLElement>('.chapter')];
    // The first chapter must be readable immediately; later chapters wait until
    // they are substantially in view, so the reveal is visible while scrolling.
    sections[0]?.classList.add('is-visible');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting)entry.target.classList.add('is-visible');
    }),{threshold:0.62,rootMargin:'0px 0px -6% 0px'});
    sections.forEach(s=>observer.observe(s));
    return()=>observer.disconnect();
  },[]);
  const goTo=(i:number)=>document.getElementById('chapter-'+i)?.scrollIntoView({behavior:reduced?'instant':'smooth'});
  return <div className="experience">
    <div className="grain" aria-hidden="true"/>
    <div className="scroll-track" aria-hidden="true"><div style={{transform:`scaleY(${progress})`}}/></div>
    <header className="topbar">
      <a href="#chapter-0" onClick={e=>{e.preventDefault();goTo(0);}} className="brand" aria-label="На начало">FORM<span> / </span>FACTOR<sup>®</sup></a>
      <span className="topbar-center">3D PRODUCT EXPERIENCE <span className="topbar-star">✳</span> CONCEPT 2026</span>
      <button className="menu-link" onClick={()=>goTo(5)}>ФИНАЛ <span>↗</span></button>
    </header>
    <div className="ambient-halo" aria-hidden="true"/>
    <div className="object-stage" aria-label="Интерактивная трёхмерная модель телефона">
      <div className="falling-trails" aria-hidden="true" style={{opacity:Math.min(.7,.14+progress*.55)}}><i/><i/><i/><i/><i/></div>
      {webgl?<ModelBoundary><Suspense fallback={<div className="loading-object">ЗАГРУЖАЕМ 3D...</div>}><PhoneScene progress={progressRef} reduced={reduced}/></Suspense></ModelBoundary>:<PhoneFallback/>}
    </div>
    <div className="stage-label" aria-hidden="true"><span className="stage-cross">✳</span> INTERACTIVE OBJECT <span className="stage-line"/> 360°</div>
    <main>
      {chapters.map((chapter,i)=><section className={'chapter chapter-'+i} id={'chapter-'+i} key={chapter.no} aria-label={'Раздел '+chapter.no}>
        <div className="chapter-inner">
          <div className="chapter-meta"><span className="meta-line"/><span>{chapter.no} / 06</span><span className="meta-divider">—</span><span>{chapter.eyebrow}</span></div>
          <h1 className="chapter-title">{chapter.title}</h1>
          <p className="chapter-description">{chapter.description}</p>
          <div className="chapter-footer"><span className="chapter-tag">{chapter.tag}</span>{i===0?<button className="scroll-prompt" onClick={()=>goTo(1)}>ЛИСТАЙ ВНИЗ <span>↓</span></button>:<span className="chapter-coordinate">{String((i+1)*16.7).padStart(4,'0')} / 100</span>}</div>
        </div>
        <span className="section-index" aria-hidden="true">{chapter.no}</span>
      </section>)}
    </main>
    <nav className="chapter-nav" aria-label="Навигация по разделам">
      {chapters.map((c,i)=><button key={c.no} className={active===i?'current':''} aria-label={'Перейти к разделу '+c.no} aria-current={active===i?'step':undefined} onClick={()=>goTo(i)}><span/></button>)}
    </nav>
    <footer className="site-footer"><span>FORM / FACTOR — НЕОФИЦИАЛЬНЫЙ ДИЗАЙН-КОНЦЕПТ</span><span>МОДЕЛЬ ДЛЯ ДЕМОНСТРАЦИИ · 2026</span><button onClick={()=>goTo(0)}>НАВЕРХ ↑</button></footer>
  </div>;
}
