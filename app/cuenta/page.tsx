"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
const EMAIL="duralconstructores@gmail.com";
export default function Cuenta(){
  const [email,setEmail]=useState(EMAIL);
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [signedIn,setSignedIn]=useState(false);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    try {
      const sb=createClient();
      sb.auth.getUser().then(({data})=>{setSignedIn(!!data.user);setReady(true);}).catch(()=>setReady(true));
      const {data}=sb.auth.onAuthStateChange((_event,session)=>{setSignedIn(!!session?.user);});
      return ()=>data.subscription.unsubscribe();
    } catch{setError("Falta configurar la conexión Supabase en este entorno.");setReady(true);}
  },[]);
  async function recuperar(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError("");setMessage("");
    try{
      const sb=createClient();
      const {error}=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/cuenta"});
      if(error)throw error;
      setMessage("Si la cuenta está registrada, recibirás un correo para establecer una nueva contraseña. Revisa también Spam.");
    }catch(e){setError(e instanceof Error?e.message:"No fue posible solicitar el cambio de contraseña.");}
    finally{setLoading(false);}
  }
  async function cambiar(e:React.FormEvent){
    e.preventDefault();setError("");setMessage("");
    if(password.length<12){setError("Utiliza una contraseña de al menos 12 caracteres.");return;}
    if(password!==confirm){setError("Las contraseñas no coinciden.");return;}
    setLoading(true);
    try{
      const sb=createClient();
      const {error}=await sb.auth.updateUser({password});
      if(error)throw error;
      setPassword("");setConfirm("");setMessage("Contraseña actualizada correctamente.");
    }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar la contraseña.");}
    finally{setLoading(false);}
  }
  return <><header><strong>COREBOLT 2.0 · Cuenta</strong><Link href="/clientes">Volver al acceso</Link></header>
    <main><section className="card" style={{maxWidth:600,margin:"0 auto"}}>
      <h1>Seguridad de cuenta</h1>
      <p className="muted">Puedes solicitar un enlace de recuperación o cambiar la contraseña después de iniciar sesión.</p>
      {error&&<p className="danger" role="alert">{error}</p>}
      {message&&<p className="ok" role="status">{message}</p>}
      {!ready?<p>Verificando sesión...</p>:signedIn?
        <form onSubmit={cambiar}><h2>Cambiar contraseña</h2>
          <label htmlFor="nueva">Nueva contraseña</label><input id="nueva" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/>
          <label htmlFor="confirmar" style={{marginTop:14}}>Confirmar contraseña</label><input id="confirmar" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/>
          <p className="small muted">Mínimo 12 caracteres. Evita contraseñas comunes o reutilizadas.</p><button disabled={loading}>Guardar nueva contraseña</button>
        </form>:
        <form onSubmit={recuperar}><h2>Recuperar acceso</h2>
          <label htmlFor="correo">Correo de la cuenta</label><input id="correo" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
          <p className="small muted">El enlace solo funcionará si el administrador ya creó la cuenta en Supabase Auth y autorizó la URL de retorno.</p>
          <button disabled={loading}>Enviar enlace para cambiar contraseña</button>
        </form>}
    </section></main></>;
}
