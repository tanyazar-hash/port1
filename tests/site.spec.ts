import { test, expect } from '@playwright/test';

test('new phone showcase has six chapters and a 3D stage', async ({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/FORM \/ FACTOR/);
  await expect(page.locator('.chapter')).toHaveCount(6);
  await expect(page.locator('.chapter-0 h1')).toContainText('ФОРМА, КОТОРАЯ');
  await expect(page.locator('.object-stage')).toBeVisible();
});

test('initial scroll is at the top and text appears as visitor scrolls', async ({page})=>{
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.locator('#chapter-2').scrollIntoViewIfNeeded();
  await expect(page.locator('#chapter-2')).toHaveClass(/is-visible/);
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(300);
});

test('navigation moves through chapters without horizontal overflow', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Перейти к разделу 04'}).click();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(500);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('chapters reveal later and the phone stays behind readable text', async ({page})=>{
  await page.goto('/');
  await expect(page.locator('#chapter-0')).toHaveClass(/is-visible/);
  await expect(page.locator('#chapter-1')).not.toHaveClass(/is-visible/);
  await expect(page.locator('.object-stage')).toHaveCSS('z-index','2');
  await expect(page.locator('main')).toHaveCSS('z-index','5');
  await expect(page.locator('.falling-trails i')).toHaveCount(5);
  await page.evaluate(()=>window.scrollTo({top:window.innerHeight*.3,behavior:'instant'}));
  await expect(page.locator('#chapter-1')).not.toHaveClass(/is-visible/);
  await page.evaluate(()=>window.scrollTo({top:window.innerHeight*1.35,behavior:'instant'}));
  await expect(page.locator('#chapter-1')).toHaveClass(/is-visible/);
});

test('product shots update as visitors move through six chapters', async ({page})=>{
  await page.goto('/');
  await expect(page.locator('.shot-caption strong')).toHaveText('ОБЪЕКТ / 01');
  await page.getByRole('button',{name:'Перейти к разделу 05'}).click();
  await expect(page.locator('.shot-caption strong')).toHaveText('КАМЕРА / 05');
  await expect(page.locator('.shot-caption small')).toHaveText('В ФОКУСЕ ДЕТАЛИ');
  await page.getByRole('button',{name:'Перейти к разделу 06'}).click();
  await expect(page.locator('.shot-caption strong')).toHaveText('ФИНАЛ / 06');
});

test('mobile shot labels do not create horizontal scrolling', async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.shot-caption')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('chapters give visitors more room to inspect the product', async ({page})=>{
  await page.goto('/');
  const sizes=await page.evaluate(()=>{
    const section=document.querySelector<HTMLElement>('.chapter')!;
    return {section:section.getBoundingClientRect().height,viewport:window.innerHeight};
  });
  expect(sizes.section).toBeGreaterThan(sizes.viewport*1.19);
});

test('detail markers smoothly appear and disappear in sync with scroll', async ({page})=>{
  await page.goto('/');
  await expect(page.locator('.detail-note')).toHaveCount(3);
  const opacity=async (chapter:number,position:number)=>{
    await page.evaluate(([index,progress])=>{
      const section=document.querySelectorAll<HTMLElement>('.chapter')[index];
      const offset=section.offsetTop+section.offsetHeight*progress-innerHeight*.5;
      window.scrollTo({top:offset,behavior:'instant'});
    },[chapter,position] as [number,number]);
    await page.waitForTimeout(120);
    return Number(await page.locator(`.detail-note-chapter-${chapter+1}`).evaluate(el=>getComputedStyle(el).opacity));
  };
  expect(await opacity(1,.1)).toBeLessThan(.05);
  expect(await opacity(1,.62)).toBeGreaterThan(.95);
  expect(await opacity(1,.98)).toBeLessThan(.22);
  expect(await opacity(3,.62)).toBeGreaterThan(.95);
  expect(await opacity(4,.62)).toBeGreaterThan(.95);
  await expect(page.locator('.detail-note-vertical')).toHaveCount(3);
  await expect(page.locator('.detail-note-chapter-5 .detail-note-rule')).toHaveCSS('width','1px');
});

