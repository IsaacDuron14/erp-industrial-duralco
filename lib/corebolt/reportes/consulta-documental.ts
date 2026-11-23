/**
 * COREBOLT 2.0 — única política para consultas de informes y listados.
 * No hace escrituras ni repara históricos. Apto para resultados SQL.
 */
export type EstadoDocumento = "vigente" | "anulado" | "eliminado" | "archivado";
export type DocumentoConsulta = {
 id:string; numero_original:string; fecha:string|null;
 estado?: string|null; nulo?:boolean|null; anulada?:boolean|null;
 eliminado_en?:string|null; unidades?:number|null; monto?:number|null;
};
export type FiltroConsulta = {
 desde?:string; hasta?:string;
 estados?:readonly EstadoDocumento[];
};
export function estadoCanonico(d:DocumentoConsulta):EstadoDocumento{
 const e=String(d.estado||"").trim().toLowerCase();
 if(d.eliminado_en||e==="eliminado"||e==="eliminada")return "eliminado";
 if(d.nulo||d.anulada||["anulada","anulado","nula","nulo","cancelado","cancelada"].includes(e))return "anulado";
 if(["archivado","archivada"].includes(e))return "archivado";
 return "vigente";
}
export function consultarDocumentos<T extends DocumentoConsulta>(rows:readonly T[], filtro:FiltroConsulta={}):T[]{
 const permitidos=filtro.estados||["vigente"];
 const vistos=new Set<string>();
 return rows.filter(r=>{
  if(!r||!r.id||vistos.has(r.id))return false;
  vistos.add(r.id);
  if(!permitidos.includes(estadoCanonico(r)))return false;
  // Fechas de ISO YYYY-MM-DD. Fechas ausentes quedan fuera al filtrar períodos.
  if(filtro.desde&&(!r.fecha||r.fecha<filtro.desde))return false;
  if(filtro.hasta&&(!r.fecha||r.fecha>filtro.hasta))return false;
  return true;
 });
}
export function resumenDocumentos<T extends DocumentoConsulta>(rows:readonly T[], filtro:FiltroConsulta={}){
 const seleccion=consultarDocumentos(rows,filtro);
 return {cantidad:seleccion.length,unidades:seleccion.reduce((s,r)=>s+(Number.isFinite(r.unidades)?Number(r.unidades):0),0),
  monto:seleccion.reduce((s,r)=>s+(Number.isFinite(r.monto)?Number(r.monto):0),0),
  registros:seleccion};
}
export function compararModulosEInformes<T extends DocumentoConsulta>(rowsModulo:readonly T[],rowsInforme:readonly T[]){
 const m=new Set(rowsModulo.map(r=>r.id));const i=new Set(rowsInforme.map(r=>r.id));
 return {soloModulo:rowsModulo.filter(r=>!i.has(r.id)).map(r=>r.id),
 soloInforme:rowsInforme.filter(r=>!m.has(r.id)).map(r=>r.id),
 mismoConjunto:m.size===i.size&&[...m].every(id=>i.has(id))};
}
