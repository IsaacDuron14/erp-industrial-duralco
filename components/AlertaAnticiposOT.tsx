"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/browser";

export type AnticipoPendiente={id:string;ot_numero:string;cliente:string|null;estado:string;anticipo_requerido:number;anticipo_confirmado:number;anticipo_pendiente:number};
export const ROLES_AVISO=["administrador","gerencia","administracion","administración","finanzas"] as const;
export function puedeVerAviso(rol:string|null|undefined){return ROLES_AVISO.includes((rol||"").trim().toLowerCase() as typeof ROLES_AVISO[number]);}
const keySesion=(userId:string)=>"corebolt2-alerta-ot-"+userId;
export default function AlertaAnticiposOT(){
 const [items,setItems]=useState<AnticipoPendiente[]>([]);
 const [estado,setEstado]=useState<"oculto"|"aviso"|"confirmacion">("oculto");
 const router=useRouter();
 useEffect(()=>{
  let activo=true;
  let sb:ReturnType<typeof createClient>;
  try{sb=createClient();}catch{return;}
  async function verificar(){
   const {data:{user},error}=await sb.auth.getUser();
   if(error||!user||!activo||sessionStorage.getItem(keySesion(user.id))==="visto")return;
   const {data:roles,error:er}=await sb.from("usuarios_empresas").select("empresa_id,rol").eq("usuario_id",user.id).eq("activo",true);
   if(er||!roles?.length||!activo)return;
   const acceso=roles.find(r=>puedeVerAviso(r.rol));if(!acceso)return;
   // Vista invocador con RLS: solo devuelve OT del tenant y rol autorizado.
   // Si aun no existe la vista, ocultar el aviso: nunca inventar datos ni mostrar pendientes de otro tenant.
   const {data,error:ee}=await sb.from("ot_alertas_anticipos").select("id,ot_numero,cliente,estado,anticipo_requerido,anticipo_confirmado,anticipo_pendiente").eq("empresa_id",acceso.empresa_id).limit(100);
   if(ee||!activo||!data?.length)return;
   setItems(data as AnticipoPendiente[]);setEstado("aviso");
  }
  void verificar();
  const {data:sub}=sb.auth.onAuthStateChange((event)=>{if(event==="SIGNED_IN")void verificar();if(event==="SIGNED_OUT"){setEstado("oculto");setItems([]);}});
  return ()=>{activo=false;sub.subscription.unsubscribe();};
 },[]);
 function cerrar(){setEstado("oculto");setItems([]);try{const sb=createClient();void sb.auth.getUser().then(({data})=>{if(data.user)sessionStorage.setItem(keySesion(data.user.id),"visto");});}catch{}}
 function gestionar(){cerrar();router.push("/informes/anticipos");}
 if(estado==="oculto")return null;
 return <div className="ot-alert-backdrop" role="presentation">
  <section role="alertdialog" aria-modal="true" aria-labelledby="ot-alert-title" aria-describedby="ot-alert-desc" className="ot-alert-dialog">
   <div className="ot-alert-symbol" aria-hidden="true">🔔</div>
   {estado==="aviso"?<>
     <h2 id="ot-alert-title">Anticipos y pagos pendientes</h2>
     <p id="ot-alert-desc">Existen <strong>{items.length} Órdenes de Trabajo</strong> con anticipos o pagos pendientes de verificar.</p>
     <p className="ot-alert-muted">Gestiona estos registros para mantener los saldos actualizados.</p>
     <div className="ot-alert-actions"><button type="button" onClick={()=>setEstado("confirmacion")} className="ot-alert-secondary">Salir</button><button type="button" onClick={gestionar}>Gestionar</button></div>
   </>:<>
     <h2 id="ot-alert-title">Atención: gestión pendiente</h2>
     <p id="ot-alert-desc">Tienes {items.length} OT pendientes de gestión. Regulariza los anticipos y pagos para evitar futuras restricciones administrativas en nuevas órdenes.</p>
     <p className="ot-alert-muted">Esta alerta no bloquea el ERP ni la producción.</p>
     <div className="ot-alert-actions"><button type="button" className="ot-alert-secondary" onClick={cerrar}>Continuar</button><button type="button" onClick={gestionar}>Gestionar ahora</button></div>
   </>}
  </section>
 </div>;
}