test('headlines and descriptions remain within the viewport at common widths', async ({page})=>{
  for(const width of [360,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.addStyleTag({content:'.chapter-inner>*{animation:none!important;transform:none!important;opacity:1!important}'});
    const bounds=await page.locator('.chapter').evaluateAll(sections=>sections.map(section=>{
      const heading=section.querySelector('.chapter-title')!.getBoundingClientRect();
      const description=section.querySelector('.chapter-description')!.getBoundingClientRect();
      return {headingLeft:heading.left,headingRight:heading.right,descriptionLeft:description.left,descriptionRight:description.right};
    }));
    for(const item of bounds){
      expect(item.headingLeft).toBeGreaterThanOrEqual(-1);
      expect(item.headingRight).toBeLessThanOrEqual(width+1);
      expect(item.descriptionLeft).toBeGreaterThanOrEqual(-1);
      expect(item.descriptionRight).toBeLessThanOrEqual(width+1);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('mobile product stage clears the header and reading panel stays legible',async ({page})=>{
  for(const width of [360,390,430]){
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    const layout=await page.evaluate(()=>{
      const header=document.querySelector('.topbar')!.getBoundingClientRect();
      const stage=document.querySelector('.object-stage')!.getBoundingClientRect();
      const chapters=[...document.querySelectorAll('.chapter')];
      const headings=chapters.map(ch=>ch.querySelector('.chapter-title')!.getBoundingClientRect());
      return {headerBottom:header.bottom,stageTop:stage.top,stageBottom:stage.bottom,
        headingRights:headings.map(h=>h.right),headingLefts:headings.map(h=>h.left),
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(layout.stageTop).toBeGreaterThanOrEqual(layout.headerBottom-1);
    expect(layout.stageBottom).toBeLessThanOrEqual(844);
    expect(layout.horizontalOverflow).toBe(false);
    for(const right of layout.headingRights)expect(right).toBeLessThanOrEqual(width+1);
    for(const left of layout.headingLefts)expect(left).toBeGreaterThanOrEqual(-1);
  }
});

test('iPhone 14 Pro mobile composition brings chapter copy into the first viewport',async ({page})=>{
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  const layout=await page.evaluate(()=>{
    const section=document.querySelector('.chapter-0')!.getBoundingClientRect();
    const heading=document.querySelector('.chapter-0 .chapter-title')!.getBoundingClientRect();
    const stage=document.querySelector('.object-stage')!.getBoundingClientRect();
    const note=getComputedStyle(document.querySelector('.detail-note-copy')!).fontSize;
    return {sectionHeight:section.height,headingTop:heading.top,headingBottom:heading.bottom,stageBottom:stage.bottom,noteSize:parseFloat(note)};
  });
  expect(layout.sectionHeight).toBeGreaterThan(852);
  expect(layout.headingTop).toBeGreaterThan(400);
  expect(layout.headingTop).toBeLessThan(700);
  expect(layout.headingBottom).toBeLessThan(852);
  expect(layout.stageBottom).toBeLessThan(layout.headingBottom);
  expect(layout.noteSize).toBeGreaterThanOrEqual(10);
});

test('mobile reading panel fades before crossing the fixed phone stage',async ({page})=>{
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  const chapter=page.locator('.chapter-0');
  await expect(chapter).toHaveCSS('--mobile-copy-opacity',/^(1|1\.0+)$/);
  const height=await chapter.evaluate(el=>(el as HTMLElement).offsetHeight);
  await page.evaluate(y=>window.scrollTo(0,y),height*.42);
  await page.waitForTimeout(220);
  const faded=await chapter.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--mobile-copy-opacity')));
  expect(faded).toBeLessThan(.45);
  await page.evaluate(y=>window.scrollTo(0,y),height*.85);
  await page.waitForTimeout(220);
  const next=await page.locator('.chapter-1').evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--mobile-copy-opacity')));
  expect(next).toBeGreaterThan(.5);
});
