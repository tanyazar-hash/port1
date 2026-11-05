import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
const PhoneScene = lazy(() => import('./PhoneScene'));

const shotLabels = [
  { title:'ОБЪЕКТ / 01', detail:'ПЕРВЫЙ ВЗГЛЯД' },
  { title:'ПРОФИЛЬ / 02', detail:'ТОНКАЯ ГРАНЬ' },
  { title:'МАТЕРИАЛ / 03', detail:'ОТРАЖЕНИЕ СВЕТА' },
  { title:'ПОВОРОТ / 04', detail:'НОВЫЙ УГОЛ' },
  { title:'КАМЕРА / 05', detail:'В ФОКУСЕ ДЕТАЛИ' },
  { title:'ФИНАЛ / 06', detail:'ПОЛНЫЙ ОБЗОР' },
];

const chapters = [
  {no:'01',eyebrow:'ПЕРВОЕ ВПЕЧАТЛЕНИЕ',title:<>ФОРМА, КОТОРАЯ<br/><em>ВПЕЧАТЛЯЕТ.</em></>,description:'Один объект. Шесть ракурсов. Внимание к каждой детали.',tag:'THE OBJECT / 001'},
  {no:'02',eyebrow:'ГОРИЗОНТАЛЬНАЯ ГРАНЬ',title:<>ТОЧНОСТЬ<br/><em>В КАЖДОЙ ЛИНИИ.</em></>,description:'Металлический контур, плавные переходы и выверенная геометрия.',tag:'DESIGN / 002'},
  {no:'03',eyebrow:'ЗАДНЯЯ ПАНЕЛЬ',title:<>МАТЕРИАЛЫ<br/><em>ГОВОРЯТ САМИ.</em></>,description:'Стекло, металл и свет. Ничего лишнего.',tag:'MATERIAL / 003'},
  {no:'04',eyebrow:'ВЕРТИКАЛЬНАЯ ГРАНЬ',title:<>СОВЕРШЕНСТВО<br/><em>В ПРОФИЛЬ.</em></>,description:'Один поворот — и привычная форма раскрывается по-новому.',tag:'PROFILE / 004'},
  {no:'05',eyebrow:'КАМЕРЫ',title:<>ДЕТАЛИ<br/><em>В ФОКУСЕ.</em></>,description:'Три объектива. Точная геометрия. Выразительный акцент.',tag:'CAMERA / 005'},
  {no:'06',eyebrow:'ФИНАЛ',title:<>БОЛЬШЕ,<br/><em>ЧЕМ ФОРМА.</em></>,description:'Рассмотри с другой стороны. Вернись к началу.',tag:'FINALE / 006'},
];

const detailNotes: Record<number, string> = {
  1: 'ТОЧНОСТЬ КАЖДОЙ ГРАНИ',
  3: 'ЧИСТАЯ ГЕОМЕТРИЯ КОРПУСА',
  4: 'ТРИ ОБЪЕКТИВА КРУПНО',
};

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
        // Map the 3D shots and navigation to actual chapter dimensions.
        // Sections are taller than the viewport so each shot can be enjoyed longer.
        const firstChapter=document.querySelector<HTMLElement>('.chapter');
        const chapterHeight=firstChapter?.offsetHeight || window.innerHeight;
        const chapterOffset=firstChapter?.offsetTop || 0;
        const chapterPosition=Math.max(0,(window.scrollY+window.innerHeight*.5-chapterOffset)/chapterHeight);
        progressRef.current=Math.min(1,chapterPosition/chapters.length);
        setProgress(p);
        const current=Math.min(chapters.length-1,Math.floor(chapterPosition));
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
  return <div className="experience" style={{'--scroll-progress':progress} as CSSProperties}>
    <div className="grain" aria-hidden="true"/>
    <div className="scroll-track" aria-hidden="true"><div style={{transform:`scaleY(${progress})`}}/></div>
    <header className="topbar">
      <a href="#chapter-0" onClick={e=>{e.preventDefault();goTo(0);}} className="brand" aria-label="На начало">FORM<span> / </span>FACTOR</a>
      <span className="topbar-center">IPHONE 17 PRO MAX <span className="topbar-star">✳</span> 360° VIEW</span>
      <button className="menu-link" onClick={()=>goTo(5)}>ФИНАЛ <span>↗</span></button>
    </header>
    <div className="ambient-halo" aria-hidden="true"/>
    <div className="object-stage" aria-label="Интерактивная трёхмерная модель телефона">
      <div className="falling-trails" aria-hidden="true" style={{opacity:Math.min(.7,.14+progress*.55)}}><i/><i/><i/><i/><i/></div>
      {webgl?<ModelBoundary><Suspense fallback={<div className="loading-object">ЗАГРУЖАЕМ 3D...</div>}><PhoneScene progress={progressRef} reduced={reduced}/></Suspense></ModelBoundary>:<PhoneFallback/>}
    </div>
    <div className="shot-caption" aria-live="off" aria-hidden="true">
      <span className="shot-caption-line"/>
      <span key={active} className="shot-caption-content"><strong>{shotLabels[active].title}</strong><small>{shotLabels[active].detail}</small></span>
    </div>
    {detailNotes[active] && <div className="detail-note" aria-hidden="true" key={active}>
      <span className="detail-note-rule"/>
      <span className="detail-note-copy">{detailNotes[active]}</span>
    </div>}
    <div className="stage-label" aria-hidden="true"><span className="stage-cross">✳</span> 3D VIEW <span className="stage-line"/> 360°</div>
    <main>
      {chapters.map((chapter,i)=><section className={'chapter chapter-'+i} id={'chapter-'+i} key={chapter.no} aria-label={'Раздел '+chapter.no}>
        <div className="chapter-inner">
          <div className="chapter-meta"><span className="meta-line"/><span>{chapter.no} / 06</span><span className="meta-divider">—</span><span>{chapter.eyebrow}</span></div>
          <h1 className="chapter-title">{chapter.title}</h1>
          <p className="chapter-description">{chapter.description}</p>
          <div className="chapter-footer"><span className="chapter-tag">{chapter.tag}</span>{i===0?<button className="scroll-prompt" onClick={()=>goTo(1)}>ЛИСТАЙ ВНИЗ <span>↓</span></button>:<span className="chapter-coordinate">{String(Math.round((i+1)/chapters.length*100)).padStart(3,'0')} / 100</span>}</div>
        </div>
        <span className="section-index" aria-hidden="true">{chapter.no}</span>
      </section>)}
    </main>
    <nav className="chapter-nav" aria-label="Навигация по разделам">
      {chapters.map((c,i)=><button key={c.no} className={active===i?'current':''} aria-label={'Перейти к разделу '+c.no} aria-current={active===i?'step':undefined} onClick={()=>goTo(i)}><span/></button>)}
    </nav>
    <footer className="site-footer"><span>FORM / FACTOR</span><span>3D PRODUCT VIEWER · 2026</span><button onClick={()=>goTo(0)}>НАВЕРХ ↑</button></footer>
  </div>;
}
