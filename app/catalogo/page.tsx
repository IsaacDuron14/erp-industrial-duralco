"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Item = { id:string;codigo:string|null;descripcion:string;familia:string;unidad:string;tipo:string;costo_referencia:number;precio_venta:number;activo:boolean };
type Access = { empresa_id:string;division_id:string;rol:string };
type Draft = {codigo:string;descripcion:string;familia:string;unidad:string;tipo:string;costo_referencia:string;precio_venta:string};
const blank:Draft={codigo:"",descripcion:"",familia:"",unidad:"Unidad",tipo:"material",costo_referencia:"0",precio_venta:"0"};
const types=["perno","placa","tuerca","arandela","tornillo","barra","material","consumible","servicio","otro"];
const supabase=createClient();

export default function Catalogo(){
 const [access,setAccess]=useState<Access|null>(null),[items,setItems]=useState<Item[]>([]),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[q,setQ]=useState(""),[family,setFamily]=useState("todas"),[page,setPage]=useState(0);
 const [editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState<Draft>(blank);
 const canCreate=access!==null&&["administrador","gerencia","ventas","formulacion","compras"].includes(access.rol);
 const canEdit=access!==null&&["administrador","gerencia","formulacion","compras"].includes(access.rol);
 const load=useCallback(async()=>{
  setBusy(true);setError("");
  try{
   const {data:{user},error:ue}=await supabase.auth.getUser();
   if(ue)throw ue;
   if(!user){setAccess(null);setItems([]);return;}
   const {data:m,error:me}=await supabase.from("usuarios_empresas").select("empresa_id,rol").eq("usuario_id",user.id).eq("activo",true).limit(1).maybeSingle();
   if(me)throw me;
   if(!m){setAccess(null);setError("Tu cuenta no tiene membresía habilitada.");return;}
   const {data:d,error:de}=await supabase.from("usuarios_divisiones").select("division_id,divisiones!inner(codigo)").eq("usuario_id",user.id).eq("empresa_id",m.empresa_id);
   if(de)throw de;
   const corebolt=d?.find((x:any)=>x.divisiones?.codigo==="COREBOLT");
   if(!corebolt){setAccess(null);setError("No tienes acceso a la división COREBOLT.");return;}
   setAccess({empresa_id:m.empresa_id,division_id:corebolt.division_id,rol:m.rol});
   const {data:list,error:le}=await supabase.from("catalogo_insumos").select("id,codigo,descripcion,familia,unidad,tipo,costo_referencia,precio_venta,activo").eq("division_id",corebolt.division_id).order("descripcion").limit(1000);
   if(le)throw le;
   setItems(list||[]);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo consultar el catálogo.");}
  finally{setBusy(false);}
 },[]);
 useEffect(()=>{void load();const {data}=supabase.auth.onAuthStateChange(()=>{void load();});return ()=>data.subscription.unsubscribe();},[load]);
 const families=useMemo(()=>["todas",...Array.from(new Set(items.map(x=>x.familia))).sort()], [items]);
 const filtered=useMemo(()=>items.filter(x=>(family==="todas"||x.familia===family)&&[x.codigo,x.descripcion,x.familia,x.tipo].some(s=>(s||"").toLowerCase().includes(q.toLowerCase().trim()))),[items,family,q]);
 const pages=Math.max(1,Math.ceil(filtered.length/10));
 const visible=filtered.slice(Math.min(page,pages-1)*10,Math.min(page,pages-1)*10+10);
 function edit(x:Item){setEditing(x.id);setDraft({codigo:x.codigo||"",descripcion:x.descripcion,familia:x.familia,unidad:x.unidad,tipo:x.tipo,costo_referencia:String(x.costo_referencia),precio_venta:String(x.precio_venta)});setNotice("");}
 function reset(){setEditing(null);setDraft(blank);}
 async function save(e:React.FormEvent){
  e.preventDefault();if(!access||saving||!(editing?canEdit:canCreate))return;
  setError("");setNotice("");
  const cost=Number(draft.costo_referencia),sale=Number(draft.precio_venta);
  if(!draft.descripcion.trim()||!draft.familia.trim()||!draft.unidad.trim()||!Number.isFinite(cost)||cost<0||!Number.isFinite(sale)||sale<0){setError("Revisa descripción, familia, unidad y precios.");return;}
  setSaving(true);
  try{
   const payload={codigo:draft.codigo.trim()||null,descripcion:draft.descripcion.trim(),familia:draft.familia.trim(),unidad:draft.unidad.trim(),tipo:draft.tipo,costo_referencia:cost,precio_venta:sale,actualizado_en:new Date().toISOString()};
   const result=editing?
    await supabase.from("catalogo_insumos").update(payload).eq("id",editing).eq("empresa_id",access.empresa_id).eq("division_id",access.division_id).select("id").single():
    await supabase.from("catalogo_insumos").insert({...payload,empresa_id:access.empresa_id,division_id:access.division_id}).select("id").single();
   if(result.error)throw result.error;
   reset();await load();setNotice(editing?"Artículo actualizado.":"Artículo registrado.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar. Comprueba el código y los permisos.");}
  finally{setSaving(false);}
 }
 return <><header><strong>COREBOLT 2.0 · Catálogo Maestro</strong><div className="row"><Link href="/">Inicio</Link><Link href="/clientes">Clientes</Link></div></header>
 <main><section className="card"><h1>Catálogo técnico y de costos</h1><p className="muted">El catálogo no equivale al inventario físico. Solo muestra referencias técnicas y precios; las existencias se manejarán por movimientos de almacén.</p>
 {error&&<p role="alert" className="danger">{error}</p>}{notice&&<p role="status" className="ok">{notice}</p>}
 {busy?<p>Cargando...</p>:!access?<p>Inicia sesión desde <Link href="/clientes">Clientes</Link> con una cuenta autorizada.</p>:<>
 {(canCreate||canEdit&&editing)&&<section className="card"><h2>{editing?"Editar referencia":"Agregar referencia"}</h2><form onSubmit={save}>
 <div className="grid"><div><label htmlFor="codigo">Código</label><input id="codigo" value={draft.codigo} onChange={e=>setDraft({...draft,codigo:e.target.value})}/></div>
 <div><label htmlFor="descripcion">Descripción *</label><input id="descripcion" required value={draft.descripcion} onChange={e=>setDraft({...draft,descripcion:e.target.value})}/></div>
 <div><label htmlFor="familia">Familia *</label><input id="familia" required value={draft.familia} onChange={e=>setDraft({...draft,familia:e.target.value})}/></div>
 <div><label htmlFor="tipo">Tipo</label><select id="tipo" value={draft.tipo} onChange={e=>setDraft({...draft,tipo:e.target.value})}>{types.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
 <div><label htmlFor="unidad">Unidad *</label><input id="unidad" required value={draft.unidad} onChange={e=>setDraft({...draft,unidad:e.target.value})}/></div>
 <div><label htmlFor="costo">Costo de referencia (L)</label><input id="costo" type="number" min="0" step=".0001" value={draft.costo_referencia} onChange={e=>setDraft({...draft,costo_referencia:e.target.value})}/></div>
 <div><label htmlFor="venta">Precio de venta (L)</label><input id="venta" type="number" min="0" step=".0001" value={draft.precio_venta} onChange={e=>setDraft({...draft,precio_venta:e.target.value})}/></div></div>
 <div className="row"><button disabled={saving}>{saving?"Guardando...":editing?"Actualizar":"Guardar en SQL"}</button>{editing&&<button type="button" onClick={reset}>Cancelar edición</button>}</div></form></section>}
 <div className="row"><div style={{flex:2,minWidth:180}}><label htmlFor="buscar">Buscar referencia</label><input id="buscar" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}} placeholder="Descripción, código, tipo..."/></div><div style={{flex:1,minWidth:160}}><label htmlFor="filtro">Familia</label><select id="filtro" value={family} onChange={e=>{setFamily(e.target.value);setPage(0)}}>{families.map(f=><option key={f}>{f}</option>)}</select></div><button type="button" onClick={()=>void load()}>Actualizar</button></div>
 <div style={{overflowX:"auto",marginTop:20}}><table><thead><tr><th>Código</th><th>Descripción</th><th>Familia</th><th>Tipo</th><th>Unidad</th><th>Costo (L)</th><th>Venta (L)</th><th>Estado</th>{canEdit&&<th>Acción</th>}</tr></thead><tbody>{visible.map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td>{x.descripcion}</td><td>{x.familia}</td><td>{x.tipo}</td><td>{x.unidad}</td><td>{Number(x.costo_referencia).toFixed(2)}</td><td>{Number(x.precio_venta).toFixed(2)}</td><td>{x.activo?"Activo":"Inactivo"}</td>{canEdit&&<td><button type="button" onClick={()=>edit(x)}>Editar</button></td>}</tr>)}</tbody></table></div>
 <div className="row" style={{marginTop:14}}><span className="muted small">{filtered.length} referencias; página {Math.min(page,pages-1)+1} de {pages}. Límite inicial de consulta: 1000.</span><button type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><button type="button" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
 </>}
 </section></main></>;
}
