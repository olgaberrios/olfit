import{h as X,render as Y}from"https://esm.sh/preact@10.20.1";import{useState as v,useEffect as Z}from"https://esm.sh/preact@10.20.1/hooks";import ee from"https://esm.sh/htm@3.1.1";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function l(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(a){if(a.ep)return;a.ep=!0;const r=l(a);fetch(a.href,r)}})();const n=ee.bind(X),L="olmaps_routes.json",te=[{v:"pendiente",l:"🔭 Pendientes"},{v:"hecha",l:"✅ Hechas"},{v:"favorita",l:"⭐ Favoritas"}],R=[{v:"senderismo",l:"🚶🏾‍♀️ Senderismo"},{v:"bici",l:"🚲 Bici"},{v:"correr",l:"🏃🏾‍♀️ Correr"}],_=[{v:"baja",l:"🟢 Baja"},{v:"media",l:"🟠 Media"},{v:"alta",l:"🔴 Alta"}],ae=["Poca","Media","Mucha"],se=["Poca","Media","Mucha"],oe=e=>e==="alta"?"#b83c0c":e==="media"?"#d4712a":"#2d6a4f",ne=e=>e==="bici"?"🚲":e==="correr"?"🏃🏾‍♀️":"🚶🏾‍♀️",le=()=>({id:Date.now(),nombre:"",enlace:"",hecha:!1,favorita:!1,estTren:"",actividad:"senderismo",kms:"",dificultad:"media",fecha:"",fuentes:!1,sombra:"Media",masificacion:"Media",notas:""}),M=(e,o,l={})=>fetch("https://api.github.com"+o,{...l,headers:{Authorization:"token "+e,Accept:"application/vnd.github.v3+json","Content-Type":"application/json",...l.headers||{}}});async function x(e,o){const l=await M(e,"/gists/"+o);if(!l.ok)throw new Error("Error "+l.status);const a=(await l.json()).files[L];return a?JSON.parse(a.content):[]}async function ie(e,o,l){const i={files:{}};i.files[L]={content:JSON.stringify(l,null,2)};const a=await M(e,"/gists/"+o,{method:"PATCH",body:JSON.stringify(i)});if(!a.ok)throw new Error("Error "+a.status)}async function ce(e){const o={description:"OlMaps — mis rutas",public:!1,files:{}};o.files[L]={content:JSON.stringify([],null,2)};const l=await M(e,"/gists",{method:"POST",body:JSON.stringify(o)});if(!l.ok)throw new Error("Error "+l.status);return(await l.json()).id}function f({children:e,color:o="#6e5c42"}){return n`<span class="tag" style=${{background:o+"18",color:o,border:"1px solid "+o+"44"}}>${e}</span>`}function re({options:e,value:o,onChange:l}){return n`<div class="seg">${e.map(i=>n`<button class=${"seg-btn"+(o===i.v?" on":"")} onClick=${()=>l(i.v)}>${i.l}</button>`)}</div>`}function T({title:e,onClose:o,children:l}){return n`
    <div class="overlay" onClick=${o}>
      <div class="modal" onClick=${i=>i.stopPropagation()}>
        <div class="modal-head">
          <h2>${e}</h2>
          <button class="modal-close" onClick=${o}>✕</button>
        </div>
        ${l}
      </div>
    </div>`}function de({label:e,value:o,onChange:l,suggestions:i,placeholder:a}){const[r,c]=v(!1),s=i.filter(u=>u.toLowerCase().includes((o||"").toLowerCase())&&u!==o);return n`
    <div class="field">
      <label>${e}</label>
      <div class="ac">
        <input class="fi" value=${o}
          onInput=${u=>{l(u.target.value),c(!0)}}
          onFocus=${()=>c(!0)}
          onBlur=${()=>setTimeout(()=>c(!1),150)}
          placeholder=${a}/>
        ${r&&s.length>0&&n`
          <div class="ac-drop">
            ${s.map(u=>n`<div class="ac-item" onMouseDown=${()=>{l(u),c(!1)}}>${u}</div>`)}
          </div>`}
      </div>
    </div>`}function ue({initial:e,allTren:o,onSave:l,onCancel:i}){const[a,r]=v(e),c=(s,u)=>r(p=>({...p,[s]:u}));return n`
    <div>
      <div class="field"><label>Nombre de la ruta</label>
        <input class="fi" value=${a.nombre} onInput=${s=>c("nombre",s.target.value)} placeholder="Ej: Camino del Norte"/>
      </div>
      <div class="field"><label>🔗 Enlace</label>
        <input class="fi" value=${a.enlace} onInput=${s=>c("enlace",s.target.value)} placeholder="https://..."/>
      </div>
      <div class="field"><label>Estado</label>
        <div class="bool-row">
          <button class=${"bool-btn"+(a.hecha?" on":"")} onClick=${()=>c("hecha",!a.hecha)}>✅ Hecha</button>
          <button class=${"bool-btn"+(a.favorita?" on":"")} onClick=${()=>c("favorita",!a.favorita)}>⭐ Favorita</button>
        </div>
      </div>
      <div class="field"><label>Actividad</label>
        <${re} options=${R} value=${a.actividad} onChange=${s=>c("actividad",s)}/>
      </div>
      <div class="g2">
        <div class="field"><label>Kms</label>
          <input class="fi" type="number" value=${a.kms} onInput=${s=>c("kms",s.target.value)} placeholder="0"/>
        </div>
        <div class="field"><label>Dificultad</label>
          <select class="fs" value=${a.dificultad} onChange=${s=>c("dificultad",s.target.value)}>
            ${_.map(s=>n`<option value=${s.v}>${s.l}</option>`)}
          </select>
        </div>
      </div>
      <${de} label="🚂 Estación de tren / bus" value=${a.estTren} onChange=${s=>c("estTren",s)} suggestions=${o} placeholder="Ej: Colmenar Viejo, Cercedilla…"/>
      <div class="sec">
        <p class="sec-lbl">🌿 Entorno</p>
        <div class="field"><label>🗓️ Fecha de realización (opcional)</label>
          <input class="fi" type="date" value=${a.fecha} onChange=${s=>c("fecha",s.target.value)}/>
        </div>
        <div class="g2">
          <div class="field"><label>🌳 Sombra</label>
            <select class="fs" value=${a.sombra} onChange=${s=>c("sombra",s.target.value)}>
              ${ae.map(s=>n`<option>${s}</option>`)}
            </select>
          </div>
          <div class="field"><label>🧑‍🧑‍🧒‍🧒 Masificación</label>
            <select class="fs" value=${a.masificacion} onChange=${s=>c("masificacion",s.target.value)}>
              ${se.map(s=>n`<option>${s}</option>`)}
            </select>
          </div>
        </div>
        <div class="field"><label>⛲ ¿Hay fuentes?</label>
          <div class="bool-row">
            <button class=${"bool-btn"+(a.fuentes===!0?" on":"")} onClick=${()=>c("fuentes",!0)}>⛲ Sí</button>
            <button class=${"bool-btn"+(a.fuentes===!1?" on":"")} onClick=${()=>c("fuentes",!1)}>🚫 No</button>
          </div>
        </div>
        <div class="field"><label>📝 Notas</label>
          <textarea class="ft" value=${a.notas} onInput=${s=>c("notas",s.target.value)} placeholder="Observaciones, terreno, consejos…"/>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" onClick=${i}>Cancelar</button>
        <button class="btn-save" onClick=${()=>l(a)}>💾 Guardar</button>
      </div>
    </div>`}function fe({route:e,onEdit:o,onDelete:l}){var s;const[i,a]=v(!1),r=oe(e.dificultad),c=(s=_.find(u=>u.v===e.dificultad))==null?void 0:s.l;return n`
    <div class="route-card">
      <div class="card-head" onClick=${()=>a(u=>!u)}>
        <span class="card-act">${ne(e.actividad)}</span>
        <div class="card-body">
          <div class="card-title">
            ${e.nombre||"Sin nombre"}
            ${e.hecha&&n`<${f} color="#2d6a4f">✅ Hecha</${f}>`}
            ${e.favorita&&n`<${f} color="#c49a0a">⭐ Favorita</${f}>`}
            ${!e.hecha&&!e.favorita&&n`<${f} color="#6e5c42">🔭 Pendiente</${f}>`}
          </div>
          <div class="card-tags">
            ${e.kms&&n`<${f} color="#7b5e3a">📏 ${e.kms} km</${f}>`}
            <${f} color=${r}>${c}</${f}>
            ${e.estTren&&n`<${f} color="#1a6060">🚂 ${e.estTren}</${f}>`}
            ${e.fecha&&n`<${f} color="#614880">🗓️ ${e.fecha}</${f}>`}
          </div>
        </div>
        <span class="chevron">${i?"▲":"▼"}</span>
      </div>
      ${i&&n`
        <div class="card-detail">
          ${e.enlace&&n`<a class="detail-link" href=${e.enlace} target="_blank" rel="noreferrer">🔗 Abrir ruta</a>`}
          <div class="detail-env">
            <${f} color=${e.fuentes?"#2d6a4f":"#b83c0c"}>${e.fuentes?"⛲ Fuentes":"🚫 Sin fuentes"}</${f}>
            <${f} color="#7b5e3a">🌳 Sombra: ${e.sombra}</${f}>
            <${f} color="#614880">🧑‍🧑‍🧒‍🧒 Masif: ${e.masificacion}</${f}>
          </div>
          ${e.notas&&n`<div class="notes-box">📝 ${e.notas}</div>`}
          <div class="card-actions">
            <button class="btn-outline" onClick=${()=>o(e)}>✏️ Editar</button>
            <button class="btn-danger" onClick=${()=>l(e.id)}>🗑️ Borrar</button>
          </div>
        </div>`}
    </div>`}function ve({currentGistId:e,onSave:o,onDisconnect:l}){const[i,a]=v(""),[r,c]=v(""),[s,u]=v(!1),[p,b]=v(""),m=async()=>{u(!0),b("");try{const $=await ce(i);o(i,$)}catch($){b($.message)}u(!1)},I=async()=>{u(!0),b("");try{await x(i,r),o(i,r)}catch{b("No se pudo conectar. Revisa el token y el ID.")}u(!1)};return n`
    <div>
      ${e&&n`
        <div class="cur-gist">
          Gist actual: <code>${e}</code><br/>
          <button class="btn-danger" style=${{marginTop:"8px"}} onClick=${l}>Desconectar</button>
        </div>`}
      <div class="setup-tip">
        <strong>¿Cómo obtener el token?</strong><br/>
        GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → New token → marca solo <code>gist</code> → genera y copia.
      </div>
      <div class="field"><label>GitHub Token (permiso gist)</label>
        <input class="fi" type="password" value=${i} onInput=${$=>a($.target.value)} placeholder="ghp_…"/>
      </div>
      <button class="btn-create" onClick=${m} disabled=${!i||s}>
        ${s?"Creando…":"✨ Crear nuevo Gist para OlMaps"}
      </button>
      <div class="div-or">o conectar uno existente</div>
      <div class="field"><label>ID del Gist existente</label>
        <input class="fi" value=${r} onInput=${$=>c($.target.value)} placeholder="abc123def456…"/>
      </div>
      <button class="btn-connect" onClick=${I} disabled=${!i||!r||s}>
        ${s?"Conectando…":"🔗 Conectar Gist existente"}
      </button>
      ${p&&n`<p class="err-msg">${p}</p>`}
    </div>`}function $e(){const[e,o]=v([]),[l,i]=v(()=>localStorage.getItem("om_token")||""),[a,r]=v(()=>localStorage.getItem("om_gist")||""),[c,s]=v(!1),[u,p]=v(null),[b,m]=v(""),[I,$]=v(!1),[H,g]=v(!1),[E,y]=v(null),[C,B]=v("all"),[F,J]=v("all"),[S,A]=v("all"),[O,z]=v(""),k=!!(l&&a);Z(()=>{k?N():$(!0)},[]);async function N(){s(!0),m("");try{const d=(await x(l,a)).map(h=>{if(h.estado!==void 0){const{estado:j,...U}=h;return{...U,hecha:j==="hecha",favorita:j==="favorita"}}return h});o(d),p(new Date)}catch(t){m(t.message)}s(!1)}async function G(t){if(k){s(!0),m("");try{await ie(l,a,t),p(new Date)}catch(d){m(d.message)}s(!1)}}function K(t,d){localStorage.setItem("om_token",t),localStorage.setItem("om_gist",d),i(t),r(d),$(!1),setTimeout(N,100)}function W(){localStorage.removeItem("om_token"),localStorage.removeItem("om_gist"),i(""),r(""),o([]),$(!1)}function q(t){const d=E?e.map(h=>h.id===t.id?t:h):[{...t,id:Date.now()},...e];o(d),G(d),g(!1),y(null)}function V(t){if(!confirm("¿Borrar esta ruta?"))return;const d=e.filter(h=>h.id!==t);o(d),G(d)}const D=[...new Set(e.map(t=>t.estTren).filter(Boolean))].sort(),P=e.filter(t=>!(C==="pendiente"&&t.hecha||C==="hecha"&&!t.hecha||C==="favorita"&&!t.favorita||F!=="all"&&t.actividad!==F||S!=="all"&&t.estTren!==S||O&&!t.nombre.toLowerCase().includes(O.toLowerCase()))).slice().sort((t,d)=>t.hecha&&d.hecha?!t.fecha&&!d.fecha?0:t.fecha?d.fecha?d.fecha.localeCompare(t.fecha):-1:1:t.hecha!==d.hecha?t.hecha?1:-1:d.id-t.id),w={total:e.length,hechas:e.filter(t=>t.hecha).length,favoritas:e.filter(t=>t.favorita).length,kms:e.filter(t=>t.kms).reduce((t,d)=>t+Number(d.kms),0)},Q=c?"⏳ Sincronizando…":b||(u?"✅ Sync "+u.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}):k?"🔗 Conectado":"⚠️ Sin conexión");return n`
    <div>
      <header class="header">
        <div class="header-inner">
          <div class="logo">
            <h1>🗺️ <span>Ol</span>Maps</h1>
            <p class=${b?"err":""}>${Q}</p>
          </div>
          ${k&&n`<button class="btn-ghost" onClick=${N}>↻ Sync</button>`}
          <button class="btn-ghost" onClick=${()=>$(!0)}>⚙️</button>
          <button class="btn-primary" onClick=${()=>{y(null),g(!0)}}>+ Nueva</button>
        </div>
      </header>

      <main class="main">
        ${e.length>0&&n`
          <div class="stats">
            ${[{icon:"🗺️",val:w.total,lbl:"Total",color:"#2d6a4f"},{icon:"✅",val:w.hechas,lbl:"Hechas",color:"#2d6a4f"},{icon:"⭐",val:w.favoritas,lbl:"Favoritas",color:"#c49a0a"},{icon:"📏",val:w.kms||"—",lbl:"Kms",color:"#7b5e3a"}].map(t=>n`
              <div class="stat-card">
                <div class="stat-icon">${t.icon}</div>
                <div class="stat-val" style=${{color:t.color}}>${t.val}</div>
                <div class="stat-lbl">${t.lbl}</div>
              </div>`)}
          </div>`}

        <div class="filters">
          <input class="search" value=${O} onInput=${t=>z(t.target.value)} placeholder="🔍 Buscar por nombre…"/>
          <div class="filter-row">
            ${[{v:"all",l:"Todas"},...te].map(t=>n`
              <button class=${"chip"+(C===t.v?" cs":"")} onClick=${()=>B(t.v)}>${t.l}</button>`)}
          </div>
          <div class="filter-row">
            ${[{v:"all",l:"🗂️ Todas"},...R].map(t=>n`
              <button class=${"chip"+(F===t.v?" ca":"")} onClick=${()=>J(t.v)}>${t.l}</button>`)}
          </div>
          ${D.length>0&&n`
            <div class="filter-row">
              <button class=${"chip"+(S==="all"?" ct":"")} onClick=${()=>A("all")}>🚂 Todas</button>
              ${D.map(t=>n`
                <button class=${"chip"+(S===t?" ct":"")} onClick=${()=>A(t)}>${t}</button>`)}
            </div>`}
        </div>

        ${P.length===0?n`
          <div class="empty">
            <div class="empty-icon">🗺️</div>
            <p>${e.length===0?"¡Añade tu primera ruta!":"No hay rutas con estos filtros."}</p>
          </div>
        `:P.map(t=>n`
          <${fe} key=${t.id} route=${t}
            onEdit=${d=>{y(d),g(!0)}}
            onDelete=${V}/>`)}
      </main>

      ${H&&n`
        <${T} title=${E?"✏️ Editar ruta":"✨ Nueva ruta"} onClose=${()=>{g(!1),y(null)}}>
          <${ue} initial=${E||le()} allTren=${D} onSave=${q} onCancel=${()=>{g(!1),y(null)}}/>
        </${T}>`}

      ${I&&n`
        <${T} title="⚙️ Configurar sincronización" onClose=${()=>$(!1)}>
          <${ve} currentGistId=${a} onSave=${K} onDisconnect=${W}/>
        </${T}>`}
    </div>`}Y(n`<${$e}/>`,document.getElementById("app"));
