"use client";
import {useState,useMemo} from "react";
import Link from "next/link";
import {calcPlaca,DEFAULT_CONFIG_PLACAS,DEFAULT_PARAMS_PLACAS,type Placa} from "@/lib/corebolt/v10662/placas";
const init:Placa={espesor:'1/4"',forma:"RECTANGULAR",ancho:0,largo:0,diametro:0,area:0,perimetro:0,agujeros:0,precioagujero:0,cantidad:1,clienteLlevaLamina:false,precioManual:0};
const m=(n:number)=>"L "+n.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function Placas(){
 const [p,setP]=useState<Placa>(init),[rows,setRows]=useState<Placa[]>([]),[edit,setEdit]=useState<number|null>(null),[error,setError]=useState("");
 const cfg=DEFAULT_CONFIG_PLACAS.find(c=>c.espesor===p.espesor),result=calcPlaca(p,cfg);
 const total=useMemo(()=>rows.reduce((s,x)=>{const c=DEFAULT_CONFIG_PLACAS.find(y=>y.espesor===x.espesor);const r=calcPlaca(x,c);return {sale:s.sale+(r?.venta_total||0),cost:s.cost+(r?.costo_total||0),weight:s.weight+(r?.peso_total||0)}},{sale:0,cost:0,weight:0}),[rows]);
 function field<K extends keyof Placa>(k:K,v:Placa[K]){setP(old=>({...old,[k]:v}));}
 function add(e:React.FormEvent){e.preventDefault();setError("");
 if(!cfg||cfg.precio_lamina<=0){setError("En V106.62, este espesor no tiene precio de lámina cargado.");return;}
 if(p.cantidad<=0||!Number.isFinite(p.cantidad)){setError("Cantidad inválida.");return;}
 setRows(old=>edit===null?[...old,{...p}]:old.map((x,i)=>i===edit?{...p}:x));setP(init);setEdit(null);}
 return <div className="legacy-shell pernos-shell"><div className="legacy-stripe"/><header className="legacy-header"><div className="legacy-mark">D</div><div className="legacy-brand"><div className="legacy-overline">GRUPO DURALCO</div><h1>Calculadora Corebolt</h1><div className="legacy-subtitle">Placas · Corte · Peso</div></div><div className="legacy-mark legacy-mark-bolt">CB</div></header>
 <nav className="legacy-tabs"><Link href="/" className="legacy-tab">← Catálogo</Link><Link href="/pernos" className="legacy-tab">Pernos</Link><span className="legacy-tab catalog-active">Placas</span></nav>
 <main className="legacy-main pernos-main"><div className="pernos-caution"><strong>Réplica de pruebas V106.62.</strong> Los cálculos usan configuraciones originales. Lista temporal; sin guardar datos, emitir documentos ni descontar inventario.</div>
 <details className="pernos-panel"><summary>Parámetros generales ▾</summary><div className="pernos-panel-body"><p>Parámetros originales bloqueados.</p><div className="pernos-grid">{Object.entries(DEFAULT_PARAMS_PLACAS).map(([k,v])=><label key={k}>{k}<input readOnly value={k==="perdida"||k==="utilidad"||k==="isv"?v*100+" %":v}/></label>)}</div></div></details>
 <details className="pernos-panel"><summary>Precios de lámina (editable) ▾</summary><div className="pernos-panel-body"><p>Se preservan {DEFAULT_CONFIG_PLACAS.length} espesores de referencia; edición pendiente de permisos y SQL.</p><div className="pernos-table-wrap"><table><thead><tr><th>Espesor</th><th>mm</th><th>Precio lámina</th><th>Corte L/pulg</th></tr></thead><tbody>{DEFAULT_CONFIG_PLACAS.map(x=><tr key={x.espesor}><td>{x.espesor}</td><td>{x.espesor_mm}</td><td>{m(x.precio_lamina)}</td><td>{m(x.corte_lpulg)}</td></tr>)}</tbody></table></div></div></details>
 <section className="pernos-panel"><h2 className="pernos-fixed-head">Nueva placa</h2><form onSubmit={add} className="pernos-panel-body">
 <div className="pernos-grid"><label>Espesor<select value={p.espesor} onChange={e=>field("espesor",e.target.value)}>{DEFAULT_CONFIG_PLACAS.map(x=><option key={x.espesor}>{x.espesor}</option>)}</select></label>
 <label>Forma<select value={p.forma} onChange={e=>field("forma",e.target.value as Placa["forma"])}>{["RECTANGULAR","CUADRADA","CIRCULAR","PERSONALIZADA"].map(x=><option key={x}>{x}</option>)}</select></label></div>
 <div className="pernos-grid three">
 {(p.forma==="RECTANGULAR"||p.forma==="CUADRADA")&&<label>Ancho (mm)<input type="number" step=".01" value={p.ancho} onChange={e=>field("ancho",Number(e.target.value))}/></label>}
 {p.forma==="RECTANGULAR"&&<label>Largo (mm)<input type="number" step=".01" value={p.largo} onChange={e=>field("largo",Number(e.target.value))}/></label>}
 {p.forma==="CIRCULAR"&&<label>Diámetro (mm)<input type="number" step=".01" value={p.diametro} onChange={e=>field("diametro",Number(e.target.value))}/></label>}
 {p.forma==="PERSONALIZADA"&&<><label>Área (mm²)<input type="number" step=".01" value={p.area} onChange={e=>field("area",Number(e.target.value))}/></label><label>Perímetro (mm)<input type="number" step=".01" value={p.perimetro} onChange={e=>field("perimetro",Number(e.target.value))}/></label></>}
 <label>Cantidad<input type="number" step="1" value={p.cantidad} onChange={e=>field("cantidad",Number(e.target.value))}/></label>
 <label>Agujeros<input type="number" step="1" value={p.agujeros} onChange={e=>field("agujeros",Number(e.target.value))}/></label>
 <label>Precio / agujero (L)<input type="number" step=".01" value={p.precioagujero} onChange={e=>field("precioagujero",Number(e.target.value))}/></label>
 </div>
 <label className="pernos-checkbox"><input type="checkbox" checked={p.clienteLlevaLamina} onChange={e=>field("clienteLlevaLamina",e.target.checked)}/>El cliente lleva la lámina (solo cobrar corte y agujeros)</label>
 {error&&<p role="alert" className="pernos-warning">{error}</p>}
 {cfg&&cfg.precio_lamina<=0&&<p className="pernos-warning">⚠ Precio de lámina no cargado; V106.62 no permite agregar esta placa.</p>}
 {result&&<p className="pernos-preview">Costo unit.: <strong>{m(result.costo_unit)}</strong> · Venta unit.: <strong>{m(result.venta_unit)}</strong> · Peso: <strong>{result.peso_unit.toFixed(2)} kg</strong> · Piezas/lámina: <strong>{result.piezas_lamina??"—"}</strong></p>}
 <button type="submit" className="pernos-primary">{edit===null?"+ Agregar placa":"Guardar cambios"}</button>{edit!==null&&<button type="button" onClick={()=>{setEdit(null);setP(init)}}>Cancelar edición</button>}
 </form></section>
 <section className="pernos-panel"><h2 className="pernos-fixed-head">Lista de placas</h2><div className="pernos-panel-body">{rows.length===0?<p>Aún no has agregado placas.</p>:rows.map((x,i)=>{const r=calcPlaca(x,DEFAULT_CONFIG_PLACAS.find(y=>y.espesor===x.espesor));return <div className="pernos-row" key={i}><strong>Placa {x.forma} · {x.espesor} · Cant. {x.cantidad}</strong><small>Venta total: {m(r?.venta_total||0)} · Peso total: {(r?.peso_total||0).toFixed(2)} kg</small><div className="pernos-row-actions"><button type="button" onClick={()=>{setP({...x});setEdit(i)}}>Editar</button><button type="button" onClick={()=>setRows(old=>old.filter((_,j)=>j!==i))}>Quitar</button></div></div>})}<button type="button" onClick={()=>setRows([])} disabled={rows.length===0}>Vaciar lista</button><button type="button" disabled>➡️ Ir a Cotización (pendiente)</button></div></section>
 <footer className="pernos-summary"><strong>Venta total: {m(total.sale)}</strong><div>Costo: {m(total.cost)} · Peso: {total.weight.toFixed(2)} kg</div></footer>
 </main></div>;
}
