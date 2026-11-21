(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS;
  const galleries = window.PORTFOLIO_GALLERIES || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const grid = Array.from({length:13},(_,i)=>`<path d="M${i*50} 0V400 M0 ${i*35}H600"/>`).join('');
  function diagram(type) {
    let art='';
    if(type==='wind'){
      art=Array.from({length:18},(_,i)=>{let y=40+i*18;return `<path d="M-20 ${y} C150 ${y-30},210 ${y+(i<9?-65:65)},320 ${y+(i<9?-25:25)} S470 ${y+20},630 ${y-40}" fill="none" stroke="#b9db91" opacity="${.15+(i%4)*.08}" class="flow-dash"/>`}).join('')+'<path d="M130 280 Q260 102 470 115 Q305 178 130 280Z" fill="#b6d39a" fill-opacity=".13" stroke="#d4eeb3" stroke-width="1.2"/>'+Array.from({length:20},(_,i)=>`<path d="M${150+i*14} ${263-i*7.1} Q${208+i*12} ${160-i*2.5} ${225+i*12} ${150-i*1.3}" fill="none" stroke="#b9db91" opacity=".3"/>`).join('')+'<circle cx="130" cy="280" r="4" fill="#dcf99b"/><path d="M130 280V335H225 M470 115V65H380" fill="none" stroke="#809774" stroke-width=".6"/><text x="135" y="351" fill="#9fb78c" font-size="9">GEOMETRY / CONDITIONED BY ENVIRONMENT</text><text x="380" y="55" fill="#9fb78c" font-size="9">INVERSE DESIGN</text>';
    }else if(type==='antenna'){
      // One affine projection for every top-layer point: W is horizontal in
      // board coordinates, L follows the feed. Two inset gaps flank a straight
      // constant-width trace, connected to the patch at the notch's inner end.
      art=`<text x="30" y="35" fill="#526442" font-size="9">RECTANGULAR PATCH / INSET MICROSTRIP FEED</text>
        <path d="M110 178L252.6 320.6L532.6 203V217L252.6 334.6L110 192Z" fill="#788965" stroke="#647653"/>
        <path d="M110 192L252.6 334.6L532.6 217V220L252.6 337.6L110 195Z" fill="#b99d67" stroke="#827047" stroke-width=".7"/>
        <g transform="matrix(1 -.42 .62 .62 110 178)">
          <path d="M0 0H280V230H0Z" fill="#9aaa89" stroke="#647653"/>
          <path data-antenna-copper="inset-fed" d="M55 30H225V160H156V125H146V230H134V125H124V160H55Z" fill="#c2a979" stroke="#796b47" stroke-width="1.3"/>
          <path d="M55 160V30H225" fill="none" stroke="#f4deb0" stroke-width="1.5"/>
          <g stroke="#526442" stroke-width=".8" fill="none">
            <path d="M55 15H225M55 10V20M225 10V20M40 30V160M35 30H45M35 160H45"/>
          </g>
        </g>
        <g fill="#405335" font-size="10">
          <text x="250" y="110">W</text><text x="185" y="226">L</text>
          <text x="413" y="281">FEED LINE</text>
          <text x="35" y="290">DIELECTRIC</text>
          <text x="35" y="344">GROUND BELOW</text>
        </g>
        <g fill="none" stroke="#62754d" stroke-width=".8">
          <path d="M398 270L377 246"/><path d="M115 285H160L178 254"/>
          <path d="M129 340H160L181 266"/>
        </g>
        <text x="370" y="345" fill="#526442" font-size="9">TOP COPPER + INSET GAPS</text>`;
    }else if(type==='beam'){
      // Functional routing diagram: expert names label algorithms, not users
      // or physical radiation beams. No illustrative weight implies a result.
      art=`<text x="30" y="40" fill="#b4cdca" font-size="9">TD3-MoE / ADAPTIVE PRECODING</text>
        <g fill="none" stroke="#86aead" stroke-width="1.2">
          <path d="M130 195H190M290 195H316V110H350M316 195H350M316 195V280H350"/>
          <path d="M420 110H452V195H485M420 195H485M420 280H452V195"/>
        </g>
        <g fill="#263b34" stroke="#86aead">
          <rect x="30" y="162" width="100" height="66" rx="2"/>
          <rect x="190" y="162" width="100" height="66" rx="2" stroke="#dcf99b"/>
          <rect x="350" y="90" width="70" height="40" rx="2"/>
          <rect x="350" y="175" width="70" height="40" rx="2"/>
          <rect x="350" y="260" width="70" height="40" rx="2"/>
          <rect x="485" y="162" width="85" height="66" rx="2"/>
        </g>
        <g fill="#d9e7dd" font-size="11" text-anchor="middle">
          <text x="80" y="190">CHANNEL</text><text x="80" y="206">STATE</text>
          <text x="240" y="190">LEARNED</text><text x="240" y="206">ROUTER</text>
          <text x="385" y="114">ZF</text><text x="385" y="199">MMSE</text><text x="385" y="284">MRT</text>
          <text x="527" y="190">MIX &amp;</text><text x="527" y="206">NORMALIZE</text>
        </g>
        <g fill="#dcf99b"><path d="M184 192L190 195L184 198Z"/><path d="M479 192L485 195L479 198Z"/></g>
        <text x="210" y="252" fill="#b4cdca" font-size="9">MIXTURE WEIGHTS</text>
        <text x="482" y="252" fill="#b4cdca" font-size="9">PRECODER</text>
        <text x="30" y="350" fill="#a6c2b9" font-size="9">CHANNEL-DEPENDENT EXPERT COMBINATION / CONCEPTUAL</text>`;
    }else{
      const nodes=Array.from({length:22},(_,i)=>({x:80+((i*137)%440),y:65+((i*83)%270)}));
      art=nodes.map((p,i)=>`<path d="M${p.x} ${p.y}L${nodes[(i+1)%22].x} ${nodes[(i+1)%22].y}" stroke="#a7c78e" opacity=".25" class="flow-dash"/><circle cx="${p.x}" cy="${p.y}" r="${i%3+3}" fill="#dcf99b"/>`).join('')+`<text x="30" y="40" fill="#a6c2a0" font-size="9">${type==='language'?'LANGUAGE / CONTEXT / SYSTEMS':'STRUCTURE / LEARNING / CONNECTION'}</text>`;
    }
    return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="${type==='antenna'?'#6d8057':'#7b9773'}" stroke-width=".5" opacity=".1">${grid}</g><g font-family="monospace">${art}</g></svg>`;
  }
  const visual = p => p.image ? `<img src="${escape(p.image)}" alt="${escape(p.alt)}" loading="lazy">` : diagram(p.type);
  document.querySelector('#featured-projects').innerHTML=projects.slice(0,3).map(p=>`<article class="project reveal"><button class="project-visual" data-project="${p.id}" aria-label="Explore ${escape(p.short)}">${visual(p)}<span class="visual-caption">${p.image?'PROJECT IMAGE':(p.id==='antenna'?'INSET-FED PATCH / NOT TO SCALE':'CONCEPTUAL STUDY / '+p.number)}</span><span class="visual-open" aria-hidden="true">↗</span></button><div class="project-copy"><div class="project-meta"><span class="project-num">${p.number}</span><span>${p.category} · ${p.year}</span></div><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><div class="metric"><strong>${escape(p.metric)}</strong><span>${escape(p.metricLabel)}</span></div><div class="project-tags">${p.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><button class="project-read" data-project="${p.id}">Explore the project <span aria-hidden="true">↗</span></button></div></article>`).join('');
  document.querySelector('#other-projects').innerHTML=projects.slice(3).map(p=>`<button class="project-row reveal" data-project="${p.id}"><span class="row-num">${p.number}</span><span class="row-title">${escape(p.short)}</span><span class="row-category">${p.category}</span><span class="row-arrow" aria-hidden="true">↗</span></button>`).join('');
  const dialog=document.querySelector('#project-dialog');
  const transitionSound=kind=>document.dispatchEvent(new CustomEvent('portfolio:transition',{detail:{kind}}));
  let closing=false;
  async function closeProject(){
    if(closing||!dialog.open)return;
    closing=true;transitionSound('close');
    dialog.getAnimations().forEach(a=>a.cancel());
    if(!reduced.matches)await dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(10px) scale(.99)'}],{duration:260,easing:'cubic-bezier(.4,0,1,1)'}).finished.catch(()=>{});
    dialog.close();closing=false;
  }
  let opener, activeGallery = [], galleryIndex = 0;
  function galleryMarkup(items) {
    const first = items[0];
    return `<section class="project-gallery" aria-label="Project image gallery"><div class="gallery-heading"><span>PROJECT GALLERY</span><span>${items.length} IMAGES</span></div><figure class="gallery-figure"><a class="gallery-original" href="${escape(first.src)}" target="_blank" rel="noopener" aria-label="Open image at full resolution in a new tab"><img class="gallery-image" src="${escape(first.src)}" alt="${escape(first.caption)}"></a><figcaption class="gallery-caption" aria-live="polite">${escape(first.caption)}</figcaption></figure><div class="gallery-toolbar"><button type="button" data-gallery-step="-1" aria-label="Previous project image">←</button><span class="gallery-count">1 / ${items.length}</span><button type="button" data-gallery-step="1" aria-label="Next project image">→</button><a class="gallery-full" href="${escape(first.src)}" target="_blank" rel="noopener">Full resolution ↗</a></div><div class="gallery-thumbnails" aria-label="Choose a project image">${items.map((item,i)=>`<button type="button" data-gallery-index="${i}" aria-label="Image ${i+1}: ${escape(item.caption)}" aria-current="${i===0?'true':'false'}"><img src="${escape(item.src)}" alt="" loading="lazy"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('')}</div></section>`;
  }
  function selectGalleryImage(index) {
    galleryIndex = (index + activeGallery.length) % activeGallery.length;
    const item = activeGallery[galleryIndex];
    const image = dialog.querySelector('.gallery-image');
    image.src = item.src; image.alt = item.caption;
    image.decode().then(()=>{
      if(!dialog.open||image.getAttribute('src')!==item.src)return;
      image.getAnimations().forEach(a=>a.cancel());
      if(!reduced.matches)image.animate([{opacity:.3,transform:'translateX(7px)'},{opacity:1,transform:'translateX(0)'}],{duration:310,easing:'cubic-bezier(.2,.7,.2,1)'});
      transitionSound('step');
    }).catch(()=>{});
    dialog.querySelector('.gallery-caption').textContent = item.caption;
    dialog.querySelector('.gallery-count').textContent = `${galleryIndex+1} / ${activeGallery.length}`;
    dialog.querySelectorAll('.gallery-original, .gallery-full').forEach(a=>a.href=item.src);
    dialog.querySelectorAll('[data-gallery-index]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.galleryIndex)===galleryIndex)));
  }
  dialog.addEventListener('click',event=>{
    const thumb = event.target.closest('[data-gallery-index]');
    const step = event.target.closest('[data-gallery-step]');
    if(thumb)selectGalleryImage(Number(thumb.dataset.galleryIndex));
    if(step)selectGalleryImage(galleryIndex+Number(step.dataset.galleryStep));
  });
  dialog.addEventListener('keydown',event=>{
    if(!event.target.closest('.project-gallery') || !['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();selectGalleryImage(galleryIndex+(event.key==='ArrowRight'?1:-1));
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-project]');
    if(!button)return;
    const p=projects.find(p=>p.id===button.dataset.project);opener=button;
    activeGallery=galleries[p.id] || [];galleryIndex=0;
    document.querySelector('#dialog-content').innerHTML=`<p class="dialog-category">${p.number} / ${p.category}</p><h2 id="dialog-title">${escape(p.title)}</h2><p class="dialog-context">${escape(p.context)}</p>${activeGallery.length?galleryMarkup(activeGallery):`<div class="dialog-visual">${visual(p)}</div>${p.image?'':'<p class="diagram-caption">Conceptual illustration · not a simulation output</p>'}`}<div class="metric"><strong>${escape(p.metric)}</strong><span>${escape(p.metricLabel)}</span></div><div class="dialog-details">${p.details.map(([h,b])=>`<section><h3>${escape(h)}</h3><p>${escape(b)}</p></section>`).join('')}</div>`;
    dialog.showModal();dialog.scrollTop=0;document.querySelector('.dialog-close').focus();
    if(!reduced.matches)dialog.animate([{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
    transitionSound('open');
  });
  document.querySelector('.dialog-close').addEventListener('click',closeProject);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeProject();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProject();}});
  dialog.addEventListener('close',()=>opener?.focus());
  if(!reduced.matches){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
  const time=document.querySelector('#local-time');function clock(){time.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Budapest',hour:'2-digit',minute:'2-digit'}).format(new Date());}clock();setInterval(clock,60000);document.querySelector('#year').textContent=new Date().getFullYear();
  let scrollQueued=false;const progress=document.querySelector('.progress');window.addEventListener('scroll',()=>{if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max?scrollY/max*100:0)+'%';scrollQueued=false;});},{passive:true});
  const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d');if(!ctx)return;
  let webglActive=false;
  document.addEventListener('portfolio:3d-ready',()=>{webglActive=true;cancelAnimationFrame(raf);raf=0;});
  document.addEventListener('portfolio:3d-unavailable',()=>{webglActive=false;schedule();});
  let width=1,height=1,t=0,raf=0,last=0,paused=reduced.matches,visible=true,px=0,py=0,targetX=0,targetY=0;
  const toggle=document.querySelector('#field-toggle');
  function updateButton(){toggle.innerHTML=paused?'Resume motion <span>▶</span>':'Pause motion <span>Ⅱ</span>';toggle.setAttribute('aria-pressed',String(paused));document.body.classList.toggle('paused',paused);document.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{paused}}));}updateButton();
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}new ResizeObserver(resize).observe(canvas);
  const hero=document.querySelector('.hero');hero.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=hero.getBoundingClientRect();targetX=(e.clientX/r.width-.5)*.15;targetY=(e.clientY/r.height-.5)*.15;},{passive:true});hero.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  function project(x,y,z){const ax=.3+py,ay=-.48+px;let xx=x*Math.cos(ay)+z*Math.sin(ay),zz=-x*Math.sin(ay)+z*Math.cos(ay),yy=y*Math.cos(ax)-zz*Math.sin(ax);zz=y*Math.sin(ax)+zz*Math.cos(ax);const perspective=850/(850+zz);return [width*.56+xx*perspective,height*.49+yy*perspective];}
  function draw(){ctx.clearRect(0,0,width,height);const scale=Math.min(width/850,height/650);ctx.lineWidth=.65;
    // Flow lines form a moving field around a conceptual twisted blade.
    for(let row=0;row<37;row++){ctx.beginPath();for(let k=0;k<=105;k++){const x=(k/105-.5)*1020*scale;const base=(row-18)*15*scale;const influence=Math.exp(-Math.pow(x/(210*scale),2));const side=base<0?-1:1;const y=base+side*influence*65*scale+Math.sin(k*.065+t*.3+row*.17)*12*scale;const z=Math.sin(k*.045+row*.13+t*.12)*28*scale;const [sx,sy]=project(x,y,z);k?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.strokeStyle=`rgba(164,198,128,${.12+.16*(1-Math.abs(row-18)/18)})`;ctx.stroke();}
    for(let rib=0;rib<55;rib++){const u=rib/54;ctx.beginPath();for(let k=0;k<=40;k++){const v=k/40;const x=(u-.5)*470*scale;const chord=(Math.sin(u*Math.PI)*75+14)*scale;const twist=(u-.5)*1.7+Math.sin(t*.22)*.09;const yy=(v-.5)*chord;const zz=Math.sin(v*Math.PI)*chord*.26;const y=yy*Math.cos(twist)-zz*Math.sin(twist)+(u-.5)*-230*scale;const z=yy*Math.sin(twist)+zz*Math.cos(twist);const [sx,sy]=project(x,y,z);k?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.strokeStyle=`rgba(220,249,155,${.38+Math.sin(u*Math.PI)*.45})`;ctx.stroke();}
    for(let line=0;line<9;line++){ctx.beginPath();for(let k=0;k<=65;k++){const u=k/65,v=line/8;const x=(u-.5)*470*scale,chord=(Math.sin(u*Math.PI)*75+14)*scale,twist=(u-.5)*1.7+Math.sin(t*.22)*.09,yy=(v-.5)*chord,zz=Math.sin(v*Math.PI)*chord*.26;const [sx,sy]=project(x,yy*Math.cos(twist)-zz*Math.sin(twist)+(u-.5)*-230*scale,yy*Math.sin(twist)+zz*Math.cos(twist));k?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.strokeStyle='rgba(220,249,155,.4)';ctx.stroke();}
    for(let i=0;i<40;i++){const u=((i*.137+t*.045)%1),x=(u-.5)*1020*scale,base=((i*73)%500-250)*scale,influence=Math.exp(-Math.pow(x/(210*scale),2)),y=base+(base<0?-1:1)*influence*65*scale;const [sx,sy]=project(x,y,0);ctx.fillStyle=`rgba(220,249,155,${.25+Math.sin(u*Math.PI)*.55})`;ctx.beginPath();ctx.arc(sx,sy,1.2,0,Math.PI*2);ctx.fill();}
  }
  function loop(now){raf=0;if(webglActive||paused||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.04)||.016;last=now;t+=dt;px+=(targetX-px)*.04;py+=(targetY-py)*.04;draw();raf=requestAnimationFrame(loop);}
  function schedule(){if(!webglActive&&!raf&&!paused&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(loop);}}
  toggle.addEventListener('click',()=>{paused=!paused;updateButton();if(paused){cancelAnimationFrame(raf);raf=0;}else schedule();});
  reduced.addEventListener('change',e=>{paused=e.matches;updateButton();if(paused){cancelAnimationFrame(raf);raf=0;draw();}else schedule();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;}else schedule();}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});schedule();
})();
