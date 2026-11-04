import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
const Scene = lazy(() => import('./Scene'));
type Page = 'home' | 'features' | 'pricing' | 'about';
const links: { id: Page; label: string }[] = [{id:'home',label:'Главная'},{id:'features',label:'Возможности'},{id:'pricing',label:'Тарифы'},{id:'about',label:'О сервисе'}];
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="fallback-orb"/>:this.props.children;}
}
function canUseWebGL(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}}
function useReveal(page:Page){
  useLayoutEffect(()=>{
    const elements=document.querySelectorAll('.reveal');
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){elements.forEach(el=>el.classList.add('visible'));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.04,rootMargin:'0px 0px 40px 0px'});
    elements.forEach(el=>observer.observe(el));return()=>observer.disconnect();
  },[page]);
}
type DemoScenario = 'shop' | 'service' | 'software';
const demoScenarios: Record<DemoScenario,{label:string;greeting:string;prompts:string[];answers:string[]}> = {
  shop:{label:'Интернет-магазин',greeting:'Здравствуйте! Помогу подобрать товар и разобраться с доставкой. Что ищете?',prompts:['Помогите выбрать товар','Как оформить заказ?'],answers:['Расскажите, что для вас важно: цена, характеристики или срок доставки? Я помогу сузить выбор.','Подскажу основные шаги оформления. Для точных условий доставки нужно проверить информацию магазина.','Могу уточнить детали запроса, чтобы менеджер продолжил разговор. Это демонстрация — данные никуда не отправляются.']},
  service:{label:'Услуги',greeting:'Добрый день! Расскажите, какая задача перед вами — помогу определить следующий шаг.',prompts:['Хочу узнать стоимость','Нужна консультация'],answers:['Стоимость зависит от объёма и сроков. Расскажите немного о задаче, чтобы подготовить запрос специалисту.','Давайте уточним цель и желаемый результат — так консультация будет предметнее.','Спасибо! В реальном сервисе такой контекст можно передать менеджеру. Здесь мы показываем только сценарий.']},
  software:{label:'IT / SaaS',greeting:'Привет! Помогу разобраться с возможностями продукта и выбором подходящего решения.',prompts:['Какие есть возможности?','Подойдёт ли нам сервис?'],answers:['Начнём с главной задачи: автоматизация, поддержка клиентов или рост конверсии?','Расскажите о размере команды и процессе работы — это поможет понять, какой вариант стоит рассмотреть.','Я собрал контекст беседы. В реальном продукте его можно передать специалисту; в демо ничего не сохраняется.']}
};
function DemoChat(){
  const [scenario,setScenario]=useState<DemoScenario>('shop');
  const [messages,setMessages]=useState<{from:'bot'|'user';text:string}[]>([{from:'bot',text:demoScenarios.shop.greeting}]);
  const [value,setValue]=useState('');
  const [stage,setStage]=useState(0);
  const chatEnd=useRef<HTMLDivElement>(null);
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages]);
  function changeScenario(next:DemoScenario){
    timers.current.forEach(clearTimeout);timers.current=[];
    setScenario(next);setStage(0);setValue('');
    setMessages([{from:'bot',text:demoScenarios[next].greeting}]);
  }
  function reply(text:string){
    const input=text.trim();if(!input)return;
    timers.current.forEach(clearTimeout);timers.current=[];
    const answer=demoScenarios[scenario].answers[Math.min(stage,2)];
    setMessages(m=>[...m,{from:'user',text:input}]);setValue('');setStage(n=>n+1);
    const timer=setTimeout(()=>{setMessages(m=>[...m,{from:'bot',text:answer}]);timers.current=timers.current.filter(t=>t!==timer);},400);
    timers.current.push(timer);
  }
  return <div className="demo-experience">
    <div className="scenario-picker" role="group" aria-label="Выберите тип бизнеса">
      {(Object.keys(demoScenarios) as DemoScenario[]).map(key=><button key={key} type="button" className={scenario===key?'active':''} aria-pressed={scenario===key} onClick={()=>changeScenario(key)}>{demoScenarios[key].label}</button>)}
    </div>
    <div className="chatbox"><div className="chathead"><span className="avatar">✦</span><div><strong>AI-консультант</strong><small><i/> Симуляция · {demoScenarios[scenario].label}</small></div><span className="chatbadge">DEMO</span></div>
      <div className="messages" role="log" aria-live="polite">{messages.map((m,i)=><div key={i} className={'bubble '+m.from}>{m.text}</div>)}<div ref={chatEnd}/></div>
      {stage===0&&<div className="suggestions">{demoScenarios[scenario].prompts.map(prompt=><button key={prompt} type="button" onClick={()=>reply(prompt)}>{prompt}</button>)}</div>}
      <form className="chatinput" onSubmit={e=>{e.preventDefault();reply(value);}}><input aria-label="Сообщение для демо-чата" placeholder="Напишите свой вопрос..." value={value} onChange={e=>setValue(e.target.value)}/><button aria-label="Отправить сообщение" type="submit">↗</button></form>
      <p className="demo-note">Демонстрационный сценарий: ответы заранее подготовлены, данные не отправляются.</p>
    </div>
  </div>;
}
function Calculator(){
  const [visits,setVisits]=useState(3000);const [engagement,setEngagement]=useState(10);const [conversion,setConversion]=useState(20);
  const dialogs=Math.round(visits*engagement/100);const leads=Math.round(dialogs*conversion/100);
  return <div className="calculator"><div className="calc-controls"><label>Посетителей в месяц <strong>{visits.toLocaleString('ru-RU')}</strong><input type="range" min="500" max="20000" step="500" value={visits} onChange={e=>setVisits(+e.target.value)}/></label><label>Начали диалог <strong>{engagement}%</strong><input type="range" min="1" max="30" value={engagement} onChange={e=>setEngagement(+e.target.value)}/></label><label>Оставили контакт <strong>{conversion}%</strong><input type="range" min="5" max="40" value={conversion} onChange={e=>setConversion(+e.target.value)}/></label></div><div className="calc-result"><span>ПОТЕНЦИАЛЬНЫЕ ЗАЯВКИ</span><strong>{leads}</strong><p>в месяц при выбранных параметрах</p><div className="calc-mini">{dialogs} диалогов · {leads} контактов</div></div><p className="calc-disclaimer">Иллюстративный расчёт, не прогноз и не гарантия результата.</p></div>;
}
const plans=[{name:'Старт',price:'1 900',dialogs:'30',desc:'Для первого знакомства с AI-продажами',items:['AI изучает ваш сайт','Сбор контактов','Передача диалогов менеджеру']},{name:'Рост',price:'2 900',dialogs:'80',desc:'Для активного потока обращений',items:['Всё из тарифа «Старт»','Больше диалогов','Аналитика по лидам'],popular:true},{name:'Про',price:'3 900',dialogs:'150',desc:'Для каталогов и растущего бизнеса',items:['Всё из тарифа «Рост»','Консультации по каталогу','Расширенная аналитика']}];
function App(){
  const getPage=():Page=>{const h=window.location.hash.replace(/^#\/?/,'');return links.some(x=>x.id===h)?h as Page:'home';};
  const [storyProgress,setStoryProgress]=useState(0);const [page,setPage]=useState<Page>(getPage);const [menu,setMenu]=useState(false);const [webgl,setWebgl]=useState(false);const [reduced,setReduced]=useState(false);const [progress,setProgress]=useState(0);const [faq,setFaq]=useState<number|null>(0);
  useReveal(page);
  useEffect(()=>{setWebgl(canUseWebGL());setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);const onHash=()=>{setPage(getPage());window.scrollTo(0,0);};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[]);
  useEffect(()=>{let raf=0;const onScroll=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max*100:0);const story=document.querySelector('.scroll-story');if(story){const rect=story.getBoundingClientRect();const range=Math.max(1,rect.height-innerHeight);const raw=-rect.top/range;const t=Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):0;setStoryProgress(t);(story as HTMLElement).style.setProperty('--story-progress',String(t));}});};window.addEventListener('scroll',onScroll,{passive:true});onScroll();return()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(raf);};},[page]);
  function jumpToChapter(index:number){
    const story=document.querySelector('.scroll-story');
    if(!story)return;
    const rect=story.getBoundingClientRect();
    const top=window.scrollY+rect.top;
    const range=Math.max(1,rect.height-window.innerHeight);
    const destination=top+range*((index+.5)/3);
    window.scrollTo({top:destination,behavior:reduced?'instant':'smooth'});
  }
  function navigate(id:Page){setMenu(false);if(id===page){window.scrollTo({top:0,behavior:'smooth'});}else{window.location.hash='/'+id;setPage(id);window.scrollTo(0,0);}}
  const nav=(id:Page,label:string)=> <a key={id} href={'#/'+id} className={page===id?'active':''} onClick={()=>{setMenu(false);setPage(id);window.scrollTo(0,0);}}>{label}</a>;
  return <div className="site"><div className="scroll-progress" style={{width:progress+'%'}}/><header className="site-header"><button className="brand" onClick={()=>navigate('home')} aria-label="На главную"><span className="brand-icon">✳</span> КОНТАКТИУМ<span className="brand-dot">.</span></button><nav className={menu?'nav open':'nav'} aria-label="Навигация">{links.map(l=>nav(l.id,l.label))}</nav><a className="header-cta" href="https://kontaktium.ru/" target="_blank" rel="noopener noreferrer">Подключить <span>↗</span></a><button className="menu-toggle" onClick={()=>setMenu(v=>!v)} aria-label={menu?'Закрыть меню':'Открыть меню'} aria-expanded={menu}>{menu?'✕':'☰'}</button></header>
  <main key={page} className="page-transition">
  {page==='home'&&<>
    <section className="hero-section"><div className="hero-grid"/><div className="hero-visual" aria-hidden="true"><div className="fallback-orb"/></div><div className="hero-glow"/><div className="hero-glass-note" aria-hidden="true"><span className="hero-glass-note-icon">✳</span><div><strong>ИНТЕЛЛЕКТ В КАЖДОМ ДИАЛОГЕ</strong><small>Ваш сайт может говорить первым</small></div><span className="hero-glass-note-arrow">↗</span></div><div className="hero-content"><div className="hero-edition" aria-hidden="true"><span>КОНТАКТИУМ / DIGITAL EXPERIENCE</span><span>EST. 2026</span></div><div className="eyebrow"><span className="eyebrow-line"/> ИНТЕЛЛЕКТУАЛЬНЫЙ СЕРВИС ДЛЯ БИЗНЕСА</div><h1>САЙТ МОЛЧИТ.<br/><em>МЫ НАЧНЁМ</em><br/>ДИАЛОГ.</h1><p className="hero-copy">AI-консультант вовлекает посетителей, помогает разобраться в предложении и превращает интерес в заявки — даже когда вы не онлайн.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>document.getElementById('demo')?.scrollIntoView({behavior:'smooth'})}>Попробовать демо <span>↗</span></button><button className="text-btn" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>Как это работает <span>↓</span></button></div></div><div className="hero-bottom"><span>01 / НОВАЯ ЭРА КОММУНИКАЦИИ</span><span>ЛИСТАЙТЕ, ЧТОБЫ ИССЛЕДОВАТЬ ↓</span></div></section>
    <section className="scroll-story" aria-label="История цифрового диалога">
      <div className="story-sticky">
        <div className="story-ambient" aria-hidden="true">{webgl&&!reduced?<SceneBoundary><Suspense fallback={<div className="story-orbit"><div className="story-core"/></div>}><Scene entered={false} storyProgress={storyProgress}/></Suspense></SceneBoundary>:<div className="story-orbit"><div className="story-core"/></div>}</div>
        <div className="story-vignette" aria-hidden="true"/>
        <div className="story-meter" aria-hidden="true"><span>THE JOURNEY</span><div><i style={{height:(storyProgress*100)+'%'}}/></div><span>0{Math.min(3,Math.floor(storyProgress*3)+1)} / 03</span></div>
        <nav className="chapter-nav" aria-label="Этапы истории">
          {['Интерес','Контакт','Результат'].map((label,index)=><button key={label} type="button" aria-label={`Перейти к этапу ${index+1}: ${label}`} aria-current={Math.min(2,Math.floor(storyProgress*3))===index?'step':undefined} className={Math.min(2,Math.floor(storyProgress*3))===index?'selected':''} onClick={()=>jumpToChapter(index)}><span className="chapter-index">0{index+1}</span><span className="chapter-label">{label}</span><span className="chapter-line"/></button>)}
        </nav>
        <div className="story-steps">
          <div className={`story-step ${Math.min(2,Math.floor(storyProgress*3))===0?'current':''}`}><span className="story-num">01 / ИНТЕРЕС</span><h2>КАЖДЫЙ ВИЗИТ<br/><em>ЧТО-ТО ЗНАЧИТ.</em></h2><p>Кто-то просто смотрит. Кто-то уже готов спросить. Важно почувствовать момент.</p></div>
          <div className={`story-step ${Math.min(2,Math.floor(storyProgress*3))===1?'current':''}`}><span className="story-num">02 / КОНТАКТ</span><h2>ПЕРВЫЙ ШАГ<br/><em>ЗА НАМИ.</em></h2><p>Контактиум помогает начать разговор, когда внимание посетителя ещё здесь.</p></div>
          <div className={`story-step ${Math.min(2,Math.floor(storyProgress*3))===2?'current':''}`}><span className="story-num">03 / РЕЗУЛЬТАТ</span><h2>ИЗ ИНТЕРЕСА —<br/><em>В ДИАЛОГ.</em></h2><p>Вопросы становятся ответами. Разговоры — возможностью для бизнеса.</p></div>
        </div>
      </div>
    </section><section className="stat-band"><div className="reveal"><strong>24/7</strong><span>на связи с клиентами</span></div><div className="reveal"><strong>10 сек</strong><span>быстрый ответ</span></div><div className="reveal"><strong>AI</strong><span>общается и квалифицирует</span></div></section>
    <section className="section split-section editorial-section" id="how"><div className="section-kicker reveal">01 — ПРОБЛЕМА / РЕШЕНИЕ</div><div className="split"><h2 className="reveal">ПОСЕТИТЕЛЬ<br/>УХОДИТ.<br/><span>ВОЗМОЖНОСТЬ — НЕТ.</span></h2><div className="split-copy reveal"><p>Человек изучает ваш сайт, сравнивает варианты и уходит, так и не задав вопрос.</p><p>Контактиум может начать разговор первым — в нужный момент, без ожидания менеджера.</p><button className="inline-link" onClick={()=>navigate('features')}>Исследовать возможности ↗</button></div></div></section>
    <section className="section demo-section editorial-section" id="demo"><div className="demo-intro reveal"><div className="section-kicker">02 — ИНТЕРАКТИВ</div><h2>НЕ ЧИТАЙТЕ.<br/><span>ПОПРОБУЙТЕ.</span></h2><p>Почувствуйте, как начинается разговор. Это интерактивная симуляция поведения консультанта.</p><div className="orb-mini">✳</div></div><div className="reveal"><DemoChat/></div></section>
    <section className="section process-section editorial-section"><div className="section-kicker reveal">03 — КАК ЭТО РАБОТАЕТ</div><h2 className="reveal">ОТ ВИЗИТА<br/><span>ДО КОНТАКТА.</span></h2><div className="process-grid">{[['01','Замечаем интерес','Система определяет подходящий момент для начала общения.'],['02','Начинаем диалог','AI помогает посетителю сориентироваться и отвечает на вопросы.'],['03','Уточняем задачу','Консультант собирает контекст и контактные данные.'],['04','Передаём менеджеру','Ваша команда получает информацию для продолжения разговора.']].map(([n,t,d])=><article className="process-card reveal" key={n}><span>{n} /</span><div className="process-symbol">✳</div><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="section calculator-section editorial-section"><div className="reveal"><div className="section-kicker">04 — КАЛЬКУЛЯТОР</div><h2>А ЧТО, ЕСЛИ<br/><span>БОЛЬШЕ ЗАЯВОК?</span></h2><p className="section-lead">Поиграйте с параметрами и оцените возможный эффект от вовлечения посетителей.</p></div><div className="reveal"><Calculator/></div></section>
    <section className="section end-section reveal"><span className="section-kicker">СЛЕДУЮЩИЙ ШАГ</span><h2>ПРЕВРАТИМ<br/><span>ИНТЕРЕС В ДИАЛОГ.</span></h2><button className="primary-btn" onClick={()=>navigate('pricing')}>Посмотреть тарифы ↗</button></section>
  </>}
  {page==='features'&&<><section className="inner-hero inner-hero-robot"><div className="inner-hero-orb" aria-hidden="true"><div className="inner-hero-orb-core"/><div className="inner-hero-orb-ring"/></div><div className="inner-hero-copy"><div className="section-kicker reveal">ВОЗМОЖНОСТИ / 02</div><h1 className="reveal">НЕ ПРОСТО ЧАТ.<br/><em>УМНЫЙ КОНТАКТ.</em></h1><p className="reveal">AI-помощник, который не ждёт первого сообщения, а помогает вашему бизнесу сделать первый шаг.</p></div></section><section className="section feature-list editorial-section">{[['01','Инициатива в нужный момент','Реагирует на признаки интереса: просмотр предложений, глубокий скролл, задержку на странице.'],['02','Диалог с пониманием контекста','Отвечает на вопросы о бизнесе, уточняет потребности и помогает выбрать решение.'],['03','Готовый бриф для менеджера','Передаёт контакт и контекст разговора, чтобы не начинать всё с нуля.'],['04','Коммуникация без пауз','Помогает посетителям в любое время — пока команда занята другими задачами.']].map(([n,t,d])=><article className="feature-row reveal" key={n}><span>{n}</span><h2>{t}</h2><p>{d}</p><span className="feature-arrow">↗</span></article>)}</section><section className="section end-section reveal"><h2>УВИДЕТЬ<br/><span>В ДЕЙСТВИИ?</span></h2><button className="primary-btn" onClick={()=>navigate('home')}>Открыть демо ↗</button></section></>}
  {page==='pricing'&&<><section className="inner-hero"><div className="section-kicker reveal">ТАРИФЫ / 03</div><h1 className="reveal">РАЗГОВОРЫ,<br/><em>КОТОРЫЕ ИМЕЮТ СМЫСЛ.</em></h1><p className="reveal">Выберите масштаб общения. Цены приведены по данным сайта сервиса и могут меняться.</p></section><section className="section pricing-grid editorial-section">{plans.map(p=><article key={p.name} className={'plan reveal '+(p.popular?'popular':'')}>{p.popular&&<span className="popular-label">ПОПУЛЯРНЫЙ ВЫБОР</span>}<div className="plan-name">{p.name}</div><p>{p.desc}</p><div className="plan-price">{p.price} ₽<small>/мес</small></div><div className="plan-dialogs">{p.dialogs} диалогов с AI в месяц</div><ul>{p.items.map(item=><li key={item}>✳ {item}</li>)}</ul><a className="primary-btn" href="https://kontaktium.ru/" target="_blank" rel="noopener noreferrer">Узнать подробнее ↗</a></article>)}</section><section className="section faq-section faq-glass"><div className="faq-art"><div className="section-kicker reveal">ОТВЕТЫ / FAQ</div><h2 className="reveal">ЕСТЬ<br/><span>ВОПРОСЫ?</span></h2><div className="faq-sculpture" aria-hidden="true"><div className="faq-glass-orb"><span className="faq-glass-orb-inner"/><span className="faq-glass-orb-ring"/></div></div></div><div className="faq-glass-list">{[['Нужно ли программировать для подключения?','По информации сервиса, подключение выполняется с помощью настройки на сайте. Уточните детали для вашей платформы у команды Контактиум.'],['Это живой оператор?','Нет, диалог ведёт AI-консультант. При необходимости менеджер может подключиться.'],['Можно ли использовать с существующим чатом?','Возможность совместной работы зависит от вашей платформы и настроек. Уточните совместимость перед подключением.'],['Откуда взяты цены?','Тарифы показаны по публичной информации kontaktium.ru на момент разработки. Актуальные условия проверяйте на официальном сайте.']].map(([q,a],i)=><div className="faq-item reveal" key={q}><button type="button" id={`faq-question-${i}`} aria-controls={`faq-answer-${i}`} aria-expanded={faq===i} onClick={()=>setFaq(faq===i?null:i)}>{q}<span aria-hidden="true">{faq===i?'−':'+'}</span></button><div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`} hidden={faq!==i}><p>{a}</p></div></div>)}</div></section></>}
  {page==='about'&&<><section className="inner-hero inner-hero-robot"><div className="inner-hero-orb" aria-hidden="true"><div className="inner-hero-orb-core"/><div className="inner-hero-orb-ring"/></div><div className="inner-hero-copy"><div className="section-kicker reveal">ИДЕЯ / 04</div><h1 className="reveal">ТЕХНОЛОГИЯ<br/><em>НА СТОРОНЕ ДИАЛОГА.</em></h1><p className="reveal">Каждый посетитель — это человек с вопросом. Важно услышать его вовремя.</p></div></section><section className="section split-section"><div className="section-kicker reveal">НАША ФИЛОСОФИЯ</div><div className="split"><h2 className="reveal">МЕНЬШЕ<br/>МОЛЧАНИЯ.<br/><span>БОЛЬШЕ СВЯЗИ.</span></h2><div className="split-copy reveal"><p>Вместо пассивной формы обратной связи — живое взаимодействие. Вместо потерянного интереса — возможность продолжить разговор.</p><p>Этот сайт — независимый концептуальный дизайн сервиса Контактиум. Для реального подключения, поддержки и условий используйте официальный ресурс.</p><a className="inline-link" href="https://kontaktium.ru/" target="_blank" rel="noopener noreferrer">Официальный сайт ↗</a></div></div></section><section className="section end-section reveal"><h2>ДАВАЙТЕ<br/><span>ПОГОВОРИМ.</span></h2><button className="primary-btn" onClick={()=>navigate('home')}>Посмотреть интерактив ↗</button></section></>}
  </main><footer className="site-footer"><div className="footer-logo">КОНТАКТИУМ<span>.</span></div><div><span>КОНЦЕПТ ИНТЕРАКТИВНОГО САЙТА</span><span>© 2026 · НЕОФИЦИАЛЬНЫЙ ДЕМО-ДИЗАЙН</span></div><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>НАВЕРХ ↑</button></footer></div>;
}
export default App;
