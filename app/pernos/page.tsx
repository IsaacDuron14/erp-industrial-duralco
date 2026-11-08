"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {calcBolt,buildBoltDetalle,sufijoClienteMaterial,DEFAULT_CONFIG,DEFAULT_PARAMS,type Perno} from "@/lib/corebolt/v10662/pernos";
const empty:Perno={detalle:"",tipo:"RECTO",material:"1018",diametro:'1/2"',cuerpo:0,pata:0,rosca1:0,rosca2:0,cantidad:1,precioManual:0,clienteLlevaMaterial:false};
const format=(n:number)=>"L "+n.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
const count=(n:number)=>n.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function Pernos(){
 const [b,setB]=useState<Perno>(empty),[rows,setRows]=useState<Perno[]>([]),[edit,setEdit]=useState<number|null>(null),[error,setError]=useState("");
 const materials=[...new Set(DEFAULT_CONFIG.map(c=>c.material))];
 const diametros=DEFAULT_CONFIG.filter(c=>c.material===b.material);
 const cfg=DEFAULT_CONFIG.find(c=>c.material===b.material&&c.diametro===b.diametro);
 const current=calcBolt(b,cfg);
 const summary=useMemo(()=>rows.reduce((v,x)=>{const c=DEFAULT_CONFIG.find(z=>z.material===x.material&&z.diametro===x.diametro);const r=calcBolt(x,c);return {total:v.total+(r?.venta_total||0),cost:v.cost+(r?.costo_total||0),weight:v.weight+(r?.peso_total||0)}},{total:0,cost:0,weight:0}),[rows]);
 const change=(key:keyof Perno,value:Perno[keyof Perno])=>setB(p=>({...p,[key]:value}));
 function add(e:React.FormEvent){e.preventDefault();setError("");
  if(!cfg||cfg.precio_barra<=0){setError('Esta combinación no tiene precio de barra cargado en V106.62. La prueba conserva su bloqueo original.');return;}
  if(!Number.isFinite(b.cantidad)||b.cantidad<=0){setError("Cantidad inválida.");return;}
  const detail=(b.detalle.trim()||buildBoltDetalle(b))+(b.clienteLlevaMaterial?sufijoClienteMaterial(b):"");
  const updated={...b,detalle:detail};
  setRows(old=>edit===null?[...old,updated]:old.map((x,i)=>i===edit?updated:x));
  setB({...empty});setEdit(null);
 }
 function update(i:number){setEdit(i);setB({...rows[i],detalle:rows[i].detalle.replace(/ SERVICIO.*\(CLIENTE LLEVA MATERIAL\)$/,"")});document.getElementById("bolt-form")?.scrollIntoView({behavior:"smooth"});}
 return <div className="legacy-shell pernos-shell"><div className="legacy-stripe"/><header className="legacy-header"><div className="legacy-mark">D</div><div className="legacy-brand"><div className="legacy-overline">GRUPO DURALCO</div><h1>Calculadora Corebolt</h1><div className="legacy-subtitle">Precios, procesos, peso y costos</div></div><div className="legacy-mark legacy-mark-bolt">CB</div></header>
 <nav className="legacy-tabs"><Link className="legacy-tab" href="/">← Catálogo</Link><span className="legacy-tab catalog-active">Pernos</span><span className="legacy-tab legacy-tab-disabled">Placas</span><span className="legacy-tab legacy-tab-disabled">Tuercas</span></nav>
 <main className="legacy-main pernos-main"><div className="pernos-caution"><strong>Réplica de prueba V106.62</strong> · Calculadora y lista temporal en memoria. No guarda en SQL, no reserva correlativos ni crea cotizaciones. Precios: valores originales de referencia, no comerciales actuales.</div>
 <details className="pernos-panel"><summary>Parámetros generales <span>▾</span></summary><div className="pernos-panel-body"><p>Parámetros originales, bloqueados hasta incorporar el control de autorizaciones.</p><div className="pernos-grid">{Object.entries(DEFAULT_PARAMS).map(([k,v])=><label key={k}>{k}<input value={k==="isv"||k==="perdida"||k==="utilidad"?(v*100).toString()+" %":String(v)} readOnly/></label>)}</div></div></details>
 <details className="pernos-panel"><summary>Precios de barra (editable) <span>▾</span></summary><div className="pernos-panel-body"><p>Se preservan las {DEFAULT_CONFIG.length} combinaciones de V106.62. La edición queda deshabilitada hasta integrar la autorización y persistencia SQL.</p><div className="pernos-table-wrap"><table><thead><tr><th>Material</th><th>Diámetro</th><th>Norma</th><th>Barra (L)</th><th>Rosca L/pulg</th><th>Doblez (L)</th></tr></thead><tbody>{DEFAULT_CONFIG.map(x=><tr key={x.material+x.diametro}><td>{x.material}</td><td>{x.diametro}</td><td>{x.norma}</td><td>{format(x.precio_barra)}</td><td>{format(x.roscado_lpulg)}</td><td>{format(x.doblez)}</td></tr>)}</tbody></table></div></div></details>
 <section className="pernos-panel" id="bolt-form"><h2 className="pernos-fixed-head">Nuevo perno</h2><form className="pernos-panel-body" onSubmit={add}>
 <label>Detalle (opcional)<input value={b.detalle} onChange={e=>change("detalle",e.target.value)} placeholder="Se genera automático si se deja vacío"/></label>
 <div className="pernos-grid"><label>Tipo de perno<select value={b.tipo} onChange={e=>change("tipo",e.target.value as Perno["tipo"])}>{["RECTO","L","J","DOBLE ROSCA"].map(x=><option key={x}>{x}</option>)}</select></label><label>Material<select value={b.material} onChange={e=>setB(p=>({...p,material:e.target.value,diametro:DEFAULT_CONFIG.find(z=>z.material===e.target.value)?.diametro||""}))}>{materials.map(x=><option key={x}>{x}</option>)}</select></label></div>
 <label>Diámetro<select value={b.diametro} onChange={e=>change("diametro",e.target.value)}>{diametros.map(x=><option key={x.diametro}>{x.diametro}</option>)}</select></label>
 {cfg&&cfg.precio_barra<=0&&<p className="pernos-warning">⚠ Este material/diámetro no tiene precio de barra cargado en la configuración V106.62.</p>}
 {b.material==="BARRA ROSCADA"&&<p className="pernos-warning">Barra roscada ya viene roscada de fábrica. En la versión original se dejan las roscas en 0.</p>}
 <div className="pernos-grid three">{([["cuerpo","Cuerpo (pulg)"],["pata","Pata adicional (pulg)"],["cantidad","Cantidad"],["rosca1","Rosca 1 (pulg)"],["rosca2","Rosca 2 (pulg)"]] as [keyof Perno,string][]).map(([k,label])=><label key={k}>{label}<input type="number" step={k==="cantidad"?"1":"0.01"} value={Number(b[k])} onChange={e=>change(k,Number(e.target.value))}/></label>)}</div>
 <label className="pernos-checkbox"><input type="checkbox" checked={b.clienteLlevaMaterial} onChange={e=>change("clienteLlevaMaterial",e.target.checked)}/>Cliente lleva el material (solo cobrar servicio de roscado/dobles)</label>
 <div className="pernos-grid"><label>Precio manual (bloqueado)<input type="number" disabled value={0} /></label><label>Conversión de cuerpo a metros/pies <input value="Pendiente de equivalencia" disabled/></label></div>
 {error&&<p className="pernos-warning" role="alert">{error}</p>}
 {current&&<p className="pernos-preview">Costo unitario: <strong>{format(current.costo_unit)}</strong> · Venta unit. con ISV: <strong>{format(current.venta_unit)}</strong> · Peso: <strong>{count(current.peso_unit)} kg</strong></p>}
 <button className="pernos-primary" type="submit">{edit===null?"+ Agregar perno":"Guardar cambios"}</button>{edit!==null&&<button type="button" onClick={()=>{setEdit(null);setB(empty)}}>Cancelar edición</button>}
 </form></section>
 <section className="pernos-panel"><h2 className="pernos-fixed-head">Lista de pernos</h2><div className="pernos-panel-body">{rows.length===0?<p>Aún no has agregado pernos.</p>:rows.map((x,i)=>{const r=calcBolt(x,DEFAULT_CONFIG.find(z=>z.material===x.material&&z.diametro===x.diametro));return <div className="pernos-row" key={i}><strong>{x.detalle}</strong><small>{x.material} · {r?.norma} · Ø{x.diametro} · Cant: {x.cantidad}</small><div className="pernos-row-actions"><span>Costo: {format(r?.costo_total||0)} · Venta: {format(r?.venta_total||0)}</span><button type="button" onClick={()=>update(i)}>Editar</button><button type="button" onClick={()=>setRows(old=>old.filter((_,j)=>j!==i))}>Quitar</button></div></div>})}
 <button type="button" onClick={()=>setRows([])} disabled={rows.length===0}>Vaciar lista</button><button type="button" disabled title="Pendiente de migrar el flujo original de Cotización">➡️ Ir a Cotización (pendiente)</button></div></section>
 <footer className="pernos-summary"><strong>Venta total: {format(summary.total)}</strong><div>Costo: {format(summary.cost)} · Peso: {count(summary.weight)} kg</div></footer>
 </main></div>;
}
