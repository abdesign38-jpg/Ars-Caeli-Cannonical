(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const num = id => Number($(id).value);
  const RAW = "https://raw.githubusercontent.com/abdesign38-jpg/Ars-Caeli-Cannonical/main/";

  const repoSources = [
    "04_PHYSICS/ACSPEC-100-Tiempo.md",
    "04_PHYSICS/ACSPEC-101-Vacío.md",
    "04_PHYSICS/ACSPEC-102-Entropía.md",
    "04_PHYSICS/ACSPEC-103-Horizonte.md",
    "04_PHYSICS/ACSPEC-105-Resonancia.md",
    "04_PHYSICS/ACSPEC-106-Presencia.md",
    "04_PHYSICS/ACSPEC-109-Elasticidad_Cognitiva.md",
    "04_PHYSICS/ACSPEC-110-Cristalización.md",
    "04_PHYSICS/ACSPEC-111-Gradiente_Atencional.md",
    "04_PHYSICS/ACSPEC-114-Respiración_Ambiental.md",
    "09_ATLAS/schemas/session.schema.json"
  ];

  const presets = {
    descenso:{dimensions:{inframundo:72,activacion:43,disociacion:26,apertura:28}, field:{pulse:.62,void:62,entropy:26,horizon:36,resonance:50,presence:40,crystallization:54,breath:.105}},
    sesion:{dimensions:{inframundo:53,activacion:31,disociacion:18,apertura:55}, field:{pulse:.48,void:69,entropy:14,horizon:52,resonance:44,presence:50,crystallization:68,breath:.088}},
    retorno:{dimensions:{inframundo:29,activacion:20,disociacion:10,apertura:80}, field:{pulse:.38,void:44,entropy:8,horizon:67,resonance:32,presence:60,crystallization:65,breath:.073}}
  };

  const symbolicFreqs = [
    [174,"Umbral corporal","#ef6c63"],
    [285,"Restitución de estructura","#e3a34f"],
    [396,"Liberación / descenso de carga","#e2c45d"],
    [417,"Cambio de patrón","#edd069"],
    [528,"Coherencia / retorno","#7dcc8d"],
    [639,"Vínculo / integración relacional","#5fcef0"],
    [963,"Apertura / eje superior","#9b64e6"]
  ];

  const S = {
    sessionId:null,
    sessionStartISO:null,
    experimentId:"ACX-0001",
    participantId:"P-0001",
    phase:"descenso",
    field:{...presets.descenso.field},
    running:false,
    startedAt:0,
    elapsedBefore:0,
    timer:null,
    ctx:null, master:null, analyser:null,
    oscA:null, oscB:null, gainA:null, gainB:null,
    delay:null, feedback:null, filter:null, panA:null, panB:null,
    lfo:null, lfoGain:null,
    selectedHz:174,
    viz:"torus",
    canonical:{},
    microvoids:[]
  };

  function dimensions(){
    return {
      inframundo:num("#inframundo"),
      activacion:num("#activacion"),
      disociacion:num("#disociacion"),
      apertura:num("#apertura")
    };
  }

  function derived(){
    const d=dimensions();
    const descent=(d.inframundo*.55+d.activacion*.25+d.disociacion*.20);
    const ret=(d.apertura*.62+(100-d.activacion)*.20+(100-d.disociacion)*.18);
    return {
      descent:+descent.toFixed(1),
      return:+ret.toFixed(1),
      gradient:+(ret-descent).toFixed(1),
      integration_index:Math.round(clamp(45 + d.apertura*.38 - d.disociacion*.16 - Math.abs(d.activacion-35)*.05,28,96))
    };
  }

  function setVal(id,v){
    const el=$(id); el.value=v; el.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function updateReadouts(){
    const d=dimensions(), x=derived();
    $("#infraOut").textContent=Math.round(d.inframundo);
    $("#actOut").textContent=Math.round(d.activacion);
    $("#disOut").textContent=Math.round(d.disociacion);
    $("#apeOut").textContent=Math.round(d.apertura);
    $("#gradientReadout").textContent=(x.gradient>=0?"+":"")+Math.round(x.gradient);
    $("#coherenceOut").textContent=x.integration_index+"%";
    $("#coherenceBar").style.width=x.integration_index+"%";
    $("#carrierReadout").textContent=S.selectedHz;
    $("#phaseReadout").textContent=S.phase.toUpperCase();
    const dur=num("#duration");
    $("#durationLabel").textContent=dur+" min";
    $("#totalTime").textContent=String(dur).padStart(2,"0")+":00";
    const depths=["Suave","Medio","Profundo"];
    $("#depthLabel").textContent=depths[num("#depth")];
    renderMicrovoidTimeline();
    updateAudio();
  }

  function applyPhase(p){
    if(!presets[p]) return;
    S.phase=p;
    $$(".phase-step").forEach(b=>b.classList.toggle("active",b.dataset.phase===p));
    const d=presets[p].dimensions;
    ["inframundo","activacion","disociacion","apertura"].forEach(k=>{ $("#"+k).value=d[k]; });
    S.field={...presets[p].field};
    updateReadouts();
  }

  function renderFrequencies(){
    const root=$("#frequencyList");
    root.innerHTML="";
    symbolicFreqs.forEach(([hz,label,color],idx)=>{
      const row=document.createElement("button");
      row.className="freq-row";
      row.style.cssText="width:100%;border:0;background:transparent;text-align:left;color:inherit;cursor:pointer";
      row.innerHTML=`
        <i class="freq-dot" style="color:${color};background:${color}"></i>
        <span class="freq-hz">${hz} Hz</span>
        <span class="freq-label">${label}</span>
        <canvas class="freq-wave" width="110" height="20"></canvas>`;
      row.addEventListener("click",()=>{S.selectedHz=hz;$("#carrierReadout").textContent=hz;updateAudio();});
      root.appendChild(row);
      const c=row.querySelector("canvas"),cx=c.getContext("2d");
      cx.strokeStyle=color;cx.lineWidth=1.3;cx.beginPath();
      for(let x=0;x<c.width;x++){
        const y=c.height/2 + Math.sin((x/9)+(idx*.8))*2.7 + Math.sin(x/21)*1.4;
        x?cx.lineTo(x,y):cx.moveTo(x,y);
      }
      cx.stroke();
    });
  }

  function audioStart(){
    if(S.running) return;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    S.ctx=new AC();
    const ctx=S.ctx;

    S.master=ctx.createGain(); S.master.gain.value=0;
    S.analyser=ctx.createAnalyser(); S.analyser.fftSize=1024; S.analyser.smoothingTimeConstant=.82;
    S.filter=ctx.createBiquadFilter(); S.filter.type="lowpass";
    S.delay=ctx.createDelay(1); S.feedback=ctx.createGain();
    S.oscA=ctx.createOscillator();S.oscB=ctx.createOscillator();
    S.gainA=ctx.createGain();S.gainB=ctx.createGain();
    S.panA=ctx.createStereoPanner();S.panB=ctx.createStereoPanner();
    S.lfo=ctx.createOscillator();S.lfoGain=ctx.createGain();

    S.oscA.type="sine";S.oscB.type="triangle";
    S.oscA.connect(S.gainA).connect(S.panA).connect(S.filter);
    S.oscB.connect(S.gainB).connect(S.panB).connect(S.filter);
    S.filter.connect(S.analyser);
    S.filter.connect(S.delay).connect(S.feedback).connect(S.delay);
    S.delay.connect(S.analyser);
    S.analyser.connect(S.master).connect(ctx.destination);
    S.lfo.connect(S.lfoGain).connect(S.gainA.gain);

    [S.oscA,S.oscB,S.lfo].forEach(o=>o.start());
    S.running=true;S.startedAt=performance.now();
    $("#playBtn").textContent="Ⅱ";
    updateAudio();
    S.timer=setInterval(updateTimer,250);
  }

  function audioStop(){
    if(!S.running) return;
    S.elapsedBefore += performance.now()-S.startedAt;
    const ctx=S.ctx;
    try{
      S.master.gain.cancelScheduledValues(ctx.currentTime);
      S.master.gain.setTargetAtTime(0,ctx.currentTime,.15);
      setTimeout(()=>ctx.close().catch(()=>{}),600);
    }catch(_){}
    S.running=false;S.ctx=null;$("#playBtn").textContent="▶";
    clearInterval(S.timer);S.timer=null;
  }

  function updateAudio(){
    if(!S.running||!S.ctx) return;
    const d=dimensions(), f=S.field, t=S.ctx.currentTime;
    const depth=num("#depth");
    const base=clamp(S.selectedHz*(1-d.inframundo*.0017+d.activacion*.0007),60,1000);
    S.oscA.frequency.setTargetAtTime(base,t,.16);
    S.oscB.frequency.setTargetAtTime(base*2,t,.16);
    S.gainA.gain.setTargetAtTime(.24,t,.18);
    S.gainB.gain.setTargetAtTime(.035+(d.apertura/100)*.08,t,.18);
    const width=clamp(.16+(f.horizon/100)*.72,0,.9);
    S.panA.pan.setTargetAtTime(-width,t,.18);S.panB.pan.setTargetAtTime(width,t,.18);
    S.delay.delayTime.setTargetAtTime(.06+(f.void/100)*.42,t,.18);
    S.feedback.gain.setTargetAtTime(clamp(f.resonance/100,0,.55),t,.18);
    S.filter.frequency.setTargetAtTime(clamp(650+(100-d.inframundo)*25+d.apertura*10,420,4200),t,.18);
    S.filter.Q.setTargetAtTime(1+(f.crystallization/100)*7,t,.18);
    S.lfo.frequency.setTargetAtTime(f.pulse,t,.18);
    S.lfoGain.gain.setTargetAtTime(.035+d.activacion/100*.10,t,.18);
    S.master.gain.setTargetAtTime([.025,.035,.045][depth],t,.2);
  }

  function elapsedMs(){ return S.elapsedBefore + (S.running ? performance.now()-S.startedAt : 0); }
  function updateTimer(){
    const total=num("#duration")*60*1000;
    const ms=Math.min(elapsedMs(),total);
    const sec=Math.floor(ms/1000);
    $("#elapsed").textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");
    $("#progressBar").style.width=(ms/total*100)+"%";
    renderMicrovoidTimeline();
    if(ms>=total && S.running) audioStop();
  }
  function createSessionId(){
    const now=new Date();
    const date=now.getUTCFullYear().toString()+String(now.getUTCMonth()+1).padStart(2,"0")+String(now.getUTCDate()).padStart(2,"0");
    const time=String(now.getUTCHours()).padStart(2,"0")+String(now.getUTCMinutes()).padStart(2,"0")+String(now.getUTCSeconds()).padStart(2,"0");
    const random=crypto.getRandomValues(new Uint32Array(1))[0].toString(16).slice(0,6).toUpperCase();
    return `ACS-${date}-${time}-${random}`;
  }
  function ensureSession(){
    if(!S.sessionId){S.sessionId=createSessionId();S.sessionStartISO=new Date().toISOString();S.microvoids=[];}
  }
  function notesStorageKey(){return `arscaeli_soundfield_notes_${S.sessionId}`}
  function loadNotes(){
    if(!S.sessionId)return [];
    try{return JSON.parse(localStorage.getItem(notesStorageKey())||"[]")}catch(_){return[]}
  }
  function registerMicrovoid(){
    ensureSession();
    const x=derived();
    const event={id:crypto.randomUUID(),timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase:S.phase,dimensions:dimensions(),integration_index:x.integration_index,gradient:x.gradient,source:"manual"};
    S.microvoids.push(event);renderMicrovoidTimeline();flash("Microvacío registrado.");
    const timeline=$("#microvoidTimeline");timeline.classList.remove("microvoid-pulse");void timeline.offsetWidth;timeline.classList.add("microvoid-pulse");
  }
  function renderMicrovoidTimeline(){
    const root=$("#microvoidEvents"),count=$("#microvoidCount"),progress=$("#timelineProgress");
    if(!root||!count)return;
    const total=Math.max(num("#duration")*60,1),elapsed=Math.min(elapsedMs()/1000,total);
    progress.style.width=(elapsed/total*100)+"%";
    count.textContent=`${S.microvoids.length} evento${S.microvoids.length===1?"":"s"}`;
    root.innerHTML=S.microvoids.map(event=>{const left=clamp(event.timestamp_s/total*100,1,99);return `<span class="microvoid-marker" data-phase="${escapeHtml(event.phase)}" style="left:${left}%" title="${escapeHtml(event.phase)} · ${event.timestamp_s}s"></span>`}).join("");
  }
  function resetSession(){
    audioStop();S.elapsedBefore=0;$("#elapsed").textContent="00:00";$("#progressBar").style.width="0%";applyPhase("descenso");renderMicrovoidTimeline();flash("Campo reiniciado; sesión conservada.");
  }
  function newSession(){
    audioStop();S.sessionId=createSessionId();S.sessionStartISO=new Date().toISOString();S.elapsedBefore=0;S.microvoids=[];S.phase="descenso";$("#elapsed").textContent="00:00";$("#progressBar").style.width="0%";applyPhase("descenso");flash("Nueva sesión iniciada.");
  }

  function sessionObject(){
    ensureSession();
    const x=derived();
    return {
      session_id:S.sessionId,
      experiment_id:S.experimentId,
      participant_id:S.participantId,
      engine:"AEON Sound Field",
      engine_version:"0.3.1",
      date:S.sessionStartISO,
      duration_real_s:+(elapsedMs()/1000).toFixed(2),
      context:{
        phase:S.phase,
        intention:$("#intention").value.trim()||null,
        construct:$("#constructSelect").value,
        output:document.querySelector(".seg.active")?.dataset.output||"headphones",
        epistemic_boundary:"symbolic_and_experimental_mappings_not_medical_claims"
      },
      parameters:{
        dimensions:dimensions(),
        derived_profile:x,
        selected_symbolic_frequency_hz:S.selectedHz,
        field:S.field,
        depth:["soft","medium","deep"][num("#depth")],
        planned_duration_min:num("#duration")
      },
      events:{microvoids:S.microvoids},
      observations:loadNotes(),
      interpretations:{experimental:null,symbolic:null},
      safety:{
        low_output:true,
        stop_control_available:true,
        no_medical_claim:true,
        master_output_cap:0.10
      },
      microvoid_definition:"User-registered operational event within the Ars Caeli session model; not a physiological measurement.",
      completeness:"partial"
    };
  }

  function downloadJSON(obj,name){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function saveLocal(){
    const record=sessionObject();
    const arr=JSON.parse(localStorage.getItem("arscaeli_soundfield_sessions")||"[]");
    arr.push(record);localStorage.setItem("arscaeli_soundfield_sessions",JSON.stringify(arr));
    flash("Sesión guardada localmente.");
  }
  function saveProfile(){
    localStorage.setItem("arscaeli_soundfield_profile",JSON.stringify({
      intention:$("#intention").value,
      dimensions:dimensions(),
      duration:num("#duration"),
      depth:num("#depth")
      ,experimentId:S.experimentId
      ,participantId:S.participantId
    }));
    flash("Perfil guardado.");
  }
  function loadProfile(){
    try{
      const p=JSON.parse(localStorage.getItem("arscaeli_soundfield_profile")||"null");
      if(!p)return;
      $("#intention").value=p.intention||"";
      if(p.dimensions) Object.entries(p.dimensions).forEach(([k,v])=>$("#"+k).value=v);
      if(p.duration)$("#duration").value=p.duration;
      if(p.depth!=null)$("#depth").value=p.depth;
      S.experimentId=p.experimentId||S.experimentId;
      S.participantId=p.participantId||S.participantId;
      updateReadouts();
    }catch(_){}
  }
  let toastTimer;
  function flash(msg){
    let el=$("#toast");
    if(!el){el=document.createElement("div");el.id="toast";el.style.cssText="position:fixed;left:50%;bottom:54px;z-index:80;transform:translateX(-50%);padding:10px 14px;border:1px solid rgba(225,186,115,.45);background:#071019;color:#e5d3a5;border-radius:8px;font:10px ui-monospace;letter-spacing:.06em;box-shadow:0 12px 40px rgba(0,0,0,.4)";document.body.appendChild(el)}
    el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2200);
  }

  function openDrawer(type){
    const drawer=$("#drawer"), content=$("#drawerContent");
    const eyebrow=$("#drawerEyebrow"), title=$("#drawerTitle");
    if(type==="sesion"){
      eyebrow.textContent="SESION";title.textContent="Registro de sesión";
      const notes=loadNotes();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card"><h3>Intención</h3><p>${escapeHtml($("#intention").value||"Sin intención registrada.")}</p></div>
          <div class="drawer-card"><h3>Estado actual</h3><p>Sesión: ${escapeHtml(S.sessionId)}<br>Fase: ${S.phase}<br>Gradiente: ${derived().gradient}<br>Índice de integración: ${derived().integration_index}%</p></div>
          <div class="drawer-card full"><h3>Identificación ATLAS</h3><label class="drawer-label" for="experimentIdInput">Experimento</label><input id="experimentIdInput" value="${escapeHtml(S.experimentId)}"><label class="drawer-label" for="participantIdInput">Participante</label><input id="participantIdInput" value="${escapeHtml(S.participantId)}"><button class="action-btn cyan" id="saveIdsBtn" style="width:100%;margin-top:9px">Guardar identificación</button></div>
          <div class="drawer-card full">
            <h3>Nueva observación</h3>
            <textarea id="noteText" rows="4" placeholder="Describe lo percibido sin interpretarlo todavía."></textarea>
            <button class="action-btn gold" id="addNoteBtn" style="width:100%;margin-top:9px">Guardar observación</button>
          </div>
          <div class="drawer-card full"><h3>Observaciones</h3><div id="notesList">${notes.length?notes.map(n=>`<p>• ${escapeHtml(n.text)} <small>${escapeHtml(n.phase)} · ${escapeHtml(n.at)}</small></p>`).join(""):"<p>Sin observaciones.</p>"}</div></div>
          <div class="drawer-card full"><button class="action-btn gold" id="newSessionBtn" style="width:100%">Nueva sesión</button></div>
        </div>`;
      setTimeout(()=>$("#addNoteBtn")?.addEventListener("click",()=>{
        const text=$("#noteText").value.trim();if(!text)return;
        ensureSession();const arr=loadNotes();arr.push({id:crypto.randomUUID(),at:new Date().toISOString(),phase:S.phase,text});localStorage.setItem(notesStorageKey(),JSON.stringify(arr));openDrawer("sesion");
      }),0);
      setTimeout(()=>$("#saveIdsBtn")?.addEventListener("click",()=>{S.experimentId=$("#experimentIdInput").value.trim()||"ACX-0001";S.participantId=$("#participantIdInput").value.trim()||"P-0001";saveProfile();openDrawer("sesion");}),0);
      setTimeout(()=>$("#newSessionBtn")?.addEventListener("click",()=>{newSession();openDrawer("sesion")}),0);
    }else if(type==="biblioteca"){
      eyebrow.textContent="BIBLIOTECA";title.textContent="Canon y correspondencias";
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card full"><h3>Frontera epistemológica</h3>
            <p>Los documentos del repositorio son la fuente documental. Los mapeos de esta interfaz son experimentales. Las frecuencias se presentan como correspondencias simbólicas internas de Ars Caeli, no como afirmaciones clínicas.</p>
          </div>
          <div class="drawer-card"><h3>Fuente local</h3><p>metodo_alquimico_base.json</p></div>
          <div class="drawer-card"><h3>Repositorio</h3><p>Ars-Caeli-Cannonical / main</p></div>
          <div class="drawer-card full"><h3>Fuentes sincronizadas</h3><div id="repoList">${repoSources.map(p=>`<div class="repo-source"><i class="${S.canonical[p]?"ok":""}"></i>${escapeHtml(p)}</div>`).join("")}</div>
          <button class="action-btn cyan" id="syncRepoBtn" style="width:100%;margin-top:12px">Sincronizar repositorio</button></div>
        </div>`;
      setTimeout(()=>$("#syncRepoBtn")?.addEventListener("click",syncRepo),0);
    }else if(type==="atlas"){
      eyebrow.textContent="ATLAS";title.textContent="Memoria de sesión";
      const rec=sessionObject();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card full"><h3>Vista previa JSON</h3><pre style="white-space:pre-wrap;color:#94a5b8;font:9px/1.5 ui-monospace;max-height:420px;overflow:auto">${escapeHtml(JSON.stringify(rec,null,2))}</pre></div>
          <div class="drawer-card full"><button class="action-btn cyan" id="downloadAtlasBtn" style="width:100%">Descargar JSON ATLAS</button></div>
        </div>`;
      setTimeout(()=>$("#downloadAtlasBtn")?.addEventListener("click",()=>downloadJSON(rec,rec.session_id+"_AEON_v0.3.1.json")),0);
    }else if(type==="descenso"||type==="retorno"){
      applyPhase(type==="descenso"?"descenso":"retorno");
      eyebrow.textContent=type.toUpperCase();title.textContent=type==="descenso"?"Perfil de descenso":"Perfil de retorno";
      const d=dimensions(),x=derived();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card"><h3>Inframundo</h3><p>${d.inframundo}/100</p></div>
          <div class="drawer-card"><h3>Apertura</h3><p>${d.apertura}/100</p></div>
          <div class="drawer-card"><h3>Gradiente</h3><p>${x.gradient}</p></div>
          <div class="drawer-card"><h3>Índice de integración</h3><p>${x.integration_index}%</p></div>
          <div class="drawer-card full"><h3>Lectura de interfaz</h3><p>Esta vista organiza la trayectoria de la sesión. Describe un estado operativo del sistema; no diagnostica una condición clínica.</p></div>
        </div>`;
    }else{
      eyebrow.textContent="INICIO";title.textContent="AEON Sound Field";
      content.innerHTML=`<div class="drawer-card"><h3>v0.3</h3><p>Interfaz de sesión orientada a descenso, transformación y retorno, con registro local y exportación ATLAS.</p></div>`;
    }
    drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");
  }

  async function syncRepo(){
    $("#repoStatus").textContent="SYNC…";let ok=0;
    for(const p of repoSources){
      try{
        const r=await fetch(RAW+encodeURI(p),{cache:"no-store"});if(!r.ok)throw Error(r.status);
        S.canonical[p]=await r.text();ok++;
      }catch(_){}
    }
    $("#repoDot").classList.toggle("online",ok>0);
    $("#repoStatus").textContent=ok?`REPO ${ok}/${repoSources.length}`:"LOCAL";
    flash(ok?`Repositorio sincronizado: ${ok}/${repoSources.length}`:"No se pudo sincronizar. Se mantiene modo local.");
    if($("#drawer").classList.contains("open") && $("#drawerEyebrow").textContent==="BIBLIOTECA") openDrawer("biblioteca");
  }

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  // Main field canvas
  const fc=$("#fieldCanvas"), fcx=fc.getContext("2d");
  const lc=$("#leftBrain"), lcx=lc.getContext("2d");
  const rc=$("#rightBrain"), rcx=rc.getContext("2d");
  const mc=$("#miniViz"), mcx=mc.getContext("2d");
  let anim=0;

  function fit(c){
    const dpr=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    const w=Math.floor(r.width*dpr),h=Math.floor(r.height*dpr);
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    const x=c.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);
  }

  function drawField(){
    fit(fc);const W=fc.clientWidth,H=fc.clientHeight,cx=fcx,d=dimensions(),x=derived();
    cx.clearRect(0,0,W,H);anim+=.006;
    const X=W/2,Y=H/2,R=Math.min(W,H)*.34;
    const gold="rgba(225,186,115,",cyan="rgba(102,215,241,",vio="rgba(160,112,247,";

    // aura
    const g=cx.createRadialGradient(X,Y,R*.05,X,Y,R*1.15);
    g.addColorStop(0,"rgba(103,189,206,.09)");g.addColorStop(.45,"rgba(45,84,164,.05)");g.addColorStop(1,"rgba(0,0,0,0)");
    cx.fillStyle=g;cx.fillRect(0,0,W,H);

    // concentric mandala rings
    for(let i=1;i<=7;i++){
      const rr=R*(.28+i*.105);
      cx.strokeStyle=i===7?gold+".58)":gold+(0.07+i*.022)+")";cx.lineWidth=i===7?1.5:1;
      cx.beginPath();cx.arc(X,Y,rr,0,Math.PI*2);cx.stroke();
    }

    // rotating polygons
    for(let ring=0;ring<4;ring++){
      const pts=6+ring*2, rr=R*(.34+ring*.13), rot=anim*(ring%2?1:-1)*(1+ring*.15);
      cx.strokeStyle=ring%2?cyan+".18)":vio+".16)";cx.lineWidth=1;cx.beginPath();
      for(let i=0;i<=pts;i++){
        const a=rot+i/pts*Math.PI*2,px=X+Math.cos(a)*rr,py=Y+Math.sin(a)*rr;
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }
      cx.stroke();
    }

    // torus curves
    for(let j=0;j<22;j++){
      const off=(j-10.5)/10.5, alpha=.035+(1-Math.abs(off))*.035;
      cx.strokeStyle=cyan+alpha+")";cx.beginPath();
      for(let i=0;i<=140;i++){
        const t=i/140*Math.PI*2;
        const px=X+Math.cos(t)*R*(.77+off*.12);
        const py=Y+Math.sin(t)*R*.48 + Math.sin(t*2+anim*8+j)*R*.045*off;
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }cx.stroke();
    }

    // left/right energy
    const leftAmp=.25+d.inframundo/100*.75,rightAmp=.25+d.apertura/100*.75;
    for(const side of [-1,1]){
      cx.strokeStyle=side<0?vio+".48)":cyan+".55)";cx.lineWidth=1.2;cx.beginPath();
      for(let i=0;i<=100;i++){
        const t=i/100, px=X+side*(R*.2+t*R*.92);
        const amp=(side<0?leftAmp:rightAmp);
        const py=Y+Math.sin(t*13+anim*18)*R*.07*amp*Math.sin(t*Math.PI);
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }cx.stroke();
    }

    // descent-return arc
    cx.strokeStyle=gold+".72)";cx.lineWidth=1.6;cx.beginPath();
    cx.arc(X,Y,R*.93,Math.PI*.93,Math.PI*2.07);cx.stroke();

    // waypoints
    [Math.PI,Math.PI*1.5,Math.PI*2].forEach((a,i)=>{
      const px=X+Math.cos(a)*R*.93,py=Y+Math.sin(a)*R*.93;
      cx.fillStyle=gold+(i===1?".85)":".58)");cx.beginPath();cx.arc(px,py,5+i*2,0,Math.PI*2);cx.fill();
    });

    // central vesica/presence
    cx.strokeStyle="rgba(138,180,223,.21)";cx.lineWidth=1;
    for(let i=0;i<10;i++){
      const rr=R*(.15+i*.033),sx=Math.sin(anim*4+i)*R*.012;
      cx.beginPath();cx.ellipse(X+sx,Y,rr*.62,rr,0,0,Math.PI*2);cx.stroke();
    }

    // subtle particles
    for(let i=0;i<70;i++){
      const a=i*2.399+anim*.6,r=R*(.2+(i%17)/17*.95);
      const px=X+Math.cos(a)*r,py=Y+Math.sin(a)*r;
      cx.fillStyle=i%7===0?gold+".25)":cyan+".13)";cx.fillRect(px,py,1,1);
    }

    requestAnimationFrame(drawField);
  }

  function drawBrain(ctx,canvas,color,phaseShift){
    fit(canvas);const W=canvas.clientWidth,H=canvas.clientHeight;ctx.clearRect(0,0,W,H);
    const X=W/2,Y=H*.5,R=Math.min(W*.28,H*.36);
    ctx.strokeStyle=color;ctx.lineWidth=1;
    for(let k=0;k<8;k++){
      ctx.beginPath();
      for(let i=0;i<=80;i++){
        const t=i/80*Math.PI*2;
        const rr=R*(.55+k*.055);
        const px=X+Math.cos(t)*rr*(1+.08*Math.sin(t*3+k));
        const py=Y+Math.sin(t)*rr*.72*(1+.05*Math.cos(t*4+k));
        i?ctx.lineTo(px,py):ctx.moveTo(px,py);
      }ctx.stroke();
    }
    ctx.beginPath();
    for(let i=0;i<=W;i++){
      const y=Y+Math.sin(i*.08+anim*20+phaseShift)*5*Math.sin(i/W*Math.PI);
      i?ctx.lineTo(i,y):ctx.moveTo(i,y);
    }ctx.stroke();
  }

  function drawMini(){
    fit(mc);const W=mc.clientWidth,H=mc.clientHeight;mcx.clearRect(0,0,W,H);
    const X=W/2,Y=H/2;
    if(S.viz==="torus"){
      for(let i=0;i<18;i++){
        const rr=20+i*3.5;
        mcx.strokeStyle=`rgba(${110+i*2},${95+i*3},230,${.05+i*.012})`;
        mcx.beginPath();mcx.ellipse(X,Y,rr*2.15,rr*.85,0,0,Math.PI*2);mcx.stroke();
      }
      mcx.strokeStyle="rgba(170,100,250,.8)";mcx.beginPath();mcx.moveTo(X,10);mcx.lineTo(X,H-10);mcx.stroke();
    }else if(S.viz==="waves"){
      ["#66d7f1","#a070f7","#e1ba73"].forEach((c,j)=>{
        mcx.strokeStyle=c;mcx.globalAlpha=.55;mcx.beginPath();
        for(let i=0;i<W;i++){const y=Y+(j-1)*24+Math.sin(i*.04+j+anim*18)*12; i?mcx.lineTo(i,y):mcx.moveTo(i,y)}mcx.stroke();
      });mcx.globalAlpha=1;
    }else if(S.viz==="spectrum"){
      for(let i=0;i<48;i++){
        const h=(.25+.75*Math.abs(Math.sin(i*.43+anim*12)))*H*.65;
        mcx.fillStyle=i<16?"rgba(160,112,247,.45)":i<34?"rgba(102,215,241,.45)":"rgba(225,186,115,.45)";
        mcx.fillRect(i/48*W,H-h,W/48-2,h);
      }
    }else{
      const cols=["#e1ba73","#a070f7","#5f8fe8","#66d7f1","#a5cf6e","#e69b54","#ef7467"];
      cols.forEach((c,i)=>{const y=18+i*(H-36)/6;mcx.fillStyle=c;mcx.beginPath();mcx.arc(X,y,7,0,Math.PI*2);mcx.fill()});
      mcx.strokeStyle="rgba(225,186,115,.5)";mcx.beginPath();mcx.moveTo(X,10);mcx.lineTo(X,H-10);mcx.stroke();
    }
    requestAnimationFrame(drawMini);
  }

  function animateSide(){
    drawBrain(lcx,lc,"rgba(160,112,247,.50)",0);
    drawBrain(rcx,rc,"rgba(102,215,241,.55)",2.1);
    requestAnimationFrame(animateSide);
  }

  function wire(){
    ["#inframundo","#activacion","#disociacion","#apertura","#duration","#depth"].forEach(id=>$(id).addEventListener("input",updateReadouts));
    $$(".phase-step").forEach(b=>b.addEventListener("click",()=>applyPhase(b.dataset.phase)));
    $$(".seg").forEach(b=>b.addEventListener("click",()=>{$$(".seg").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
    $$(".viz-tab").forEach(b=>b.addEventListener("click",()=>{$$(".viz-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");S.viz=b.dataset.viz}));
    $$(".nav-link").forEach(b=>b.addEventListener("click",()=>{
      $$(".nav-link").forEach(x=>x.classList.remove("active"));b.classList.add("active");
      const v=b.dataset.view;
      if(v==="inicio") openDrawer("inicio");
      else if(v==="sesion") openDrawer("sesion");
      else if(v==="biblioteca") openDrawer("biblioteca");
      else if(v==="atlas") openDrawer("atlas");
      else openDrawer(v);
    }));
    $("#playBtn").addEventListener("click",()=>S.running?audioStop():audioStart());
    $("#prevBtn").addEventListener("click",()=>applyPhase(S.phase==="retorno"?"sesion":"descenso"));
    $("#nextBtn").addEventListener("click",()=>applyPhase(S.phase==="descenso"?"sesion":"retorno"));
    $("#resetBtn").addEventListener("click",resetSession);
    $("#registerMicrovoidBtn").addEventListener("click",registerMicrovoid);
    $("#saveProfileBtn").addEventListener("click",saveProfile);
    $("#saveSessionBtn").addEventListener("click",saveLocal);
    $("#exportAtlasBtn").addEventListener("click",()=>openDrawer("atlas"));
    $("#timerBtn").addEventListener("click",()=>flash("La duración de sesión se controla desde el panel izquierdo."));
    $("#expandVizBtn").addEventListener("click",()=>flash("Visualización expandida reservada para AEON v0.4."));
    $("#closeDrawerBtn").addEventListener("click",()=>{$("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true")});
  }

  async function init(){
    ensureSession();renderFrequencies();wire();loadProfile();updateReadouts();drawField();drawMini();animateSide();
    try{
      const r=await fetch("mappings.json",{cache:"no-store"});if(r.ok){$("#repoDot").classList.add("online");$("#repoStatus").textContent="LOCAL READY"}
    }catch(_){}
  }
  init();
})();
