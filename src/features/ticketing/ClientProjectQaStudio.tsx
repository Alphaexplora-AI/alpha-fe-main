import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { ClientProjectPreview } from './clientApi';
import { QaPreview } from './ProjectQaStudio';

const PANEL_PREFERENCE_KEY = 'alpha.client.projectReview.panelCollapsed';
function readPanelPreference(): boolean {
  try { return localStorage.getItem(PANEL_PREFERENCE_KEY) === 'true'; } catch { return false; }
}

/**
 * The client's Project Review: the preview the project manager shared, beside the
 * project conversation. There is no checklist here — acceptance happens on the
 * request itself, and feedback goes to the project manager as messages.
 */
export function ClientProjectQaStudio({projectName,preview,feedback}:{projectName:string;preview:ClientProjectPreview|null;feedback:ReactNode}) {
  const [mobile,setMobile]=useState<'preview'|'review'>('preview');
  const [panelCollapsed,setPanelCollapsedState]=useState(readPanelPreference);
  const [peek,setPeek]=useState(false);
  const review=useRef<HTMLElement|null>(null);const peekTimer=useRef<number|undefined>(undefined);
  // Hiding leaves the pointer over the new rail; wait until it leaves once before hover can reopen the panel.
  const holdPeek=useRef(false);
  function setPanelCollapsed(collapsed:boolean){setPanelCollapsedState(collapsed);setPeek(false);holdPeek.current=collapsed;
    try{localStorage.setItem(PANEL_PREFERENCE_KEY,String(collapsed));}catch{/* The choice still applies for this visit. */}}
  function openPeek(){window.clearTimeout(peekTimer.current);if(panelCollapsed&&!holdPeek.current)setPeek(true);}
  // Keep the panel open while someone is typing in it, even if the pointer drifts over the preview.
  function closePeekSoon(){window.clearTimeout(peekTimer.current);
    peekTimer.current=window.setTimeout(()=>{if(!review.current?.contains(document.activeElement))setPeek(false);},250);}
  useEffect(()=>()=>window.clearTimeout(peekTimer.current),[]);
  const panelState=!panelCollapsed?'docked':peek?'peek':'collapsed';
  // The server only stores hosted HTTPS Vercel previews; QaPreview rechecks before embedding and always offers "Open preview".
  const shared=preview?{branch:preview.branch,url:preview.url,embeddable:true,reason:null}:null;
  return <section className="project-qa-studio pqa-client" data-panel={panelState} aria-label={`${projectName} Project Review`}>
    <div className="pqa-mobile-switch" role="group" aria-label="Review view"><button type="button" aria-pressed={mobile==='preview'} onClick={()=>setMobile('preview')}>Preview</button>
      <button type="button" aria-pressed={mobile==='review'} onClick={()=>setMobile('review')}>Feedback</button></div>
    <div className="pqa-workspace" data-mobile={mobile}><QaPreview preview={shared} audience="client"/>
      {panelCollapsed&&<div className="pqa-panel-rail" onMouseEnter={openPeek} onMouseLeave={()=>{holdPeek.current=false;closePeekSoon();}}>
        <button type="button" aria-label="Show feedback panel" title="Show feedback panel" onClick={()=>setPanelCollapsed(false)}><PanelRightOpen size={16}/></button>
        <span aria-hidden="true">Feedback</span>
      </div>}
      <aside ref={review} className="pqa-review" aria-label="Project feedback" onMouseEnter={openPeek} onMouseLeave={()=>{if(panelCollapsed)closePeekSoon();}}
        onBlur={event=>{if(panelCollapsed&&!event.currentTarget.contains(event.relatedTarget as Node|null))closePeekSoon();}}
        onKeyDown={event=>{if(event.key==='Escape'&&panelState==='peek'){setPeek(false);(document.activeElement as HTMLElement|null)?.blur();}}}>
        {!panelCollapsed&&<div className="pqa-panel-header"><button type="button" className="pqa-panel-toggle" aria-label="Hide feedback panel" title="Hide feedback panel"
          onClick={()=>setPanelCollapsed(true)}><PanelRightClose size={15}/></button></div>}
        {feedback}
      </aside>
    </div>
  </section>;
}
