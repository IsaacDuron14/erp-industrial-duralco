"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/browser";
import {puedeVerAviso,type AnticipoPendiente} from "@/components/AlertaAnticiposOT";
const money=(n:number)=>"L "+Number(n||0).toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function InformeAnticipos(){
 const [items,setItems]=useState<AnticipoPendiente[]>([]);
 const [cargando,setCargando]=useState(true);
 const [mensaje,setMensaje]=useState("");
 const [acceso,setAcceso]=useState(false);
 async function cargar(){
  setCargando(true);setMensaje("");
  try{
   const sb=createClient();
   const {data:{user},error:authError}=await sb.auth.getUser();
   if(authError||!user){setMensaje("Inicia sesión para consultar anticipos.");setAcceso(false);return;}
   const {data:permisos,error:ep}=await sb.from("usuarios_empresas").select("empresa_id,rol").eq("usuario_id",user.id).eq("activo",true);
   if(ep)throw ep;
   const p=permisos?.find(v=>puedeVerAviso(v.rol));
   if(!p){setMensaje("No tienes permiso para consultar anticipos de OT.");setAcceso(false);return;}
   setAcceso(true);
   const {data,error}=await sb.from("ot_alertas_anticipos").select("id,ot_numero,cliente,estado,anticipo_requerido,anticipo_confirmado,anticipo_pendiente").eq("empresa_id",p.empresa_id).order("ot_numero",{ascending:false}).limit(200);
   if(error){setMensaje("La consulta SQL de anticipos aún no está activada o no está disponible. No se muestran cifras sin verificar.");return;}
   setItems((data||[]) as AnticipoPendiente[]);
  }catch{setMensaje("No fue posible consultar los anticipos en SQL.");}
  finally{setCargando(false);}
 }
 useEffect(()=>{void cargar();},[]);
 return <div className="legacy-shell"><div className="legacy-stripe"/><header className="legacy-header"><strong>COREBOLT 2.0 · Informes</strong><Link href="/">Volver al panel</Link></header><main className="legacy-main">
 <section className="pernos-panel"><h1 className="pernos-fixed-head">OT con anticipos y pagos por verificar</h1><div className="pernos-panel-body">
 <p>Consulta administrativa, no modifica OT, recibos, cuentas ni pagos. Los importes deben provenir de pagos efectivamente registrados y conciliados.</p>
 <button type="button" onClick={()=>void cargar()}>Actualizar</button>
 {cargando?<p>Cargando información autorizada…</p>:mensaje?<p role="status" className="pernos-warning">{mensaje}</p>:acceso?<><div className="pernos-table-wrap"><table><thead><tr><th>OT</th><th>Cliente</th><th>Estado</th><th>Requerido</th><th>Confirmado</th><th>Pendiente</th></tr></thead><tbody>{items.map(it=><tr key={it.id}><td>{it.ot_numero}</td><td>{it.cliente||"—"}</td><td>{it.estado}</td><td>{money(it.anticipo_requerido)}</td><td>{money(it.anticipo_confirmado)}</td><td>{money(it.anticipo_pendiente)}</td></tr>)}</tbody></table></div><p>{items.length} órdenes pendientes.</p>{items.length===0&&<p>No se registran pendientes según la consulta SQL actual.</p>}</>:null}
 </div></section></main></div>;
}
