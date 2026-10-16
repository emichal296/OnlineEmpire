(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, ground = 405;
  const tips = [
    "Small consistent actions beat waiting for the perfect moment.",
    "A useful post solves one real problem for one real reader.",
    "Learn one digital skill, then practise it by making something.",
    "Your first version does not need to be perfect. It needs to exist.",
    "Protect your focus: not every notification deserves your attention.",
    "Create value first. Trust grows when people find your work genuinely useful.",
    "Make your headline clear enough that a busy person understands it fast.",
    "Review what worked, improve one thing, and try again."
  ];
  const ranks = [
    {name:'ROOKIE',min:0,next:'Builder'}, {name:'BUILDER',min:250,next:'Creator'},
    {name:'CREATOR',min:700,next:'Strategist'}, {name:'STRATEGIST',min:1400,next:'Empire Maker'},
    {name:'EMPIRE MAKER',min:2400,next:'Legend'}, {name:'LEGEND',min:4000,next:'Top of the leaderboard'}
  ];
  let state='ready', score=0, energy=100, skillCount=0, xp=Number(localStorage.getItem('prEmpireXP')||0);
  let best=Number(localStorage.getItem('prEmpireBest')||0), level=1, multiplier=1, combo=0, frame=0, lastTime=0, speed=4;
  let player={x:145,y:ground-48,w:34,h:48,vy:0,grounded:true,flash:0};
  let items=[], particles=[], clouds=[], spawn=0, sound=false, audioCtx=null, keys={}, touch={left:false,right:false};
  let toastTimer;
  $('bestScore').textContent=String(best).padStart(4,'0');
  function rankFor(n){let r=ranks[0];for(const item of ranks)if(n>=item.min)r=item;return r;}
  function updateProgress(){
    const r=rankFor(xp);$('xpLabel').textContent=xp+' XP';$('rankLabel').textContent=r.name;
    $('nextRank').textContent=r.next;
    const next=ranks.find(x=>x.min>xp);const prev=r.min;
    const pct=next?Math.max(0,Math.min(100,(xp-prev)/(next.min-prev)*100)):100;
    $('xpBar').style.width=pct+'%';
    $('bestScore').textContent=String(best).padStart(4,'0');
  }
  updateProgress();
  function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);}
  function beep(freq=540,duration=.07,type='sine'){if(!sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=.045;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.stop(audioCtx.currentTime+duration);}catch(e){}}
  $('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').textContent='♫ Sound: '+(sound?'On':'Off');if(sound)beep(600,.09);};
  $('newTipBtn').onclick=()=>{$('tipText').textContent=tips[Math.floor(Math.random()*tips.length)];};
  function reset(){
    score=0;energy=100;skillCount=0;level=1;multiplier=1;combo=0;frame=0;speed=4;spawn=0;
    player={x:145,y:ground-48,w:34,h:48,vy:0,grounded:true,flash:0};items=[];particles=[];clouds=[];
    for(let i=0;i<9;i++)clouds.push({x:i*145+Math.random()*80,y:40+Math.random()*150,s:.5+Math.random()*.7});
    updateHud();$('level').textContent='01';$('startOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');
    state='playing';$('pauseBtn').disabled=false;$('pauseBtn').textContent='Ⅱ PAUSE';lastTime=0;requestAnimationFrame(loop);
  }
  function updateHud(){$('score').textContent=String(Math.floor(score)).padStart(4,'0');$('energy').textContent=Math.max(0,Math.round(energy))+'%';$('skills').textContent=skillCount;$('multiplier').textContent='x'+multiplier;}
  function spawnItem(){
    const bad=Math.random()<.31;
    const kind=bad?'bad':['ai','blog','focus'][Math.floor(Math.random()*3)];
    const y=bad?ground-42-Math.random()*115:ground-30-Math.random()*125;
    items.push({x:W+20,y,w:bad?34:27,h:bad?34:27,kind,spin:Math.random()*6.2,phase:Math.random()*7});
  }
  function burst(x,y,color,count=12){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.8)*5,life:30+Math.random()*20,color,size:2+Math.random()*3});}
  function jump(){if(state!=='playing')return;if(player.grounded){player.vy=-13.3;player.grounded=false;beep(300,.06);}}
  function move(dx){if(state==='playing')player.x=Math.max(35,Math.min(W-70,player.x+dx));}
  function togglePause(){if(state==='playing'){state='paused';$('pauseOverlay').classList.remove('hidden');$('pauseBtn').textContent='▶ RESUME';}else if(state==='paused'){state='playing';$('pauseOverlay').classList.add('hidden');$('pauseBtn').textContent='Ⅱ PAUSE';lastTime=0;requestAnimationFrame(loop);}}
  $('startBtn').onclick=reset;$('againBtn').onclick=reset;$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=togglePause;
  $('leftBtn').addEventListener('pointerdown',e=>{e.preventDefault();touch.left=true;});$('rightBtn').addEventListener('pointerdown',e=>{e.preventDefault();touch.right=true;});$('jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
  for(const id of ['leftBtn','rightBtn'])$(id).addEventListener('pointerup',()=>{touch[id==='leftBtn'?'left':'right']=false;});
  for(const id of ['leftBtn','rightBtn'])$(id).addEventListener('pointerleave',()=>{touch[id==='leftBtn'?'left':'right']=false;});
  window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','ArrowUp'].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key===' '||e.key==='ArrowUp'||e.key.toLowerCase()==='w')jump();if(e.key.toLowerCase()==='p'&&state!=='ready'&&state!=='over')togglePause();if(state==='ready'&&e.key==='Enter')reset();});
  window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
  $('shareBtn').onclick=async()=>{
    const r=rankFor(xp);
    const text=`I scored ${Math.floor(score)} in Profit Reads Online Empire and collected ${skillCount} digital skills! My empire rank: ${r.name}. Can you beat my run? Play here: ${location.href}`;
    if(navigator.share){try{await navigator.share({title:'My Online Empire run',text,url:location.href});}catch(e){}}
    else if(navigator.clipboard){try{await navigator.clipboard.writeText(text);toast('Result copied — share it with your friends!');}catch(e){toast(text);}}
    else toast(text);
  };
  function roundedRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function background(){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#151534');g.addColorStop(1,'#101024');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();for(let i=0;i<65;i++){const x=(i*137+frame*.12)%W,y=(i*71)%330;ctx.globalAlpha=.15+((i%4)*.08);ctx.fillStyle=i%5===0?'#c9ff56':'#aaa8ff';ctx.fillRect(x,y,2,2);}ctx.restore();
    // distant digital skyline
    for(let i=0;i<14;i++){const x=i*78-(frame*.45%78),h=55+(i*31%90);ctx.fillStyle='#222247';ctx.fillRect(x,ground-h,54,h);ctx.fillStyle='#48416d';for(let wy=ground-h+12;wy<ground-8;wy+=15)for(let wx=x+9;wx<x+48;wx+=13)if((wx+wy+i)%3!==0){ctx.globalAlpha=.5;ctx.fillRect(wx,wy,4,5);ctx.globalAlpha=1;}}
    clouds.forEach(c=>{c.x-=speed*.13*c.s;if(c.x<-80)c.x=W+50;ctx.globalAlpha=.2;ctx.fillStyle='#8b83c9';ctx.beginPath();ctx.ellipse(c.x,c.y,38*c.s,10*c.s,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
    ctx.fillStyle='#252548';ctx.fillRect(0,ground,W,H-ground);
    ctx.fillStyle='#c9ff56';ctx.fillRect(0,ground,W,3);
    ctx.strokeStyle='#4c4a72';ctx.lineWidth=1;ctx.setLineDash([22,20]);ctx.beginPath();ctx.moveTo(0,ground+35);ctx.lineTo(W,ground+35);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<13;i++){let x=(i*95-(frame*speed*1.5)%95);ctx.fillStyle='#39385d';ctx.fillRect(x,ground+54,42,3);}
  }
  function drawPlayer(){
    const p=player;ctx.save();ctx.translate(p.x,p.y);
    // shadow
    ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(18,50,22,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // jet trail
    if(state==='playing'&&frame%3!==0){ctx.fillStyle='#ff68b4';ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,28);ctx.lineTo(-14-Math.random()*8,22);ctx.lineTo(0,34);ctx.fill();ctx.globalAlpha=1;}
    // legs and body
    ctx.fillStyle='#c9ff56';ctx.beginPath();ctx.roundRect(7,25,22,21,7);ctx.fill();
    ctx.fillStyle='#f7f4ff';ctx.beginPath();ctx.roundRect(10,2,23,25,8);ctx.fill();
    ctx.fillStyle='#252344';ctx.beginPath();ctx.roundRect(15,9,15,9,4);ctx.fill();
    ctx.fillStyle='#65e8ff';ctx.fillRect(18,12,4,3);ctx.fillRect(25,12,3,3);
    ctx.fillStyle='#ff68b4';ctx.fillRect(4,31,9,5);ctx.fillRect(24,31,8,5);
    ctx.fillStyle='#c9ff56';ctx.fillRect(9,43,7,6);ctx.fillRect(23,43,7,6);
    ctx.restore();
  }
  function drawItems(){
    items.forEach(it=>{ctx.save();ctx.translate(it.x+it.w/2,it.y+it.h/2);ctx.rotate(Math.sin(frame*.06+it.spin)*.12);
      if(it.kind==='bad'){ctx.shadowBlur=15;ctx.shadowColor='#ff68b4';ctx.fillStyle='#ff68b4';ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#40163b';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,1);ctx.strokeStyle='#ffc1e1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.stroke();}
      else{const color=it.kind==='ai'?'#65e8ff':it.kind==='blog'?'#c9ff56':'#b69cff';ctx.shadowBlur=18;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2===0?16:11;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#15152b';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(it.kind==='ai'?'A':it.kind==='blog'?'B':'F',0,1);}
      ctx.restore();});
  }
  function drawParticles(){particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/45);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);ctx.globalAlpha=1;});}
  function draw(){
    background();drawItems();drawParticles();drawPlayer();
    if(state==='ready'){ctx.fillStyle='#aaa9cb';ctx.font='12px "DM Mono",monospace';ctx.textAlign='right';ctx.fillText('COLLECT SKILLS  ✦   AVOID DISTRACTIONS  !',W-24,30);}
    if(state==='playing'){ctx.fillStyle='#c9ff56';ctx.font='bold 12px "DM Mono",monospace';ctx.textAlign='left';ctx.fillText('STAY FOCUSED // BUILD YOUR FUTURE',22,30);}
  }
  function finish(){
    state='over';$('pauseBtn').disabled=true;$('endOverlay').classList.remove('hidden');
    const r=rankFor(xp);$('finalScore').textContent=Math.floor(score);$('finalSkills').textContent=skillCount;$('finalRank').textContent=r.name;
    const isBest=score>best;if(isBest){best=Math.floor(score);localStorage.setItem('prEmpireBest',best);$('bestScore').textContent=String(best).padStart(4,'0');}
    $('endKicker').textContent=isBest?'NEW PERSONAL BEST!':'RUN COMPLETE';
    $('endTitle').textContent=isBest?'You just levelled up!':score>700?'Empire energy!':'Every run builds skill.';
    $('endText').textContent=isBest?'Your best run yet. Screenshot it and challenge a friend.':'Can you beat '+Math.floor(score)+' points? Try a new route and keep collecting skills.';
    $('endIcon').textContent=isBest?'🏆':score>700?'🚀':'⚡';beep(isBest?850:500,.18,'triangle');updateProgress();
  }
  function loop(ts){
    if(state!=='playing'){draw();return;}
    if(!lastTime)lastTime=ts;const dt=Math.min((ts-lastTime)/16.67,2);lastTime=ts;frame+=dt;
    if(keys['arrowleft']||keys.a||touch.left)player.x-=5.1*dt;
    if(keys['arrowright']||keys.d||touch.right)player.x+=5.1*dt;
    player.x=Math.max(25,Math.min(W-player.w-15,player.x));
    player.vy+=.68*dt;player.y+=player.vy*dt;if(player.y+player.h>=ground){player.y=ground-player.h;player.vy=0;player.grounded=true;}
    if(player.flash>0)player.flash-=dt;
    speed=4+Math.min(level*.32,3);spawn-=dt;if(spawn<=0){spawnItem();spawn=35+Math.random()*30-level*1.5;if(spawn<17)spawn=17;}
    items.forEach(it=>{it.x-=speed*dt;it.phase+=.08*dt;it.y+=it.kind==='bad'?Math.sin(it.phase)*.25*dt:Math.sin(it.phase)*.15*dt;
      const hit=player.x<it.x+it.w-5&&player.x+player.w>it.x+5&&player.y<it.y+it.h-5&&player.y+player.h>it.y+5;
      if(hit&&!it.hit){it.hit=true;if(it.kind==='bad'){energy-=22;combo=0;multiplier=1;player.flash=12;burst(it.x,it.y,'#ff68b4',16);beep(140,.12,'sawtooth');toast('Distraction hit! Refocus and keep going.');}
      else{skillCount++;combo++;multiplier=Math.min(5,1+Math.floor(combo/4));const gain=100*multiplier;score+=gain;xp+=Math.round(12*multiplier);localStorage.setItem('prEmpireXP',xp);burst(it.x,it.y,it.kind==='ai'?'#65e8ff':it.kind==='blog'?'#c9ff56':'#b69cff',18);beep(500+multiplier*80,.07);toast(['Skill collected! +'+gain,'Nice focus! +'+gain,'Empire growing! +'+gain][Math.floor(Math.random()*3)]);updateProgress();}}
    });
    items=items.filter(it=>it.x>-60&&!it.hit);
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.12*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);
    score+=.42*dt;energy-=.014*dt;level=1+Math.floor(score/450);$('level').textContent=String(level).padStart(2,'0');updateHud();
    if(energy<=0){energy=0;updateHud();finish();draw();return;}
    draw();requestAnimationFrame(loop);
  }
  // Initial static frame, and a responsive high-DPI canvas without changing game coordinates.
  function fitCanvas(){const rect=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==W*dpr||canvas.height!==H*dpr){canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}draw();}
  window.addEventListener('resize',fitCanvas);fitCanvas();
  // Pause when the player switches tabs so the run stays fair.
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();});
})();