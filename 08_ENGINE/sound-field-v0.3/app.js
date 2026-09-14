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
  const PHASE_ORDER=["descenso","shadow","light","retorno"];
  const PHASE_FRACTIONS={descenso:.2,shadow:.3,light:.3,retorno:.2};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const lerpObject=(a,b,t)=>Object.fromEntries(Object.keys(b).map(k=>[k,lerp(Number(a[k]??0),Number(b[k]),t)]));
  const midpoint=(a,b)=>({dimensions:lerpObject(a.dimensions,b.dimensions,.5),field:lerpObject(a.field,b.field,.5)});
  const phaseTargets={
    descenso:presets.descenso,
    shadow:midpoint(presets.descenso,presets.sesion),
    light:midpoint(presets.sesion,presets.retorno),
    retorno:presets.retorno
  };
  const constructRegistry={
    presencia:{id:"ACSPEC-106",definition:"Nivel de ocupación sensorial del campo.",fieldKey:"presence",min:0,max:100,step:1,unit:"%",audio:"harmonic B gain/density; supporting stereo occupancy.",visual:"torus line density + particle density."},
    resonancia:{id:"ACSPEC-105",definition:"Persistencia de un patrón en la atención.",fieldKey:"resonance",min:0,max:100,step:1,unit:"%",audio:"delay feedback, capped at 0.55.",visual:"persistence / echo rings."},
    tiempo:{id:"ACSPEC-100",definition:"Relación entre el tiempo físico y el tiempo percibido dentro del ecosistema cognitivo.",fieldKey:"pulse",min:.1,max:12,step:.1,unit:"rate",audio:"None in v0.3.4.4. Audio protocol modulation is controlled separately in Signal sources.",visual:"Field animation cadence / temporal motion.",status:"experimental_noncanonical"},
    vacio:{id:"ACSPEC-101",definition:"Estructura de baja información utilizada para modular expectativa.",fieldKey:"void",min:0,max:100,step:1,unit:"%",audio:"delay time / temporal spacing.",visual:"field sparsity / spacing."},
    entropia:{id:"ACSPEC-102",definition:"Imprevisibilidad controlada del entorno.",fieldKey:"entropy",min:0,max:100,step:1,unit:"%",audio:"none in v0.3.4.4; no reproducible audio mapping is currently defined.",visual:"deterministic geometric irregularity; no random audio jitter."},
    horizonte:{id:"ACSPEC-103",definition:"Profundidad espacial percibida del ecosistema.",fieldKey:"horizon",min:0,max:100,step:1,unit:"%",audio:"stereo width.",visual:"torus horizontal depth/spread."},
    cristalizacion:{id:"ACSPEC-110",definition:"Estabilización prolongada de una interpretación.",fieldKey:"crystallization",min:0,max:100,step:1,unit:"%",audio:"filter Q.",visual:"geometric rigidity; higher values reduce entropy deformation."},
    respiracion:{id:"ACSPEC-114",definition:"Oscilación lenta de la energía perceptiva global.",fieldKey:"breath",min:.03,max:.15,step:.001,unit:"Hz",audio:"slow global gain envelope with depth capped at 4%.",visual:"slow global expansion/contraction."}
  };

  const symbolicFreqs = [
    [174,"Body threshold","#ef6c63"],
    [285,"Structure restoration","#e3a34f"],
    [396,"Release / descent of load","#e2c45d"],
    [417,"Pattern change","#edd069"],
    [528,"Coherence / return","#7dcc8d"],
    [639,"Bond / relational integration","#5fcef0"],
    [963,"Opening / upper axis","#9b64e6"]
  ];
  const methodCarriers = [
    {value:136,label:"136 Hz — grounding / closure",source_layer:"method_base",source_key:"method_136",status:"documented_symbolic_protocol"},
    {value:432,label:"432 Hz — coherence / containment",source_layer:"method_base",source_key:"method_432",status:"documented_symbolic_protocol"},
    {value:528,label:"528 Hz — symbolic reorganization / opening anchor",source_layer:"method_base",source_key:"method_528",status:"documented_symbolic_protocol"},
    {value:900,label:"900 Hz subtle — high-layer clarity; caution",source_layer:"method_base",source_key:"method_900_subtle",status:"documented_symbolic_protocol"}
  ];
  const modulationOptions = [
    {key:"legacy_0_62",source:"legacy_experimental",mode:"manual",hz:.62,label:"Legacy experimental — 0.62 Hz"},
    {key:"delta_soft_2",source:"method_base",mode:"delta_soft",hz:2,label:"Delta-soft — 2 Hz"},
    {key:"theta_4",source:"method_base",mode:"theta",hz:4,label:"Theta — 4 Hz · lower boundary"},
    {key:"theta_6",source:"method_base",mode:"theta",hz:6,label:"Theta — 6 Hz · operational midpoint"},
    {key:"theta_7",source:"method_base",mode:"theta",hz:7,label:"Theta — 7 Hz · upper boundary"},
    {key:"alpha_8",source:"method_base",mode:"alpha",hz:8,label:"Alpha — 8 Hz · lower boundary"},
    {key:"alpha_9",source:"method_base",mode:"alpha",hz:9,label:"Alpha — 9 Hz · operational midpoint"},
    {key:"alpha_10",source:"method_base",mode:"alpha",hz:10,label:"Alpha — 10 Hz · upper boundary"}
  ];
  const cloneSignal=signal=>structuredClone(signal);
  const defaultSignal={carrier:{source:"corpus_wound",key:"wound_174",hz:174},modulation:{source:"legacy_experimental",key:"legacy_0_62",mode:"manual",hz:.62}};
  const methodProtocols={
    inframundo_dominante:{condition:d=>d.inframundo>=35&&d.apertura<30,reading:"Sistema en retención o implosión. Priorizar seguridad y coherencia. No abrir trauma profundo.",sequence:["contención","432 Hz","mano al pecho","micro-apertura opcional","136 Hz"],avoid:["catarsis","frecuencias altas","preguntas invasivas","delta extremo"]},
    activacion_dominante:{condition:d=>d.activacion>=35,reading:"Sistema en alerta mental o defensa simpática. Priorizar exhalación, ritmo y cuerpo.",sequence:["exhalación larga","alpha 8–10 Hz","432 Hz","orientación corporal"],avoid:["900 Hz","estímulos rápidos","interpretación excesiva"]},
    disociacion_dominante:{condition:d=>d.disociacion>=30,reading:"Sistema desconectado o en colapso. Priorizar presencia sensorial suave.",sequence:["orientación al espacio","tacto consciente","alpha suave","136 Hz corto"],avoid:["delta profundo","silencio prolongado","exploración del inframundo"]},
    apertura_suficiente:{condition:d=>d.apertura>=35&&d.inframundo<40,reading:"Hay capacidad de procesar. Abrir con regulación previa y cierre obligatorio.",sequence:["regulación breve","theta suave","palabra consciente","integración corporal","136 Hz"],avoid:["sobreexploración","dejar proceso abierto"]}
  };

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
    ctx:null, master:null, analyser:null, outputGate:null, telemetryAnalyser:null, telemetrySink:null,
    banks:null, activeBank:0,
    oscA:null, oscB:null, gainA:null, gainB:null,
    delay:null, feedback:null, filter:null, panA:null, panB:null,
    lfo:null, lfoGain:null, breathOsc:null, breathGain:null,
    modulationTransitionUntil:0,
    signal:cloneSignal(defaultSignal),
    uiCarrierLibrary:"corpus_wound",
    visual:{raf:null,running:false,lastFrame:0},
    phaseSignalMode:"LOCKED",
    phaseSignalPlan:Object.fromEntries(PHASE_ORDER.map(phase=>[phase,{approved:true,signal:cloneSignal(defaultSignal),status:"READY"}])),
    draftPlan:null,
    viz:"torus",
    canonical:{}, timeData:null, freqData:null,
    microvoids:[], phaseEvents:[], parameterEvents:[], signalEvents:[], planEvents:[], transition:null, manualOverride:null,
    protocol:{
      mode:"FREE", state:"FREE", protocol:null, conditions:new Map(), conditionIndex:0, condition:null,
      integrity:{verified:false,error:null}, audioSnapshot:null, previousSignal:null, conditionAnchorCtxTime:null,
      telemetryData:null, telemetryTimer:null, telemetrySamples:[], telemetrySummary:null, telemetryError:null,
      currentConditionRun:null, contextStateEvents:[], expectedSuspend:false, expectedClose:false,
      run:{id:null,valid:true,invalidReason:null,conditions:[],events:[],calibration_only:false}
    }
  };
  const phaseLabels={descenso:"Descent",shadow:"Shadow",light:"Light",retorno:"Return"};

  function dimensions(){
    return {
      inframundo:num("#inframundo"),
      activacion:num("#activacion"),
      disociacion:num("#disociacion"),
      apertura:num("#apertura")
    };
  }

  function protocolModeActive(){return S.protocol.mode!=="FREE"}
  function protocolRunning(){return S.protocol.state==="CONDITION_RUNNING"}
  function effectiveAudioControlState(){
    if(protocolModeActive()&&S.protocol.audioSnapshot)return S.protocol.audioSnapshot;
    return {dimensions:dimensions(),field:S.field,depth:num("#depth")};
  }
  function protocolConditionTime(){
    if(!S.ctx||S.protocol.conditionAnchorCtxTime==null)return 0;
    return Math.max(0,S.ctx.currentTime-S.protocol.conditionAnchorCtxTime);
  }
  function protocolConditionTimeRaw(){
    if(!S.ctx||S.protocol.conditionAnchorCtxTime==null)return null;
    return S.ctx.currentTime-S.protocol.conditionAnchorCtxTime;
  }
  function protocolTimeLabel(seconds){
    const value=Math.max(0,Number(seconds)||0),minutes=Math.floor(value/60),remaining=(value-minutes*60).toFixed(3);
    return `${String(minutes).padStart(2,"0")}:${String(remaining).padStart(6,"0")}`;
  }
  function protocolUi(){
    const p=S.protocol,condition=p.condition,schedule=condition?.runtime_schedule;
    const set=(id,value)=>{const element=$(id);if(element)element.textContent=value};
    const panel=$("#protocolPanel");if(panel)panel.dataset.telemetrySamples=String(p.telemetrySamples.length);
    set("#protocolMode",p.mode==="FREE"?"Free Field":"Pilot 01");
    set("#protocolIntegrity",p.integrity.verified?"VERIFIED":p.integrity.error?"INVALID":"NOT LOADED");
    set("#protocolId",p.protocol?.protocol_id||"—");
    set("#protocolCondition",condition?`${condition.condition_id} · ${p.conditionIndex+1}/5`:"—");
    set("#protocolSchedule",schedule?`${Number(schedule.active_duration_s).toFixed(1)} active / ${Number(schedule.silent_duration_s).toFixed(1)} silent`:"—");
    set("#protocolScheduledSilence",schedule?`${(Number(schedule.scheduled_silence_ratio)*100).toFixed(0)}%`:"—");
    const displayTime=protocolConditionTime();
    set("#protocolGate",p.state==="PAUSED"?"PAUSED":protocolRunning()?(window.AEONProtocolRuntime?.inGateRampWindow(schedule,displayTime)?"RAMP":window.AEONProtocolRuntime?.scheduledStateAt(schedule,displayTime)||"ACTIVE"):p.state==="PROBE_PENDING"?"SILENT":"—");
    set("#protocolTime",schedule?`${protocolTimeLabel(protocolConditionTime())} / ${protocolTimeLabel(schedule.block_duration_s)}`:"00:00.000 / 01:00.000");
    set("#protocolRms",p.telemetrySamples.length?`${p.telemetrySamples[p.telemetrySamples.length-1].rms_dbfs.toFixed(1)} dBFS`:p.telemetryError?"INVALID":"—");
    set("#protocolMeasuredSilence",p.telemetrySummary?`${(p.telemetrySummary.measured_digital_silence_ratio*100).toFixed(1)}%`:"—");
    set("#protocolState",p.state);
    const error=$("#protocolError");if(error){error.textContent=p.integrity.error||"";error.hidden=!p.integrity.error}
    const notice=$("#protocolNotice");if(notice)notice.hidden=p.state!=="PROBE_PENDING";
    const arm=$("#armProtocolBtn");if(arm){arm.disabled=p.mode!=="FREE"||S.running;arm.setAttribute("aria-disabled",String(arm.disabled))}
    const abort=$("#abortProtocolBtn");if(abort)abort.disabled=p.mode==="FREE"||p.state==="ABORTED";
    ["#inframundo","#activacion","#disociacion","#apertura","#constructSelect","#constructValue","#duration","#depth","#carrierSource","#modulationSelect","#manualModulation","#phaseSignalMode","#resetBtn","#prevBtn","#nextBtn","#timerBtn","#registerMicrovoidBtn"].forEach(selector=>{const element=$(selector);if(element)element.disabled=protocolModeActive()});
    document.body.classList.toggle("protocol-active",protocolModeActive());
  }
  function protocolIntegrityFailure(reason){
    failProtocolCondition(reason?.message||reason,"stimulus_integrity");
  }
  function protocolWatchdog(){
    const p=S.protocol;if(!protocolRunning()||!p.condition||!p.audioSnapshot)return;
    const expected=p.condition.signal,actual=S.signal,controls={dimensions:dimensions(),field:S.field,depth:num("#depth"),listening_context:document.querySelector(".seg.active")?.dataset.output||"headphones"};
    const signalMismatch=JSON.stringify(actual)!==JSON.stringify(expected);
    const snapshotMismatch=JSON.stringify(controls.dimensions)!==JSON.stringify(p.audioSnapshot.dimensions)||JSON.stringify({...controls.field,breath:.073})!==JSON.stringify(p.audioSnapshot.field)||controls.depth!==p.audioSnapshot.depth||controls.listening_context!==p.audioSnapshot.listening_context;
    if(signalMismatch||snapshotMismatch)protocolIntegrityFailure({message:`locked protocol parameter changed (${signalMismatch?"signal":"audio snapshot"})`});
  }
  function protocolAudioSnapshot(){
    const current=effectiveAudioControlState();
    return window.AEONProtocolRuntime.deepFreeze({
      dimensions:structuredClone(current.dimensions),
      field:{...structuredClone(current.field),breath:.073},
      depth:current.depth,
      listening_context:document.querySelector(".seg.active")?.dataset.output||"headphones",
      aeon_master_base_gain:[.025,.035,.045][current.depth]
    });
  }
  async function armProtocol(){
    if(S.running||S.protocol.mode!=="FREE")return;
    const p=S.protocol;p.integrity={verified:false,error:null};p.state="READY";p.run={id:createSessionId(),valid:true,invalidReason:null,conditions:[],events:[],calibration_only:new URLSearchParams(location.search).get("aeon_qa")==="1"};protocolUi();
    try{
      const base="../experimental-protocol-model/v0.1/compiled";
      const artifacts=await window.AEONProtocolRuntime.loadAndVerifyArtifacts(base);
      p.protocol=artifacts.protocol;p.conditions=artifacts.conditions;p.conditionIndex=0;const qaId=new URLSearchParams(location.search).get("aeon_qa")==="1"?$("#protocolQaCondition")?.value:null;p.condition=artifacts.conditions.get(qaId||p.protocol.condition_sequence[0]);
      p.audioSnapshot=protocolAudioSnapshot();p.previousSignal=cloneSignal(S.signal);p.integrity.verified=true;p.mode="ARMED";p.state="READY";
      S.signal=structuredClone(p.condition.signal);protocolUi();updateReadouts();flash("Pilot 01 verified and armed.");
    }catch(error){p.mode="FREE";protocolIntegrityFailure(error);flash(p.integrity.error)}
  }
  function abortProtocol(){
    if(S.protocol.mode==="FREE")return;
    if(S.ctx&&S.running)audioStop();
    const p=S.protocol;p.mode="FREE";p.state="ABORTED";p.condition=null;p.conditionAnchorCtxTime=null;p.conditions=new Map();p.audioSnapshot=null;p.telemetrySamples=[];p.telemetrySummary=null;
    if(S.ctx)closeProtocolContext();
    S.signal=cloneSignal(p.previousSignal||defaultSignal);p.previousSignal=null;protocolUi();updateReadouts();flash("Protocol aborted; Free Field restored.");
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
    $("#carrierReadout").textContent=S.signal.carrier.hz;
    syncPhaseUi();
    const dur=num("#duration");
    $("#durationLabel").textContent=dur+" min";
    $("#totalTime").textContent=String(dur).padStart(2,"0")+":00";
    const depths=["Soft","Medium","Deep"];
    $("#depthLabel").textContent=depths[num("#depth")];
    updateConstructInspector();
    renderMethodGuidance();
    renderPhaseSignalPlan();
    renderMicrovoidTimeline();
    updateAudio();
    updateSignalMonitor();
    requestStaticVisualRefresh();
  }

  function syncPhaseUi(){
    $$(".phase-step").forEach(btn=>{
      const active=btn.dataset.phase===S.phase;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-selected",String(active));
    });
    $("#phaseReadout").textContent=phaseLabels[S.phase].toUpperCase();
    document.body.dataset.phase=S.phase;
  }

  function updateConstructInspector(){
    const select=$("#constructSelect"), inspector=$("#constructInspector");
    if(!select||!inspector)return;
    const c=constructRegistry[select.value], slider=$("#constructValue");
    slider.min=c.min;slider.max=c.max;slider.step=c.step;slider.value=S.field[c.fieldKey];
    $("#constructId").textContent=c.id;$("#constructDefinition").textContent=c.definition;
    $("#constructValueLabel").textContent=`${Number(S.field[c.fieldKey]).toFixed(c.step<.01?3:c.step<1?2:0)} ${c.unit}`;
    $("#constructAudioMap").textContent=c.audio;$("#constructVisualMap").textContent=c.visual;
  }

  function renderMethodGuidance(){
    const d=dimensions(),matches=methodMatchesForDimensions(d);
    const root=$("#methodMatches");if(root)root.innerHTML=`<small>CURRENT STATE MATCHES</small>`+(matches.length?matches.map(([key,protocol])=>`<article><strong>✓ ${key}</strong><small>${protocol.reading}</small><small>Sequence: ${protocol.sequence.join(" · ")}</small><small>Avoid: ${protocol.avoid.join(" · ")}</small></article>`).join(""):"<span>— No documented match</span>");
    const caution=$("#methodCautions");if(caution)caution.textContent=[d.disociacion>=30?"Delta 2 Hz: avoid with high dissociation / deep collapse per Method Base.":"",d.activacion>=70?"900 Hz subtle: avoid with hyperactivation / fragile system per Method Base.":"",d.apertura>=35?"Theta / opening: use prior regulation.":""].filter(Boolean).join(" ")||"No automatic method advisory.";
  }
  function methodMatchesForDimensions(d){return Object.entries(methodProtocols).filter(([,protocol])=>protocol.condition(d))}
  function methodMatchesForPhase(phase){return methodMatchesForDimensions(phaseTargets[phase].dimensions)}
  function useMethodSuggestion(key,phase=S.phase){
    const protocol=methodProtocols[key];if(!protocol)return;
    const carrier=protocol.sequence.includes("432 Hz")?methodCarriers.find(item=>item.source_key==="method_432"):protocol.sequence.includes("136 Hz")?methodCarriers.find(item=>item.source_key==="method_136"):null;
    const modulation=protocol.sequence.some(item=>item.includes("alpha"))?modulationOptions.find(item=>item.key==="alpha_8"):protocol.sequence.some(item=>item.includes("theta"))?modulationOptions.find(item=>item.key==="theta_6"):null;
    const signal=cloneSignal((S.draftPlan?.[phase]||S.phaseSignalPlan[phase]).signal);if(carrier)signal.carrier={source:"method_base",key:carrier.source_key,hz:carrier.value};if(modulation)signal.modulation={source:modulation.source,key:modulation.key,mode:modulation.mode,hz:modulation.hz};
    if(!S.draftPlan)S.draftPlan=structuredClone(S.phaseSignalPlan);
    const before=cloneSignal(S.draftPlan[phase].signal);S.draftPlan[phase]={approved:false,signal,status:"DRAFT"};S.planEvents.push({timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase,from:before,to:signal,mode:S.phaseSignalMode,source:key});
    renderPhaseSignalPlan();
  }
  function renderPhaseSignalPlan(){
    $("#planBadge").textContent=S.phaseSignalMode==="LOCKED"?"LOCKED · SAME SIGNAL THROUGH ALL PHASES":S.phaseSignalMode;
    const phaseIndex=PHASE_ORDER.indexOf(S.phase),next=PHASE_ORDER[Math.min(phaseIndex+1,PHASE_ORDER.length-1)];
    const plan=S.draftPlan&&S.phaseSignalMode!=="LOCKED"?S.draftPlan:S.phaseSignalPlan;
    const currentSignal=plan[S.phase].signal,nextSignal=plan[next].signal;
    $("#planCurrentNext").innerHTML=`CURRENT · ${phaseLabels[S.phase]} · ${currentSignal.carrier.hz} Hz · ${currentSignal.modulation.source} ${currentSignal.modulation.hz} Hz<br>NEXT · ${phaseLabels[next]} · ${nextSignal.carrier.hz} Hz · ${nextSignal.modulation.source} ${nextSignal.modulation.hz} Hz`;
    PHASE_ORDER.forEach(phase=>{
      const target=$("#plan"+phase.charAt(0).toUpperCase()+phase.slice(1));
      const row=plan[phase],signal=row.signal;
      if(!target)return;
      if(S.phaseSignalMode==="LOCKED")target.textContent=`${signal.carrier.hz} Hz · ${signal.modulation.mode} ${signal.modulation.hz} Hz · LOCKED`;
      else target.innerHTML=`<select data-plan-carrier="${phase}">${[...methodCarriers,...symbolicFreqs.map(([value,label])=>({value,label,source_layer:"corpus_wound",source_key:"wound_"+value}))].map(item=>`<option value="${item.source_key}" ${item.source_key===signal.carrier.key?"selected":""}>${item.value} Hz · ${item.source_key}</option>`).join("")}</select><select data-plan-modulation="${phase}">${[{key:"manual",label:"Manual"},...modulationOptions].map(item=>`<option value="${item.key}" ${item.key===signal.modulation.key?"selected":""}>${item.label}</option>`).join("")}</select><button data-plan-apply="${phase}">${phase===S.phase?"Apply now":"Use next time"}</button><small>${row.status}</small>${S.phaseSignalMode==="METHOD GUIDED"?`<div class="phase-target-matches">PHASE TARGET MATCHES ${methodMatchesForPhase(phase).map(([key])=>`<button data-method="${key}" data-method-phase="${phase}">${key}</button>`).join("")||"— none"}</div>`:""}`;
    });
    $$("[data-plan-carrier]").forEach(select=>select.addEventListener("change",event=>editPlanCarrier(event.target.dataset.planCarrier,event.target.value)));
    $$("[data-plan-modulation]").forEach(select=>select.addEventListener("change",event=>editPlanModulation(event.target.dataset.planModulation,event.target.value)));
    $$("[data-plan-apply]").forEach(button=>button.addEventListener("click",()=>applyPlanRow(button.dataset.planApply)));
    $$('[data-method-phase]').forEach(button=>button.addEventListener("click",()=>useMethodSuggestion(button.dataset.method,button.dataset.methodPhase)));
  }
  function editPlanCarrier(phase,key){if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const item=[...methodCarriers,...symbolicFreqs.map(([value,label])=>({value,label,source_layer:"corpus_wound",source_key:"wound_"+value}))].find(candidate=>candidate.source_key===key);if(!item)return;if(!S.draftPlan)S.draftPlan=structuredClone(S.phaseSignalPlan);const before=cloneSignal(S.draftPlan[phase].signal);S.draftPlan[phase].signal.carrier={source:item.source_layer,key:item.source_key,hz:item.value};S.draftPlan[phase].approved=false;S.draftPlan[phase].status="DRAFT";S.planEvents.push({timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase,from:before,to:S.draftPlan[phase].signal,mode:S.phaseSignalMode,source:"plan_edit"});renderPhaseSignalPlan()}
  function editPlanModulation(phase,key){if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const item=key==="manual"?{key:"manual",source:"manual",mode:"manual",hz:Number($("#manualModulation").value)}:modulationOptions.find(candidate=>candidate.key===key);if(!item)return;if(!S.draftPlan)S.draftPlan=structuredClone(S.phaseSignalPlan);const before=cloneSignal(S.draftPlan[phase].signal);S.draftPlan[phase].signal.modulation={source:item.source,key:item.key,mode:item.mode,hz:item.hz};S.draftPlan[phase].approved=false;S.draftPlan[phase].status="DRAFT";S.planEvents.push({timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase,from:before,to:S.draftPlan[phase].signal,mode:S.phaseSignalMode,source:"plan_edit"});renderPhaseSignalPlan()}
  function applyPlanRow(phase){if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}if(!S.draftPlan)return;const committed=structuredClone(S.draftPlan[phase]);committed.approved=true;committed.status="READY";S.phaseSignalPlan[phase]=committed;S.draftPlan[phase]=structuredClone(committed);if(phase===S.phase)transitionSignalTo(committed.signal,{phase,source:"plan_apply_now"});renderPhaseSignalPlan()}
  function updateLockedPlan(){
    if(S.phaseSignalMode!=="LOCKED")return;
    PHASE_ORDER.forEach(phase=>{S.phaseSignalPlan[phase]={approved:true,signal:cloneSignal(S.signal),status:"READY"}});
    renderPhaseSignalPlan();
  }

  function phaseForProgress(progress){
    if(progress>=.8)return "retorno";
    if(progress>=.5)return "light";
    if(progress>=.2)return "shadow";
    return "descenso";
  }

  function applyState(dimensionsState,fieldState){
    ["inframundo","activacion","disociacion","apertura"].forEach(k=>$("#"+k).value=dimensionsState[k]);
    S.field={...fieldState};
    updateReadouts();
  }

  function transitionToPhase(nextPhase,source="automatic"){
    if(protocolModeActive())return;
    if(!phaseTargets[nextPhase]||nextPhase===S.phase&& !S.transition)return;
    const start={dimensions:dimensions(),field:{...S.field}};
    if(!S.running&&source==="manual"){
      S.phase=nextPhase;S.transition=null;applyState(phaseTargets[nextPhase].dimensions,phaseTargets[nextPhase].field);syncPhaseUi();S.phaseEvents.push({timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase:nextPhase,source});renderVisualFrame();return;
    }
    S.phase=nextPhase;
    S.transition={start,target:phaseTargets[nextPhase],startedAt:performance.now(),duration:8000};
    applyPhaseSignal(nextPhase,"phase_plan");
    if(source==="manual"&&S.running){
      const total=Math.max(num("#duration")*60*1000,1),progress=elapsedMs()/total;
      const releaseAtProgress=[.2,.5,.8,1].find(boundary=>boundary>progress+.0001)||1;
      S.manualOverride={phase:nextPhase,startedAtProgress:progress,releaseAtProgress};
    }
    syncPhaseUi();
    S.phaseEvents.push({timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase:nextPhase,source});
    applyState(start.dimensions,start.field);
  }

  function updateTransition(){
    if(!S.transition)return;
    const t=clamp((performance.now()-S.transition.startedAt)/S.transition.duration,0,1), target=S.transition.target;
    applyState(lerpObject(S.transition.start.dimensions,target.dimensions,t),lerpObject(S.transition.start.field,target.field,t));
    if(t>=1)S.transition=null;
  }

  function recordParameterChange(parameter,from,to){
    if(String(from)===String(to))return;
    S.parameterEvents.push({id:crypto.randomUUID(),timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),parameter,from,to});
  }
  function recordSignalEvent(from,to,source="manual"){
    S.signalEvents.push({from,to,phase:S.phase,timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),source});
  }
  function plannedSignalForPhase(phase){
    if(S.phaseSignalMode==="LOCKED")return cloneSignal(S.signal);
    return S.phaseSignalPlan[phase]?.approved?cloneSignal(S.phaseSignalPlan[phase].signal):null;
  }
  function createAudioBank(ctx,signal,gainValue=0,startAt=null){
    const bank={gain:ctx.createGain(),oscA:ctx.createOscillator(),oscB:ctx.createOscillator(),gainA:ctx.createGain(),gainB:ctx.createGain(),panA:ctx.createStereoPanner(),panB:ctx.createStereoPanner()};
    bank.signal=cloneSignal(signal);
    bank.gain.gain.value=gainValue;bank.oscA.type="sine";bank.oscB.type="triangle";
    bank.oscA.connect(bank.gainA).connect(bank.panA).connect(bank.gain);bank.oscB.connect(bank.gainB).connect(bank.panB).connect(bank.gain);bank.gain.connect(S.filter);
    bank.oscA.frequency.value=signal.carrier.hz;bank.oscB.frequency.value=signal.carrier.hz*2;
    if(startAt==null){bank.oscA.start();bank.oscB.start()}else{bank.oscA.start(startAt);bank.oscB.start(startAt)}
    return bank;
  }
  function initializeProtocolAudioGraphExact({ctx,condition,snapshot,startAt}){
    const signal=condition.signal,schedule=condition.runtime_schedule;
    const width=clamp(.16+(snapshot.field.horizon/100)*.72,0,.9);
    const set=(param,value)=>param.setValueAtTime(value,startAt);
    S.lfo.frequency.setValueAtTime(signal.modulation.hz,startAt);
    S.breathOsc.frequency.setValueAtTime(signal.environmental_breath_hz,startAt);
    set(S.delay.delayTime,.06+(snapshot.field.void/100)*.42);
    set(S.feedback.gain,clamp(snapshot.field.resonance/100,0,.55));
    set(S.filter.frequency,clamp(650+(100-snapshot.dimensions.inframundo)*25+snapshot.dimensions.apertura*10,420,4200));
    set(S.filter.Q,1+(snapshot.field.crystallization/100)*7);
    set(S.lfoGain.gain,.035+snapshot.dimensions.activacion/100*.10);
    set(S.master.gain,snapshot.aeon_master_base_gain);
    set(S.breathGain.gain,snapshot.aeon_master_base_gain*.04);
    S.banks.forEach(bank=>{
      set(bank.gainA.gain,.24);
      set(bank.gainB.gain,clamp(.025+(snapshot.field.presence/100)*.075+(snapshot.dimensions.apertura/100)*.025,.02,.13));
      set(bank.panA.pan,-width);set(bank.panB.pan,width);
      set(bank.oscA.frequency,signal.carrier.hz);set(bank.oscB.frequency,signal.carrier.hz*2);
    });
    window.AEONProtocolRuntime.scheduleFixedPeriodicGate(S.outputGate.gain,schedule,startAt);
  }
  function activeAudioBank(){return S.banks?.[S.activeBank]??null}
  function disposeBank(bank,when=0){
    if(!bank)return;
    const stop=()=>{for(const osc of [bank.oscA,bank.oscB]){try{osc.stop()}catch(_){}try{osc.disconnect()}catch(_){}}for(const node of [bank.gainA,bank.gainB,bank.panA,bank.panB,bank.gain]){try{node.disconnect()}catch(_){}}};
    if(when>0)setTimeout(stop,when);else stop();
  }
  function equalPowerCurves(steps=128){const out=new Float32Array(steps),incoming=new Float32Array(steps);for(let i=0;i<steps;i++){const x=i/(steps-1);out[i]=Math.cos(x*Math.PI/2);incoming[i]=Math.sin(x*Math.PI/2)}return {out,incoming}}
  function signalsEqual(a,b){return a.carrier.source===b.carrier.source&&a.carrier.key===b.carrier.key&&Number(a.carrier.hz)===Number(b.carrier.hz)&&a.modulation.source===b.modulation.source&&a.modulation.key===b.modulation.key&&a.modulation.mode===b.modulation.mode&&Number(a.modulation.hz)===Number(b.modulation.hz)}
  function transitionSignalTo(signal,{phase=S.phase,source="phase_plan"}={}){
    if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}
    if(!signal)return;
    const from=cloneSignal(S.signal);if(signalsEqual(from,signal)){updateSignalMonitor();return}S.signal=cloneSignal(signal);
    if(!S.running||!S.ctx){recordSignalEvent(from,S.signal,source);return}
    const t=S.ctx.currentTime;
    if(from.carrier.hz!==signal.carrier.hz){
      const inactive=1-S.activeBank,old=S.banks[inactive];if(old)disposeBank(old);const next=createAudioBank(S.ctx,signal,0),current=S.banks[S.activeBank];
      const d=dimensions(),f=S.field,width=clamp(.16+(f.horizon/100)*.72,0,.9);
      next.gainA.gain.value=.24;next.gainB.gain.value=clamp(.025+(f.presence/100)*.075+(d.apertura/100)*.025,.02,.13);next.panA.pan.value=-width;next.panB.pan.value=width;
      S.lfoGain.connect(next.gainA.gain);S.banks[inactive]=next;const curves=equalPowerCurves();current.gain.gain.cancelScheduledValues(t);next.gain.gain.cancelScheduledValues(t);current.gain.gain.setValueCurveAtTime(curves.out,t,4);next.gain.gain.setValueCurveAtTime(curves.incoming,t,4);
      setTimeout(()=>{disposeBank(current);S.activeBank=inactive;S.banks[1-S.activeBank]=null},4100);
    }
    S.lfo.frequency.cancelScheduledValues(t);S.lfo.frequency.setValueAtTime(S.lfo.frequency.value,t);S.lfo.frequency.linearRampToValueAtTime(signal.modulation.hz,t+4);S.modulationTransitionUntil=t+4;
    recordSignalEvent(from,S.signal,source);S.signalEvents[S.signalEvents.length-1].phase=phase;
  }
  function applyPhaseSignal(phase,source="phase_plan"){const planned=plannedSignalForPhase(phase);if(planned)transitionSignalTo(planned,{phase,source})}
  const parameterDebounce={};
  function recordParameterChangeDebounced(parameter,from,to){
    clearTimeout(parameterDebounce[parameter]);
    parameterDebounce[parameter]=setTimeout(()=>recordParameterChange(parameter,from,to),300);
  }

  function renderFrequencies(){
    const root=$("#frequencyList");
    root.innerHTML="";
    const source=(S.uiCarrierLibrary||S.signal.carrier.source)==="method_base"?methodCarriers:symbolicFreqs.map(([value,label,color])=>({value,label,source_layer:"corpus_wound",source_key:`wound_${value}`,status:"documented_symbolic_protocol",color}));
    source.forEach((item,idx)=>{
      const hz=item.value,label=item.label,color=item.color||"#e1ba73";
      const row=document.createElement("button");
      row.className="freq-row";
      row.style.cssText="width:100%;border:0;background:transparent;text-align:left;color:inherit;cursor:pointer";
      row.innerHTML=`
        <i class="freq-dot" style="color:${color};background:${color}"></i>
        <span class="freq-hz">${hz} Hz</span>
        <span class="freq-label">${label}</span>
        <canvas class="freq-wave" width="110" height="20"></canvas>`;
      row.addEventListener("click",()=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const next=cloneSignal(S.signal);next.carrier={source:item.source_layer,key:item.source_key,hz};recordParameterChange("carrier",S.signal.carrier.hz,hz);transitionSignalTo(next,{source:"carrier_selection"});if(S.phaseSignalMode==="LOCKED")updateLockedPlan();else flash("Audition signal changed; scheduled plan unchanged.");$("#carrierReadout").textContent=hz;updateAudio();requestStaticVisualRefresh()});
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
    if(protocolModeActive()){
      if(!S.protocol.integrity.verified||!S.protocol.condition)return;
      if(S.protocol.state==="PROBE_PENDING"||S.protocol.state==="INVALID"||S.protocol.state==="ABORTED")return;
    }
    if(!protocolModeActive()&&S.phaseSignalMode!=="LOCKED"&&PHASE_ORDER.some(phase=>!S.phaseSignalPlan[phase]?.approved)){flash("Resolve and approve every phase signal plan row before starting.");return}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    S.ctx=new AC();
    const ctx=S.ctx;

    const protocolStartAt=protocolModeActive()?ctx.currentTime+.050:null;
    S.master=ctx.createGain(); S.master.gain.value=0;
    S.outputGate=ctx.createGain();S.outputGate.gain.value=protocolModeActive()?0:1;
    S.analyser=ctx.createAnalyser(); S.analyser.fftSize=8192; S.analyser.smoothingTimeConstant=.82;
    S.telemetryAnalyser=ctx.createAnalyser();S.telemetryAnalyser.fftSize=1024;S.telemetryAnalyser.smoothingTimeConstant=0;
    S.telemetrySink=ctx.createGain();S.telemetrySink.gain.value=0;
    S.timeData=new Uint8Array(S.analyser.fftSize); S.freqData=new Uint8Array(S.analyser.frequencyBinCount);
    S.filter=ctx.createBiquadFilter(); S.filter.type="lowpass";
    S.delay=ctx.createDelay(1); S.feedback=ctx.createGain();
    S.lfo=ctx.createOscillator();S.lfoGain=ctx.createGain();
    S.breathOsc=ctx.createOscillator();S.breathGain=ctx.createGain();

    S.banks=[createAudioBank(ctx,S.signal,1,protocolStartAt),createAudioBank(ctx,S.signal,0,protocolStartAt)];S.activeBank=0;
    S.oscA=S.banks[0].oscA;S.oscB=S.banks[0].oscB;S.gainA=S.banks[0].gainA;S.gainB=S.banks[0].gainB;S.panA=S.banks[0].panA;S.panB=S.banks[0].panB;
    S.filter.connect(S.master);
    S.filter.connect(S.delay);
    S.delay.connect(S.master);
    S.delay.connect(S.feedback).connect(S.delay);
    S.master.connect(S.outputGate);
    S.outputGate.connect(S.analyser);
    S.analyser.connect(ctx.destination);
    S.outputGate.connect(S.telemetryAnalyser).connect(S.telemetrySink).connect(ctx.destination);
    S.lfo.connect(S.lfoGain);S.banks.forEach(bank=>S.lfoGain.connect(bank.gainA.gain));
    S.breathOsc.connect(S.breathGain).connect(S.master.gain);

    if(protocolModeActive())initializeProtocolAudioGraphExact({ctx,condition:S.protocol.condition,snapshot:S.protocol.audioSnapshot,startAt:protocolStartAt});
    if(protocolStartAt==null){S.lfo.start();S.breathOsc.start()}else{S.lfo.start(protocolStartAt);S.breathOsc.start(protocolStartAt)}
    if(protocolModeActive()){
      S.protocol.expectedSuspend=false;S.protocol.expectedClose=false;
      ctx.addEventListener("statechange",protocolContextStateChange);
      S.protocol.contextStateEvents.push({state:ctx.state,at:new Date().toISOString(),context_time_s:ctx.currentTime,expected:false});
    }
    S.running=true;S.startedAt=performance.now();
    if(protocolModeActive()){
      S.protocol.state="CONDITION_RUNNING";S.protocol.conditionAnchorCtxTime=protocolStartAt;S.protocol.telemetrySamples=[];S.protocol.telemetrySummary=null;
      S.protocol.telemetryError=null;S.protocol.contextStateEvents=[];S.protocol.telemetryIntegrity="PENDING";
      S.protocol.telemetryData=new Float32Array(S.telemetryAnalyser.fftSize);S.protocol.telemetryTimer=window.setInterval(()=>sampleProtocolTelemetry(),25);
      S.protocol.currentConditionRun={scheduled_start_context_s:protocolStartAt,started_at:new Date().toISOString(),start_perf_ms:performance.now(),ended_at:null,end_perf_ms:null,pauses:[],open_pause:null};
      S.protocol.telemetryPolicy={sampling_interval_ms:25,analysis_window_ms:S.telemetryAnalyser.fftSize/ctx.sampleRate*1000,boundary_guard_ms:Math.max(50,S.protocol.condition.runtime_schedule.gate_envelope.ramp_ms+S.telemetryAnalyser.fftSize/ctx.sampleRate*1000),sample_rate_hz:ctx.sampleRate};
    }
    $("#playBtn").textContent="Ⅱ";
    updateAudio();
    if(!protocolModeActive())startVisualMotion();
    else {$("#fieldStatus").textContent="FIELD · PROTOCOL STATIC";renderVisualFrame()}
    S.timer=setInterval(updateTimer,250);
  }

  function audioStop(){
    if(!S.running&&!S.ctx) return;
    if(protocolModeActive()){
      silenceProtocolGate();stopProtocolTelemetry();disposeConditionGraph();closeProtocolContext();
      S.running=false;clearInterval(S.timer);S.timer=null;$("#playBtn").textContent="▶";protocolUi();return;
    }
    S.elapsedBefore += performance.now()-S.startedAt;
    stopVisualMotion({renderFrozen:true});
    const ctx=S.ctx;
    try{
      S.master.gain.cancelScheduledValues(ctx.currentTime);
      S.master.gain.setTargetAtTime(0,ctx.currentTime,.15);
      S.breathGain.gain.setTargetAtTime(0,ctx.currentTime,.15);
      S.banks?.forEach(bank=>disposeBank(bank,600));
      try{S.lfo?.stop();S.lfo?.disconnect();S.lfoGain?.disconnect();S.breathOsc?.stop();S.breathOsc?.disconnect();S.breathGain?.disconnect()}catch(_){ }
      setTimeout(()=>ctx.close().catch(()=>{}),650);
    }catch(_){}
    S.running=false;S.ctx=null;S.outputGate=null;S.telemetryAnalyser=null;S.telemetrySink=null;S.banks=null;S.activeBank=0;S.oscA=S.oscB=S.gainA=S.gainB=S.panA=S.panB=null;$("#playBtn").textContent="▶";
    clearInterval(S.timer);S.timer=null;stopProtocolTelemetry();protocolUi();
  }

  function silenceProtocolGate(){
    if(S.outputGate&&S.ctx){
      S.outputGate.gain.cancelScheduledValues(S.ctx.currentTime);
      S.outputGate.gain.setValueAtTime(0,S.ctx.currentTime);
    }
  }
  function stopProtocolTelemetry(){
    clearInterval(S.protocol.telemetryTimer);S.protocol.telemetryTimer=null;
  }
  function closeProtocolContext(){
    const ctx=S.ctx;if(!ctx)return;
    S.protocol.expectedClose=true;
    try{ctx.close()}catch(_){ }
    S.ctx=null;S.outputGate=null;S.telemetryAnalyser=null;S.telemetrySink=null;
  }
  function failProtocolCondition(reason,integrityKind="stimulus_integrity"){
    const p=S.protocol;if(p.state==="INVALID"&&p.run.invalidReason)return;
    const message=String(reason?.message||reason);silenceProtocolGate();stopProtocolTelemetry();
    p.integrity.verified=false;p.integrity.error=message;p.state="INVALID";p.run.valid=false;p.run.invalidReason=message;
    p.run.events.push({type:"integrity_breach",integrity:integrityKind,at:new Date().toISOString(),reason:message});
    if(p.currentConditionRun){p.currentConditionRun.ended_at=new Date().toISOString();p.currentConditionRun.end_perf_ms=performance.now();p.currentConditionRun.open_pause=null}
    disposeConditionGraph();
    S.running=false;clearInterval(S.timer);S.timer=null;$("#playBtn").textContent="▶";stopVisualMotion({renderFrozen:true});
    if(S.ctx&&S.ctx.state==="running")S.ctx.suspend().catch(()=>{});
    protocolUi();
  }
  function protocolContextStateChange(){
    const ctx=S.ctx,p=S.protocol;if(!ctx||!protocolModeActive())return;
    const expected=(ctx.state==="suspended"&&p.expectedSuspend)||(ctx.state==="closed"&&p.expectedClose);
    p.contextStateEvents.push({state:ctx.state,at:new Date().toISOString(),context_time_s:ctx.currentTime,expected});
    if(window.AEONProtocolRuntime.unexpectedContextState(ctx.state,{conditionRunning:protocolRunning(),expectedSuspend:p.expectedSuspend,expectedClose:p.expectedClose})&&!expected)failProtocolCondition(`unexpected AudioContext state: ${ctx.state}`,"stimulus_integrity");
  }
  function protocolVisibilityChange(){
    if(window.AEONProtocolRuntime.visibilityInvalidatesProtocol(document.visibilityState,protocolRunning()))failProtocolCondition("document visibility hidden during condition","stimulus_integrity");
  }

  function updateAudio(){
    if(!S.running||!S.ctx) return;
    if(protocolRunning()){updateSignalMonitor();return;}
    const controls=effectiveAudioControlState(),d=controls.dimensions,f=controls.field,t=S.ctx.currentTime;
    const depth=num("#depth");
    S.banks?.forEach(bank=>updateBankFieldParams(bank,d,f,t));
    const width=clamp(.16+(f.horizon/100)*.72,0,.9);
    S.delay.delayTime.setTargetAtTime(.06+(f.void/100)*.42,t,.18);
    S.feedback.gain.setTargetAtTime(clamp(f.resonance/100,0,.55),t,.18);
    S.filter.frequency.setTargetAtTime(clamp(650+(100-d.inframundo)*25+d.apertura*10,420,4200),t,.18);
    S.filter.Q.setTargetAtTime(1+(f.crystallization/100)*7,t,.18);
    if(t>=S.modulationTransitionUntil)S.lfo.frequency.setTargetAtTime(S.signal.modulation.hz,t,.18);
    S.lfoGain.gain.setTargetAtTime(.035+d.activacion/100*.10,t,.18);
    const baseMaster=controls.aeon_master_base_gain??[.025,.035,.045][controls.depth??depth];
    S.master.gain.setTargetAtTime(baseMaster,t,.2);
    S.breathOsc.frequency.setTargetAtTime(f.breath,t,.25);
    S.breathGain.gain.setTargetAtTime(baseMaster*.04,t,.25);
    updateSignalMonitor();
  }
  function updateBankFieldParams(bank,d,f,t){if(!bank)return;const width=clamp(.16+(f.horizon/100)*.72,0,.9);bank.gainA.gain.setTargetAtTime(.24,t,.18);bank.gainB.gain.setTargetAtTime(clamp(.025+(f.presence/100)*.075+(d.apertura/100)*.025,.02,.13),t,.18);bank.panA.pan.setTargetAtTime(-width,t,.18);bank.panB.pan.setTargetAtTime(width,t,.18)}

  function sampleProtocolTelemetry(){
    const p=S.protocol;if(!protocolRunning()||!S.telemetryAnalyser||!p.telemetryData||!S.ctx)return;
    try{
      S.telemetryAnalyser.getFloatTimeDomainData(p.telemetryData);
      const rawTime=protocolConditionTimeRaw(),schedule=p.condition.runtime_schedule;
      if(!window.AEONProtocolRuntime.telemetryTimeInBlock(rawTime,schedule.block_duration_s))return;
      const metrics=window.AEONProtocolRuntime.rmsAndPeakDbfs(p.telemetryData),policy=p.telemetryPolicy;
      const boundaryGuard=window.AEONProtocolRuntime.boundaryGuardAt(schedule,rawTime,policy.analysis_window_ms);
      p.telemetrySamples.push({condition_time_s:+rawTime.toFixed(3),context_time_s:+S.ctx.currentTime.toFixed(3),scheduled_state:window.AEONProtocolRuntime.scheduledStateAt(schedule,rawTime),in_ramp_window:window.AEONProtocolRuntime.inGateRampWindow(schedule,rawTime),boundary_guard:boundaryGuard,...Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,key.includes("dbfs")?+value.toFixed(3):value])),measured_silent:metrics.rms_dbfs<=-80});
      protocolUi();
    }catch(error){
      stopProtocolTelemetry();p.telemetryError=String(error?.message||error);p.telemetryIntegrity="FAILED";failProtocolCondition(`telemetry unavailable: ${p.telemetryError}`,"telemetry_integrity");
    }
  }

  function summarizeProtocolTelemetry(){
    const p=S.protocol,samples=p.telemetrySamples,schedule=p.condition.runtime_schedule,policy=p.telemetryPolicy;
    const active=samples.filter(sample=>sample.scheduled_state==="ACTIVE"),silent=samples.filter(sample=>sample.scheduled_state==="SILENT");
    const steady=samples.filter(sample=>!sample.boundary_guard);
    const ratio=values=>values.length?values.filter(sample=>sample.measured_silent).length/values.length:null;
    const agreement=values=>values.length?values.filter(sample=>sample.measured_silent===(sample.scheduled_state==="SILENT")).length/values.length:null;
    const median=values=>{if(!values.length)return null;const sorted=values.map(sample=>sample.rms_dbfs).sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]};
    const expectedSampleCount=schedule.block_duration_s*1000/policy.sampling_interval_ms,completeness=samples.length/expectedSampleCount;
    return {scheduled_silence_ratio:schedule.scheduled_silence_ratio,measured_digital_silence_ratio:ratio(samples),steady_state_measured_silence_ratio:ratio(steady),classification_agreement:agreement(samples),steady_state_classification_agreement:agreement(steady),sample_count:samples.length,expected_sample_count:expectedSampleCount,sample_completeness:completeness,steady_state_sample_count:steady.length,telemetry_status:window.AEONProtocolRuntime.classifyTelemetryStatus(samples.length,expectedSampleCount,steady.length),active_sample_count:active.length,silent_sample_count:silent.length,median_active_rms_dbfs:median(active),median_silent_rms_dbfs:median(silent),near_full_scale_count:samples.filter(sample=>sample.near_full_scale).length,above_nominal_full_scale_count:samples.filter(sample=>sample.above_nominal_full_scale).length,analysis_window_ms:policy.analysis_window_ms,boundary_guard_ms:policy.boundary_guard_ms,sample_rate_hz:policy.sample_rate_hz,telemetry_valid:!!S.telemetryAnalyser};
  }

  function disposeConditionGraph(){
    S.banks?.forEach(bank=>disposeBank(bank));
    try{S.lfo?.stop();S.lfo?.disconnect();S.lfoGain?.disconnect();S.breathOsc?.stop();S.breathOsc?.disconnect();S.breathGain?.disconnect()}catch(_){ }
    [S.filter,S.delay,S.feedback,S.master].forEach(node=>{try{node?.disconnect()}catch(_){}});
    S.banks=null;S.activeBank=0;S.oscA=S.oscB=S.gainA=S.gainB=S.panA=S.panB=null;S.filter=S.delay=S.feedback=S.master=S.lfo=S.lfoGain=S.breathOsc=S.breathGain=null;
  }

  function finishProtocolCondition(){
    if(!protocolRunning())return;
    const p=S.protocol;silenceProtocolGate();stopProtocolTelemetry();p.telemetrySummary=summarizeProtocolTelemetry();
    const run=p.currentConditionRun;run.ended_at=new Date().toISOString();run.end_perf_ms=performance.now();
    p.run.conditions.push({condition_id:p.condition.condition_id,source_sha256:p.condition.source_sha256,executable_fingerprint:p.protocol.condition_fingerprints[p.condition.condition_id],scheduled_silence_ratio:p.condition.runtime_schedule.scheduled_silence_ratio,started_at:run.started_at,ended_at:run.ended_at,protocol_active_exposure_s:protocolConditionTime(),protocol_wall_duration_s:(run.end_perf_ms-run.start_perf_ms)/1000,pauses:run.pauses,telemetry_policy:{source:"browser_digital_output_downstream_of_protocol_gate",fft_size:1024,sampling_interval_ms:25,silence_threshold_dbfs:-80,not_acoustic_spl:true,...p.telemetryPolicy},telemetry_summary:p.telemetrySummary,telemetry_samples:p.telemetrySamples});
    disposeConditionGraph();p.state="PROBE_PENDING";S.running=false;clearInterval(S.timer);S.timer=null;$("#playBtn").textContent="▶";stopVisualMotion({renderFrozen:true});protocolUi();flash("Condition complete. Observation layer required.");
  }

  function dominantFftHz(){
    if(!S.running||!S.analyser||!S.ctx)return null;
    const data=S.freqData;S.analyser.getByteFrequencyData(data);
    let peak=0,index=0;
    data.forEach((value,i)=>{if(value>peak){peak=value;index=i}});
    return +(index*S.ctx.sampleRate/(S.analyser.fftSize)).toFixed(2);
  }
  function signalSnapshot(){
    const controls=effectiveAudioControlState(),carrier=clamp(S.signal.carrier.hz,40,2000),sampleRate=S.ctx?.sampleRate??null,fftSize=S.analyser?.fftSize??8192;
    return {carrier:{source:S.signal.carrier.source,key:S.signal.carrier.key,target_hz:S.signal.carrier.hz},harmonic_b:{source:"aeon_synthesis",rule:"2x_carrier",target_hz:carrier*2},modulation:{source:S.signal.modulation.source,key:S.signal.modulation.key,mode:S.signal.modulation.mode,target_hz:S.signal.modulation.hz},environmental_breath:{source:"aeon_field_mapping",acspec:"ACSPEC-114",target_hz:controls.field.breath},sample_rate_hz:sampleRate,fft_size:fftSize,fft_resolution_hz:sampleRate?+(sampleRate/fftSize).toFixed(2):null,dominant_fft_hz:dominantFftHz(),rms_dbfs:signalRmsDbfs(),peak_dbfs:signalPeakDbfs(),near_clipping:signalNearClipping(),audio_context_state:S.ctx?.state??"closed",master_gain:S.master?.gain.value??0};
  }
  function updateSignalMonitor(){
    const signal=signalSnapshot(),format=(value,digits=2)=>value==null?"—":`${Number(value).toFixed(digits)} Hz`;
    $("#signalSymbolic").textContent=format(signal.carrier.target_hz);
    $("#signalCarrier").textContent=format(signal.carrier.target_hz);
    $("#signalHarmonic").textContent=`AEON synthesis · ${format(signal.harmonic_b.target_hz)}`;
    $("#signalPulse").textContent=`${signal.modulation.source} · ${format(signal.modulation.target_hz,2)}`;
    $("#signalFieldTime").textContent=`${S.field.pulse.toFixed(2)} rate`;
    $("#signalBreath").textContent=format(signal.environmental_breath.target_hz,3);
    $("#signalSampleRate").textContent=signal.sample_rate_hz?`${signal.sample_rate_hz} Hz`:"—";
    $("#signalPeak").textContent=format(signal.dominant_fft_hz);
    $("#signalFftResolution").textContent=format(signal.fft_resolution_hz,2);
    $("#signalRms").textContent=signal.rms_dbfs;
    $("#signalPeakDbfs").textContent=signal.peak_dbfs;
    $("#signalClipping").textContent=signal.near_clipping;
    const sourceLabel=source=>source==="method_base"?"METHOD BASE":source==="corpus_wound"?"CORPUS · WOUND SYMBOLIC":source==="legacy_experimental"?"LEGACY EXPERIMENTAL":"MANUAL";
    $("#signalSource").textContent=`${sourceLabel(signal.carrier.source)} · ${signal.carrier.target_hz} Hz`;
    $("#signalModulationSource").textContent=`${sourceLabel(signal.modulation.source)} · ${signal.modulation.key}`;
    $("#signalCurrentPhase").textContent=phaseLabels[S.phase];
    $("#signalPlanMode").textContent=S.phaseSignalMode;
  }
  function signalRmsDbfs(){if(!S.running||!S.analyser)return "—";S.analyser.getByteTimeDomainData(S.timeData);let sum=0;for(const value of S.timeData){const sample=(value-128)/128;sum+=sample*sample}return `${(20*Math.log10(Math.max(Math.sqrt(sum/S.timeData.length),1e-5))).toFixed(1)} dBFS`}
  function signalPeakDbfs(){if(!S.running||!S.analyser)return "—";let peak=0;for(const value of S.timeData)peak=Math.max(peak,Math.abs((value-128)/128));return `${(20*Math.log10(Math.max(peak,1e-5))).toFixed(1)} dBFS`}
  function signalNearClipping(){if(!S.running||!S.analyser)return "—";let peak=0;for(const value of S.timeData)peak=Math.max(peak,Math.abs((value-128)/128));return peak>.92?"YES":"NO"}

  function elapsedMs(){ return S.elapsedBefore + (S.running ? performance.now()-S.startedAt : 0); }
  function updateTimer(){
    if(protocolModeActive()){
      const condition=S.protocol.condition;
      protocolWatchdog();
      if(S.protocol.state==="CONDITION_RUNNING"&&condition&&protocolConditionTime()>=condition.runtime_schedule.block_duration_s)finishProtocolCondition();
      protocolUi();
      if(S.running)updateSignalMonitor();
      return;
    }
    const total=num("#duration")*60*1000;
    const ms=Math.min(elapsedMs(),total);
    updateTransition();
    const progress=total>0?ms/total:0,resolved=phaseForProgress(progress);
    if(S.manualOverride&&progress>=S.manualOverride.releaseAtProgress)S.manualOverride=null;
    const effectivePhase=S.manualOverride?S.manualOverride.phase:resolved;
    if(effectivePhase!==S.phase&&!S.transition)transitionToPhase(effectivePhase,S.manualOverride?"manual":"automatic");
    const sec=Math.floor(ms/1000);
    $("#elapsed").textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");
    $("#progressBar").style.width=(ms/total*100)+"%";
    renderMicrovoidTimeline();
    if(S.running)updateSignalMonitor();
    if(ms>=total && S.running) audioStop();
  }

  async function handleProtocolTransport(){
    const p=S.protocol;
    if(p.state==="READY"&&p.mode==="ARMED"){audioStart();return}
    if(p.state==="CONDITION_RUNNING"&&S.ctx){
      p.expectedSuspend=true;await S.ctx.suspend();p.expectedSuspend=false;const now=performance.now();if(p.currentConditionRun)p.currentConditionRun.open_pause={start_perf_ms:now,started_at:new Date().toISOString(),context_time_s:S.ctx.currentTime};p.state="PAUSED";p.run.events.push({type:"pause",context_time_s:S.ctx.currentTime,at:new Date().toISOString()});stopVisualMotion({renderFrozen:true});protocolUi();return;
    }
    if(p.state==="PAUSED"&&S.ctx){
      const pause=p.currentConditionRun?.open_pause;p.expectedSuspend=false;await S.ctx.resume();if(pause){pause.end_perf_ms=performance.now();pause.ended_at=new Date().toISOString();pause.wall_duration_ms=pause.end_perf_ms-pause.start_perf_ms;p.currentConditionRun.pauses.push(pause);p.currentConditionRun.open_pause=null}p.state="CONDITION_RUNNING";p.run.events.push({type:"resume",context_time_s:S.ctx.currentTime,at:new Date().toISOString()});stopVisualMotion({renderFrozen:true});$("#fieldStatus").textContent="FIELD · PROTOCOL STATIC";protocolUi();return;
    }
    if(p.state==="PROBE_PENDING")flash("OBSERVATION REQUIRED · Phase D not installed");
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
    const event={id:crypto.randomUUID(),timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase:S.phase,signal_snapshot:signalSnapshot(),dimensions:dimensions(),field:{...S.field},construct:$("#constructSelect").value,construct_snapshot:{selected:$("#constructSelect").value,field:{...S.field}},integration_index:x.integration_index,gradient:x.gradient,text:"",source:"manual"};
    S.microvoids.push(event);renderMicrovoidTimeline();flash("Microvoid registered.");
    const timeline=$("#microvoidTimeline");timeline.classList.remove("microvoid-pulse");void timeline.offsetWidth;timeline.classList.add("microvoid-pulse");
  }
  function renderMicrovoidTimeline(){
    const root=$("#microvoidEvents"),count=$("#microvoidCount"),progress=$("#timelineProgress");
    if(!root||!count)return;
    const total=Math.max(num("#duration")*60,1),elapsed=Math.min(elapsedMs()/1000,total);
    progress.style.width=(elapsed/total*100)+"%";
    count.textContent=`${S.microvoids.length} event${S.microvoids.length===1?"":"s"}`;
    root.innerHTML=S.microvoids.map(event=>{const left=clamp(event.timestamp_s/total*100,1,99);return `<span class="microvoid-marker" data-phase="${escapeHtml(event.phase)}" style="left:${left}%" title="${escapeHtml(phaseLabels[event.phase]||event.phase)} · ${event.timestamp_s}s"></span>`}).join("");
  }
  function resetSession(){
    audioStop();S.elapsedBefore=0;S.phase="descenso";S.transition=null;S.manualOverride=null;S.phaseEvents=[];S.parameterEvents=[];S.signalEvents=[];S.planEvents=[];updateLockedPlan();syncPhaseUi();applyState(phaseTargets.descenso.dimensions,phaseTargets.descenso.field);$("#elapsed").textContent="00:00";$("#progressBar").style.width="0%";renderMicrovoidTimeline();flash("Field reset; session preserved.");
  }
  function newSession(){
    audioStop();S.sessionId=createSessionId();S.sessionStartISO=new Date().toISOString();S.elapsedBefore=0;S.microvoids=[];S.phaseEvents=[];S.parameterEvents=[];S.signalEvents=[];S.planEvents=[];S.transition=null;S.manualOverride=null;S.phase="descenso";updateLockedPlan();syncPhaseUi();$("#elapsed").textContent="00:00";$("#progressBar").style.width="0%";applyState(phaseTargets.descenso.dimensions,phaseTargets.descenso.field);flash("New session · existing signal plan retained");
  }

  function sessionObject(){
    ensureSession();
    const x=derived();
    return {
      session_id:S.sessionId,
      experiment_id:S.experimentId,
      participant_id:S.participantId,
      engine:"AEON Sound Field",
      engine_version:"0.3.4.4",
      engine_build:"0.3.4.4",
      date:S.sessionStartISO,
      duration_real_s:+(elapsedMs()/1000).toFixed(2),
      context:{
        phase:S.phase,
        intention:$("#intention").value.trim()||null,
        construct:$("#constructSelect").value,
        listening_context:document.querySelector(".seg.active")?.dataset.output||"headphones",
        output:document.querySelector(".seg.active")?.dataset.output||"headphones",
        epistemic_boundary:"symbolic_and_experimental_mappings_not_medical_claims"
      },
      parameters:{
        dimensions:dimensions(),
        derived_profile:x,
        current_signal:signalSnapshot(),
        field:S.field,
        depth:["soft","medium","deep"][num("#depth")],
        planned_duration_min:num("#duration")
        ,phase_plan:{order:PHASE_ORDER,fractions:PHASE_FRACTIONS,transition_ms:8000,status:"experimental_noncanonical"}
        ,phase_signal_plan:{mode:S.phaseSignalMode,phases:S.phaseSignalPlan,provenance_boundary:"Source identity remains separate for carrier, modulation, harmonic synthesis and environmental breath.",method_match_policy:"show_all_no_priority",status:"experimental_noncanonical"}
        ,acspec_time_audio_link:false
        ,matched_method_protocols:methodMatches()
        ,construct_mapping_version:"0.3.4.4"
      },
      events:{phase_transitions:S.phaseEvents,signal_transitions:S.signalEvents,parameter_changes:S.parameterEvents,plan_changes:S.planEvents,microvoids:S.microvoids},
      protocol_runtime:{
        mode:S.protocol.mode,
        protocol_id:S.protocol.protocol?.protocol_id||null,
        compiler_version:S.protocol.protocol?.compiler_version||null,
        integrity:S.protocol.integrity,
        visual_policy:protocolModeActive()?"decorative_static_signal_monitor_live":null,
        audio_snapshot:S.protocol.audioSnapshot,
        current_state:S.protocol.state,
        current_condition_id:S.protocol.condition?.condition_id||null,
        run_id:S.protocol.run.id,
        run_valid:S.protocol.run.valid,
        invalid_reason:S.protocol.run.invalidReason,
        conditions:S.protocol.run.conditions,
        events:S.protocol.run.events,
        stimulus_integrity:S.protocol.run.valid?"VALID":"INVALID",
        telemetry_integrity:S.protocol.telemetryError?"FAILED":(S.protocol.telemetrySummary?.telemetry_status||"PENDING"),
        protocol_active_exposure_s:S.protocol.currentConditionRun&&S.protocol.currentConditionRun.end_perf_ms?(S.protocol.currentConditionRun.end_perf_ms-S.protocol.currentConditionRun.start_perf_ms)/1000:null,
        protocol_wall_duration_s:S.protocol.currentConditionRun&&S.protocol.currentConditionRun.end_perf_ms?(S.protocol.currentConditionRun.end_perf_ms-S.protocol.currentConditionRun.start_perf_ms)/1000:null,
        free_field_duration_real_s:protocolModeActive()?null:+(elapsedMs()/1000).toFixed(2),
        context_state_events:S.protocol.contextStateEvents,
        response_series_status:"not_created_probe_layer_pending",
        calibration_only:S.protocol.run.calibration_only
      },
      observations:loadNotes(),
      interpretations:{experimental:null,symbolic:null},
      safety:{
        low_output:true,
        stop_control_available:true,
        no_medical_claim:true,
        master_output_cap:0.10
      },
      microvoid_definition:"User-registered operational event within the Ars Caeli session model; not a physiological measurement.",
      signal_measurement_boundary:"AnalyserNode describes the generated browser signal; it is not an acoustic calibration or physiological measurement.",
      completeness:"partial"
    };
  }
  function methodMatches(){
    const d=dimensions(),matches=[];
    Object.entries(methodProtocols).forEach(([key,protocol])=>{if(protocol.condition(d))matches.push({label:key,source:"Method Base",reading:protocol.reading,sequence:protocol.sequence,avoid:protocol.avoid})});
    return matches;
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
    flash("Session saved locally.");
  }
  function saveProfile(){
    localStorage.setItem("arscaeli_soundfield_profile",JSON.stringify({
      intention:$("#intention").value,
      dimensions:dimensions(),
      duration:num("#duration"),
      depth:num("#depth")
      ,experimentId:S.experimentId
      ,participantId:S.participantId
      ,field:S.field
      ,signal:S.signal
      ,construct:$("#constructSelect").value
      ,listeningContext:document.querySelector(".seg.active")?.dataset.output||"headphones"
    }));
    flash("Profile saved.");
  }
  function loadProfile(){
    try{
      const p=JSON.parse(localStorage.getItem("arscaeli_soundfield_profile")||"null");
      if(!p)return;
      $("#intention").value=p.intention||"";
      if(p.dimensions) Object.entries(p.dimensions).forEach(([k,v])=>$("#"+k).value=v);
      if(p.duration)$("#duration").value=p.duration;
      if(p.depth!=null)$("#depth").value=p.depth;
      if(p.field)S.field={...S.field,...p.field};
      if(p.signal)S.signal=cloneSignal(p.signal);
      if(p.construct)$("#constructSelect").value=p.construct;
      if(p.listeningContext){$$(".seg").forEach(button=>button.classList.toggle("active",button.dataset.output===p.listeningContext))}
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
      eyebrow.textContent="SESSION";title.textContent="Session record";
      const notes=loadNotes();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card"><h3>Intention</h3><p>${escapeHtml($("#intention").value||"No intention recorded.")}</p></div>
          <div class="drawer-card"><h3>Current state</h3><p>Session: ${escapeHtml(S.sessionId)}<br>Phase: ${escapeHtml(phaseLabels[S.phase])}<br>Gradient: ${derived().gradient}<br>Integration index: ${derived().integration_index}%</p></div>
          <div class="drawer-card full"><h3>ATLAS identification</h3><label class="drawer-label" for="experimentIdInput">Experiment</label><input id="experimentIdInput" value="${escapeHtml(S.experimentId)}"><label class="drawer-label" for="participantIdInput">Participant</label><input id="participantIdInput" value="${escapeHtml(S.participantId)}"><button class="action-btn cyan" id="saveIdsBtn" style="width:100%;margin-top:9px">Save identification</button></div>
          <div class="drawer-card full">
            <h3>New observation</h3>
            <textarea id="noteText" rows="4" placeholder="Describe what you perceived without interpreting it yet."></textarea>
            <button class="action-btn gold" id="addNoteBtn" style="width:100%;margin-top:9px">Save observation</button>
          </div>
          <div class="drawer-card full"><h3>Observations</h3><div id="notesList">${notes.length?notes.map(n=>`<p>• ${escapeHtml(n.text)} <small>${escapeHtml(phaseLabels[n.phase]||n.phase)} · ${escapeHtml(n.at)}</small></p>`).join(""):"<p>No observations.</p>"}</div></div>
          <div class="drawer-card full"><button class="action-btn gold" id="newSessionBtn" style="width:100%">New session</button></div>
        </div>`;
      setTimeout(()=>$("#addNoteBtn")?.addEventListener("click",()=>{
        const text=$("#noteText").value.trim();if(!text)return;
        ensureSession();const arr=loadNotes();arr.push({id:crypto.randomUUID(),timestamp_s:+(elapsedMs()/1000).toFixed(1),at:new Date().toISOString(),phase:S.phase,signal_snapshot:signalSnapshot(),dimensions:dimensions(),field:{...S.field},construct:$("#constructSelect").value,text});localStorage.setItem(notesStorageKey(),JSON.stringify(arr));openDrawer("sesion");
      }),0);
      setTimeout(()=>$("#saveIdsBtn")?.addEventListener("click",()=>{S.experimentId=$("#experimentIdInput").value.trim()||"ACX-0001";S.participantId=$("#participantIdInput").value.trim()||"P-0001";saveProfile();openDrawer("sesion");}),0);
      setTimeout(()=>$("#newSessionBtn")?.addEventListener("click",()=>{newSession();openDrawer("sesion")}),0);
    }else if(type==="biblioteca"){
      eyebrow.textContent="LIBRARY";title.textContent="Canon and correspondences";
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card full"><h3>Epistemic boundary</h3>
            <p>Repository documents are the documentary source. This interface's mappings are experimental. Frequencies are presented as internal Ars Caeli symbolic correspondences, not clinical claims.</p>
          </div>
          <div class="drawer-card"><h3>Local source</h3><p>metodo_alquimico_base.json</p></div>
          <div class="drawer-card"><h3>Repository</h3><p>Ars-Caeli-Cannonical / main</p></div>
          <div class="drawer-card full"><h3>Synchronized sources</h3><div id="repoList">${repoSources.map(p=>`<div class="repo-source"><i class="${S.canonical[p]?"ok":""}"></i>${escapeHtml(p)}</div>`).join("")}</div>
          <button class="action-btn cyan" id="syncRepoBtn" style="width:100%;margin-top:12px">Sync repository</button></div>
        </div>`;
      setTimeout(()=>$("#syncRepoBtn")?.addEventListener("click",syncRepo),0);
    }else if(type==="atlas"){
      eyebrow.textContent="ATLAS";title.textContent="Session memory";
      const rec=sessionObject();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card full"><h3>Vista previa JSON</h3><pre style="white-space:pre-wrap;color:#94a5b8;font:9px/1.5 ui-monospace;max-height:420px;overflow:auto">${escapeHtml(JSON.stringify(rec,null,2))}</pre></div>
          <div class="drawer-card full"><button class="action-btn cyan" id="downloadAtlasBtn" style="width:100%">Download ATLAS JSON</button></div>
        </div>`;
      setTimeout(()=>$("#downloadAtlasBtn")?.addEventListener("click",()=>downloadJSON(rec,rec.session_id+"_AEON_v0.3.4.4.json")),0);
    }else if(type==="descenso"||type==="retorno"){
      transitionToPhase(type==="descenso"?"descenso":"retorno","manual");
      eyebrow.textContent=phaseLabels[type].toUpperCase();title.textContent=type==="descenso"?"Descent profile":"Return profile";
      const d=dimensions(),x=derived();
      content.innerHTML=`
        <div class="drawer-grid">
          <div class="drawer-card"><h3>Underworld</h3><p>${d.inframundo}/100</p></div>
          <div class="drawer-card"><h3>Opening</h3><p>${d.apertura}/100</p></div>
          <div class="drawer-card"><h3>Gradient</h3><p>${x.gradient}</p></div>
          <div class="drawer-card"><h3>Integration index</h3><p>${x.integration_index}%</p></div>
          <div class="drawer-card full"><h3>Interface reading</h3><p>This view organizes the session trajectory. It describes an operational system state; it does not diagnose a clinical condition.</p></div>
        </div>`;
    }else{
      eyebrow.textContent="HOME";title.textContent="AEON Sound Field";
      content.innerHTML=`<div class="drawer-card"><h3>v0.3.4.4</h3><p>Session interface oriented toward descent, transformation, and return, with local recording and ATLAS export.</p></div>`;
    }
    drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");
  }

  async function syncRepo(){
    $("#repoStatus").textContent="SINCRONIZANDO…";let ok=0;
    for(const p of repoSources){
      try{
        const r=await fetch(RAW+encodeURI(p),{cache:"no-store"});if(!r.ok)throw Error(r.status);
        S.canonical[p]=await r.text();ok++;
      }catch(_){}
    }
    $("#repoDot").classList.toggle("online",ok>0);
    $("#repoStatus").textContent=ok?`REPOSITORY ${ok}/${repoSources.length}`:"LOCAL";
    flash(ok?`Repository synchronized: ${ok}/${repoSources.length}`:"Synchronization failed. Local mode remains active.");
    if($("#drawer").classList.contains("open") && $("#drawerEyebrow").textContent==="BIBLIOTECA") openDrawer("biblioteca");
  }

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  // Main field canvas
  const fc=$("#fieldCanvas"), fcx=fc.getContext("2d");
  const lc=$("#leftBrain"), lcx=lc.getContext("2d");
  const rc=$("#rightBrain"), rcx=rc.getContext("2d");
  const mc=$("#miniViz"), mcx=mc.getContext("2d");
  const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fit(c){
    const dpr=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    const w=Math.floor(r.width*dpr),h=Math.floor(r.height*dpr);
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    const x=c.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);
  }

  function visualSessionSeconds(){return elapsedMs()/1000}
  function visualRateFromFieldPulse(pulse){const p=clamp(Number(pulse)||0,.1,12),n=(p-.1)/(12-.1);return .018+n*.10}
  function visualClock(){const seconds=visualSessionSeconds(),visualHz=visualRateFromFieldPulse(S.field.pulse);return {seconds,visualHz,phase:prefersReducedMotion?0:seconds*visualHz*Math.PI*2}}
  function renderVisualFrame(){drawFieldFrame();drawMiniFrame();drawSideFrames()}
  function visualLoop(timestamp){if(!S.running||protocolModeActive()){S.visual.running=false;S.visual.raf=null;return}if(timestamp-S.visual.lastFrame>=1000/30){S.visual.lastFrame=timestamp;renderVisualFrame()}S.visual.raf=requestAnimationFrame(visualLoop)}
  function startVisualMotion(){if(protocolModeActive()){S.visual.running=false;$("#fieldStatus").textContent="FIELD · PROTOCOL STATIC";renderVisualFrame();return}if(S.visual.running)return;S.visual.running=true;$("#fieldStatus").textContent="FIELD · LIVE";renderVisualFrame();S.visual.raf=requestAnimationFrame(visualLoop)}
  function stopVisualMotion({renderFrozen=true}={}){if(S.visual.raf!=null){cancelAnimationFrame(S.visual.raf);S.visual.raf=null}S.visual.running=false;$("#fieldStatus").textContent="FIELD · STATIC";if(renderFrozen)renderVisualFrame()}
  function requestStaticVisualRefresh(){if(!S.running)renderVisualFrame()}

  function drawFieldFrame(){
    fit(fc);const W=fc.clientWidth,H=fc.clientHeight,cx=fcx,d=dimensions(),x=derived();
    cx.clearRect(0,0,W,H);const clock=visualClock();
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
      const pts=6+ring*2, rr=R*(.34+ring*.13), rot=clock.phase*(ring%2?1:-1)*(.28+ring*.06);
      cx.strokeStyle=ring%2?cyan+".18)":vio+".16)";cx.lineWidth=1;cx.beginPath();
      for(let i=0;i<=pts;i++){
        const a=rot+i/pts*Math.PI*2,px=X+Math.cos(a)*rr,py=Y+Math.sin(a)*rr;
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }
      cx.stroke();
    }

    // torus curves
    const f=S.field, entropyEffective=(f.entropy/100)*(1-(f.crystallization/100)*.75), torusCount=Math.round(10+(f.presence/100)*22);
    const breathScale=1+Math.sin(clock.seconds*Math.PI*2*f.breath)*.03, rotation=clock.phase*.38;
    for(let j=0;j<torusCount;j++){
      const off=(j-10.5)/10.5, alpha=.035+(1-Math.abs(off))*.035;
      cx.strokeStyle=cyan+alpha+")";cx.beginPath();
      for(let i=0;i<=140;i++){
        const t=i/140*Math.PI*2;
        const px=X+Math.cos(t+rotation)*R*(.77+off*.12)*(1+f.horizon/100*.16)*breathScale;
        const py=Y+Math.sin(t+rotation)*R*.48*breathScale + Math.sin(t*2+clock.phase*.75+j*.35)*R*.045*off*entropyEffective;
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }cx.stroke();
    }

    for(let ring=0;ring<Math.round(f.resonance/25);ring++){
      const rr=R*(.45+ring*.15+Math.sin(clock.phase*.30+ring)*.015);
      cx.strokeStyle=gold+(.08+f.resonance/100*.12)+")";cx.beginPath();cx.arc(X,Y,rr,0,Math.PI*2);cx.stroke();
    }

    // left/right energy
    const leftAmp=.25+d.inframundo/100*.75,rightAmp=.25+d.apertura/100*.75;
    for(const side of [-1,1]){
      cx.strokeStyle=side<0?vio+".48)":cyan+".55)";cx.lineWidth=1.2;cx.beginPath();
      for(let i=0;i<=100;i++){
        const t=i/100, px=X+side*(R*.2+t*R*.92);
        const amp=(side<0?leftAmp:rightAmp);
        const activationGain=.65+(d.activacion/100)*.70,phase=clock.phase*activationGain;
        const py=Y+Math.sin(t*13+phase)*R*.07*amp*Math.sin(t*Math.PI),gap=d.disociacion/100;
        if(gap>.78&&i%5<Math.round(gap*3))cx.moveTo(px,py);else i?cx.lineTo(px,py):cx.moveTo(px,py);
      }cx.stroke();
    }

    // descent-return arc
    cx.strokeStyle=gold+".72)";cx.lineWidth=1.6;cx.beginPath();
    cx.arc(X,Y,R*.93,Math.PI*.93,Math.PI*2.07);cx.stroke();

    // waypoints
    const activeIndex=PHASE_ORDER.indexOf(S.phase);
    [Math.PI,Math.PI*1.25,Math.PI*1.5,Math.PI*2].forEach((a,i)=>{
      const px=X+Math.cos(a)*R*.93,py=Y+Math.sin(a)*R*.93;
      const active=i===activeIndex;cx.fillStyle=gold+(active?".98)":".48)");cx.beginPath();cx.arc(px,py,active?9:5+i,0,Math.PI*2);cx.fill();
    });

    // central vesica/presence
    cx.strokeStyle="rgba(138,180,223,.21)";cx.lineWidth=1;
    for(let i=0;i<10;i++){
      const rr=R*(.15+i*.033),sx=Math.sin(clock.phase*.45+i)*R*.012;
      cx.beginPath();cx.ellipse(X+sx,Y,rr*.62,rr,0,0,Math.PI*2);cx.stroke();
    }

    // subtle particles
    for(let i=0;i<Math.round(25+(f.presence/100)*85);i++){
      const spacing=.2+(f.void/100)*.95, a=i*2.399+clock.phase*.12,r=R*(spacing+(i%17)/17*(1-spacing*.35));
      const px=X+Math.cos(a)*r,py=Y+Math.sin(a)*r;
      cx.fillStyle=i%7===0?gold+".25)":cyan+".13)";cx.fillRect(px,py,1,1);
    }

  }

  function drawBrain(ctx,canvas,color,phaseShift,clock){
    fit(canvas);const W=canvas.clientWidth,H=canvas.clientHeight;ctx.clearRect(0,0,W,H);const d=dimensions(),f=S.field,synthetic=phaseShift>1,spread=synthetic?1+f.horizon/100*.16:1,rigidity=synthetic?1:1-(f.crystallization/100)*.18,slowScale=1+Math.sin(clock.seconds*Math.PI*2*f.breath)*.02;
    const X=W/2,Y=H*.5,R=Math.min(W*.28,H*.36);
    ctx.strokeStyle=color;ctx.lineWidth=1;
    for(let k=0;k<8;k++){
      ctx.beginPath();
      for(let i=0;i<=80;i++){
        const t=i/80*Math.PI*2;
        const rr=R*(.55+k*.055);
        const px=X+Math.cos(t)*rr*spread*slowScale*(1+.08*Math.sin(t*3+k)*rigidity);
        const py=Y+Math.sin(t)*rr*.72*slowScale*(1+.05*Math.cos(t*4+k)*rigidity);
        i?ctx.lineTo(px,py):ctx.moveTo(px,py);
      }ctx.stroke();
    }
    ctx.beginPath();
    for(let i=0;i<=W;i++){
      const sideRate=synthetic?.70:.90,activationGain=.75+(d.activacion/100)*.45,sidePhase=clock.phase*sideRate*activationGain;
      const y=Y+Math.sin(i*.08+sidePhase+phaseShift)*5*Math.sin(i/W*Math.PI)*(synthetic?1+d.apertura/100:.7+d.activacion/100);
      i?ctx.lineTo(i,y):ctx.moveTo(i,y);
    }ctx.stroke();
  }

  function drawMiniFrame(){
    fit(mc);const W=mc.clientWidth,H=mc.clientHeight;mcx.clearRect(0,0,W,H);
    const X=W/2,Y=H/2,clock=visualClock();
    if(S.viz==="torus"){
        const f=S.field, count=Math.round(8+f.presence/100*18), spread=1+f.horizon/100*.35, entropy=(f.entropy/100)*(1-f.crystallization/100*.75), scale=1+Math.sin(clock.seconds*Math.PI*2*f.breath)*.025;
      for(let i=0;i<count;i++){
          const rr=(20+i*3.5)*scale, deformation=1+Math.sin(clock.phase*.55+i*.4)*entropy*.08;
        mcx.strokeStyle=`rgba(${110+i*2},${95+i*3},230,${.05+i*.012})`;
          mcx.save();mcx.translate(X,Y);mcx.rotate(clock.phase*.32+i*.03);mcx.scale(spread,deformation);mcx.beginPath();
          for(let p=0;p<=120;p++){const a=p/120*Math.PI*2,px=Math.cos(a)*rr*2.15,py=Math.sin(a)*rr*.85;p?mcx.lineTo(px,py):mcx.moveTo(px,py)}
          mcx.stroke();mcx.restore();
      }
      for(let ring=0;ring<Math.round(f.resonance/25);ring++){mcx.strokeStyle=`rgba(225,186,115,${.08+f.resonance/600})`;mcx.beginPath();mcx.arc(X,Y,(30+ring*18)*scale,0,Math.PI*2);mcx.stroke()}
      mcx.strokeStyle="rgba(170,100,250,.8)";mcx.beginPath();mcx.moveTo(X,10);mcx.lineTo(X,H-10);mcx.stroke();
    }else if(S.viz==="waves"){
      mcx.strokeStyle="#66d7f1";mcx.globalAlpha=.8;mcx.beginPath();
      if(S.running&&S.analyser){const data=S.timeData;S.analyser.getByteTimeDomainData(data);for(let i=0;i<W;i++){const y=data[Math.floor(i/W*data.length)]/255*H;i?mcx.lineTo(i,y):mcx.moveTo(i,y)}}else{mcx.moveTo(0,Y);mcx.lineTo(W,Y);mcx.fillStyle="#717d8d";mcx.font="10px ui-monospace";mcx.fillText("NO LIVE SIGNAL",12,20)}mcx.stroke();mcx.globalAlpha=1;
    }else if(S.viz==="spectrum"){
      const data=S.analyser&&S.running?S.freqData:null, visibleHz=2500, bins=data?Math.min(data.length,Math.floor(visibleHz/(S.ctx.sampleRate/2)*data.length)):48;
      for(let i=0;i<bins;i++){
        const h=data?data[i]/255*H*.8:0;mcx.fillStyle="rgba(102,215,241,.55)";mcx.fillRect(i/bins*W,H-h,Math.max(1,W/bins-1),h);
      }
      if(!S.running){mcx.fillStyle="#717d8d";mcx.font="10px ui-monospace";mcx.fillText("NO LIVE SIGNAL",12,20)}
      const carrier=clamp(S.signal.carrier.hz,40,2000);[carrier,carrier*2].forEach((hz,i)=>{if(hz<=visibleHz){const x=hz/visibleHz*W;mcx.strokeStyle=i?"#e1ba73":"#a070f7";mcx.beginPath();mcx.moveTo(x,0);mcx.lineTo(x,H);mcx.stroke()}});
    }else{
      const labels=["Underworld","Activation","Dissociation","Opening"],values=dimensions(),keys=["inframundo","activacion","disociacion","apertura"];
      labels.forEach((label,i)=>{const y=18+i*(H-42)/3;mcx.fillStyle="#e1ba73";mcx.fillText(`${label} ${Math.round(values[keys[i]])}`,10,y);mcx.fillStyle="#26344a";mcx.fillRect(10,y+7,W-20,5);mcx.fillStyle="#66d7f1";mcx.fillRect(10,y+7,(W-20)*values[keys[i]]/100,5)});
    }
  }

  function drawSideFrames(){
    const clock=visualClock();drawBrain(lcx,lc,"rgba(160,112,247,.50)",0,clock);drawBrain(rcx,rc,"rgba(102,215,241,.55)",2.1,clock);
  }

  function wire(){
    ["#inframundo","#activacion","#disociacion","#apertura"].forEach(id=>$(id).addEventListener("input",()=>{recordParameterChangeDebounced("dimensions",null,dimensions());updateReadouts()}));
    ["#duration","#depth"].forEach(id=>$(id).addEventListener("input",()=>{recordParameterChangeDebounced(id.slice(1),null,num(id));updateReadouts()}));
    $$(".phase-step").forEach(b=>b.addEventListener("click",()=>transitionToPhase(b.dataset.phase,"manual")));
    $("#constructSelect").addEventListener("change",()=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}recordParameterChange("construct",null,$("#constructSelect").value);updateConstructInspector()});
    $("#constructValue").addEventListener("input",()=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const c=constructRegistry[$("#constructSelect").value],previous=S.field[c.fieldKey];S.field[c.fieldKey]=Number($("#constructValue").value);recordParameterChangeDebounced("construct_value",previous,S.field[c.fieldKey]);updateConstructInspector();updateAudio();requestStaticVisualRefresh()});
    $$(".seg").forEach(b=>b.addEventListener("click",()=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}$$(".seg").forEach(x=>x.classList.remove("active"));b.classList.add("active");recordParameterChange("listening_context",null,b.dataset.output)}));
    $$(".viz-tab").forEach(b=>b.addEventListener("click",()=>{$$(".viz-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");S.viz=b.dataset.viz;requestStaticVisualRefresh()}));
    $$(".nav-link").forEach(b=>b.addEventListener("click",()=>{
      $$(".nav-link").forEach(x=>x.classList.remove("active"));b.classList.add("active");
      const v=b.dataset.view;
      if(v==="inicio") openDrawer("inicio");
      else if(v==="sesion") openDrawer("sesion");
      else if(v==="biblioteca") openDrawer("biblioteca");
      else if(v==="atlas") openDrawer("atlas");
      else openDrawer(v);
    }));
    $("#playBtn").addEventListener("click",()=>protocolModeActive()?handleProtocolTransport():(S.running?audioStop():audioStart()));
    $("#armProtocolBtn").addEventListener("click",armProtocol);
    $("#abortProtocolBtn").addEventListener("click",abortProtocol);
    $("#prevBtn").addEventListener("click",()=>{const i=PHASE_ORDER.indexOf(S.phase);if(i>0)transitionToPhase(PHASE_ORDER[i-1],"manual")});
    $("#nextBtn").addEventListener("click",()=>{const i=PHASE_ORDER.indexOf(S.phase);if(i<PHASE_ORDER.length-1)transitionToPhase(PHASE_ORDER[i+1],"manual")});
    $("#resetBtn").addEventListener("click",resetSession);
    $("#registerMicrovoidBtn").addEventListener("click",registerMicrovoid);
    $("#saveProfileBtn").addEventListener("click",saveProfile);
    $("#saveSessionBtn").addEventListener("click",saveLocal);
    $("#exportAtlasBtn").addEventListener("click",()=>openDrawer("atlas"));
    $("#timerBtn").addEventListener("click",()=>flash("Session duration is controlled from the left panel."));
    $("#expandVizBtn").addEventListener("click",()=>flash("Expanded visualization reserved for AEON v0.4."));
    $("#closeDrawerBtn").addEventListener("click",()=>{$("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true")});
    $("#carrierSource").addEventListener("change",event=>{S.uiCarrierLibrary=event.target.value==="method"?"method_base":"corpus_wound";renderFrequencies();recordParameterChange("carrier_library",null,S.uiCarrierLibrary)});
    $("#modulationSelect").addEventListener("change",event=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const option=event.target.value==="manual"?{key:"manual",source:"manual",mode:"manual",hz:Number($("#manualModulation").value)}:modulationOptions.find(item=>item.key===event.target.value);if(!option)return;const next=cloneSignal(S.signal);next.modulation={source:option.source,key:option.key,mode:option.mode,hz:option.hz};$("#manualModulation").value=option.hz;recordParameterChange("modulation",S.signal.modulation,next.modulation);transitionSignalTo(next,{source:"modulation_selection"});if(S.phaseSignalMode==="LOCKED")updateLockedPlan();else flash("Audition signal changed; scheduled plan unchanged.");updateAudio();updateReadouts()});
    $("#manualModulation").addEventListener("input",event=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}const value=Number(event.target.value),next=cloneSignal(S.signal);next.modulation={source:"manual",key:`manual_${value.toFixed(2).replace(".","_")}`,mode:"manual",hz:value};$("#modulationSelect").value="manual";recordParameterChangeDebounced("modulation",S.signal.modulation,next.modulation);transitionSignalTo(next,{source:"manual_modulation"});if(S.phaseSignalMode==="LOCKED")updateLockedPlan();updateAudio();updateReadouts()});
    $("#phaseSignalMode").addEventListener("change",event=>{if(protocolModeActive()){flash("CONTROLLED RUN · AUDIO PARAMETERS LOCKED");return}S.phaseSignalMode=event.target.value;S.draftPlan=event.target.value==="LOCKED"?null:structuredClone(S.phaseSignalPlan);recordParameterChange("phase_signal_mode",null,S.phaseSignalMode);if(S.phaseSignalMode==="LOCKED")updateLockedPlan();if(S.phaseSignalMode==="METHOD GUIDED")PHASE_ORDER.forEach(phase=>{S.phaseSignalPlan[phase].approved=false;S.phaseSignalPlan[phase].status="UNRESOLVED";S.draftPlan[phase].approved=false;S.draftPlan[phase].status="UNRESOLVED"});updateReadouts()});
  }

  async function init(){
    ensureSession();document.addEventListener("visibilitychange",protocolVisibilityChange);const qaWrap=$("#protocolQaWrap");if(qaWrap)qaWrap.hidden=new URLSearchParams(location.search).get("aeon_qa")!=="1";renderFrequencies();wire();loadProfile();S.uiCarrierLibrary=S.signal.carrier.source;$("#carrierSource").value=S.uiCarrierLibrary==="method_base"?"method":"wound_symbolic";$("#modulationSelect").value=modulationOptions.some(item=>item.key===S.signal.modulation.key)?S.signal.modulation.key:"manual";$("#manualModulation").value=S.signal.modulation.hz;updateLockedPlan();renderFrequencies();syncPhaseUi();updateReadouts();protocolUi();renderVisualFrame();
    try{
      const r=await fetch("mappings.json",{cache:"no-store"});if(r.ok){$("#repoDot").classList.add("online");$("#repoStatus").textContent="LOCAL LISTO"}
    }catch(_){}
  }
  init();
})();
