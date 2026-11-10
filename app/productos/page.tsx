"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {calcTuerca,LEGACY_CATEGORIAS,type Producto,type ProductoConfig} from "@/lib/corebolt/v10662/productos";
type Linea={id:number;producto:Producto;config:ProductoConfig};
const dinero=(n:number)=>"L "+n.toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
const inicial:Producto={tipo:LEGACY_CATEGORIAS[0],diametro:"",cantidad:1,precioManual:0,detalle:""};
export default function ProductosPage(){
 const [form,setForm]=useState<Producto>(inicial);
 const [costo,setCosto]=useState("");
 const [lineas,setLineas]=useState<Linea[]>([]);
 const [editing,setEditing]=useState<number|null>(null);
 const [seq,setSeq]=useState(1);
 const [mensaje,setMensaje]=useState("");
 const [busqueda,setBusqueda]=useState("");
 const numeroCosto=Number(costo);
 const config:ProductoConfig|undefined=form.tipo&&form.diametro.trim()&&costo.trim()!==""&&Number.isFinite(numeroCosto)&&numeroCosto>=0?{tipo:form.tipo,diametro:form.diametro.trim(),precio_unit:numeroCosto}:undefined;
 const calculo=config?calcTuerca(form,config):null;
 const totales=useMemo(()=>lineas.reduce((s,l)=>{const v=calcTuerca(l.producto,l.config);return {costo:s.costo+(v?.costo_total||0),venta:s.venta+(v?.venta_total||0),unidades:s.unidades+l.producto.cantidad}},{costo:0,venta:0,unidades:0}),[lineas]);
 const cambiar=(k:keyof Producto,value:string|number)=>setForm(p=>({...p,[k]:value}));
 function guardar(e:React.FormEvent){
  e.preventDefault();setMensaje("");
  if(!config||!Number.isInteger(form.cantidad)||form.cantidad<=0||!Number.isFinite(form.precioManual)||form.precioManual<0){setMensaje("Revise medida, costo, cantidad entera positiva y precio manual.");return;}
  if(config.precio_unit===0&&form.precioManual===0){setMensaje("No existe un precio de referencia. Introduzca un costo o precio manual para la simulación.");return;}
  const nuevo:Linea={id:editing??seq,producto:{...form,diametro:form.diametro.trim(),detalle:form.detalle?.trim()},config:{...config}};
  setLineas(prev=>editing===null?[...prev,nuevo]:prev.map(l=>l.id===editing?nuevo:l));
  if(editing===null)setSeq(x=>x+1);
  setEditing(null);setForm(inicial);setCosto("");setMensaje("Línea guardada solamente en memoria. No se creó registro SQL.");
 }
 function editar(l:Linea){setEditing(l.id);setForm({...l.producto});setCosto(String(l.config.precio_unit));window.scrollTo({top:0,behavior:"smooth"});}
 const filtradas=lineas.filter(l=>[l.producto.tipo,l.producto.diametro,l.producto.detalle||""].some(v=>v.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es"))));
 return <div className="legacy-shell pernos-shell"><div className="legacy-stripe"/><header className="legacy-header"><div className="legacy-mark">D</div><div className="legacy-brand"><div className="legacy-overline">GRUPO DURALCO</div><h1>Productos · COREBOLT</h1><div className="legacy-subtitle">Tuercas, arandelas y accesorios</div></div><div className="legacy-mark legacy-mark-bolt">CB</div></header>
 <nav className="legacy-tabs"><Link className="legacy-tab" href="/">← Catálogo</Link><Link className="legacy-tab" href="/pernos">Pernos</Link><Link className="legacy-tab" href="/placas">Placas</Link><span className="legacy-tab catalog-active">Productos</span></nav>
 <main className="legacy-main pernos-main">
 <div className="pernos-caution"><strong>Simulador de equivalencia V106.62.</strong> El catálogo histórico no viene precargado: el costo y precio que introduzca sirven exclusivamente para la simulación. No se crea inventario, correlativo, cotización ni registro SQL. Los valores se pierden al recargar.</div>
 <section className="pernos-panel"><h2 className="pernos-fixed-head">{editing===null?"Agregar producto de prueba":"Editar producto de prueba"}</h2><form className="pernos-panel-body" onSubmit={guardar}>
 <div className="pernos-grid"><label>Categoría<select value={form.tipo} onChange={e=>cambiar("tipo",e.target.value)}>{LEGACY_CATEGORIAS.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Diámetro / medida<input required value={form.diametro} onChange={e=>cambiar("diametro",e.target.value)} placeholder={'Ej.: 3/4"'} /></label></div>
 <div className="pernos-grid three"><label>Cantidad<input type="number" min="1" step="1" required value={form.cantidad} onChange={e=>cambiar("cantidad",Number(e.target.value))}/></label><label>Costo unitario de prueba (L)<input type="number" min="0" step="0.0001" required value={costo} onChange={e=>setCosto(e.target.value)}/></label><label>Precio manual opcional (L)<input type="number" min="0" step="0.0001" value={form.precioManual} onChange={e=>cambiar("precioManual",Number(e.target.value))}/></label></div>
 <label>Detalle opcional<input value={form.detalle||""} onChange={e=>cambiar("detalle",e.target.value)} placeholder="Observaciones de referencia"/></label>
 {calculo&&<p className="pernos-preview">Costo: <strong>{dinero(calculo.costo_total)}</strong> · Venta de prueba: <strong>{dinero(calculo.venta_total)}</strong> · ISV de referencia: 15 % (según fórmula heredada, salvo precio manual).</p>}
 {mensaje&&<p className="pernos-warning" role="status">{mensaje}</p>}
 <button className="pernos-primary" type="submit">{editing===null?"+ Agregar a lista temporal":"Guardar edición temporal"}</button>{editing!==null&&<button type="button" onClick={()=>{setEditing(null);setForm(inicial);setCosto("");}}>Cancelar edición</button>}
 </form></section>
 <section className="pernos-panel"><h2 className="pernos-fixed-head">Lista temporal de productos</h2><div className="pernos-panel-body"><label>Buscar en lista<input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Categoría, medida o detalle"/></label>
 <p>{filtradas.length} de {lineas.length} producto(s) mostrados</p>
 {filtradas.map(l=>{const r=calcTuerca(l.producto,l.config);return <div className="pernos-row" key={l.id}><strong>{l.producto.tipo} · {l.producto.diametro}</strong><small>{l.producto.detalle||"Sin detalle"} · Cantidad: {l.producto.cantidad} · Costo unitario: {dinero(l.config.precio_unit)}</small><div className="pernos-row-actions"><span>Costo total {dinero(r?.costo_total||0)} · Venta {dinero(r?.venta_total||0)}</span><button type="button" onClick={()=>editar(l)}>Editar</button><button type="button" onClick={()=>{setLineas(p=>p.filter(x=>x.id!==l.id));if(editing===l.id){setEditing(null);setForm(inicial);setCosto("");}}}>Quitar</button></div></div>})}
 {!filtradas.length&&<p>No hay productos que mostrar.</p>}
 <button type="button" disabled={!lineas.length} onClick={()=>{setLineas([]);setEditing(null);setForm(inicial);setCosto("");}}>Vaciar lista</button></div></section>
 <footer className="pernos-summary"><strong>Venta simulada: {dinero(totales.venta)}</strong><div>Costo: {dinero(totales.costo)} · Unidades: {totales.unidades}</div></footer>
 </main></div>;
}
