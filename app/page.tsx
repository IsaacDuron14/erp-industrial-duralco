"use client";
import Link from "next/link";
import {useState} from "react";

type Entry={label:string;href?:string;note?:string};
const sections:{name:string;icon:string;entries:Entry[]}[]=[
{name:"Catálogo",icon:"📋",entries:[{label:"Pernos",href:"/pernos",note:"Réplica de prueba V106.62"},{label:"Placas",href:"/placas",note:"Réplica de prueba V106.62"},{label:"Productos",href:"/productos",note:"Simulador temporal V106.62 sin SQL"}]},
{name:"Ventas",icon:"💼",entries:[{label:"Cotización",note:"Pendiente de integración"},{label:"Recibo",note:"Pendiente de integración"},{label:"Factura",note:"Pendiente de integración"},{label:"Entrega",note:"Pendiente de integración"},{label:"Cliente",href:"/clientes"}]},
{name:"Compras",icon:"🛒",entries:[{label:"Orden Compra",note:"Pendiente de integración"}]},
{name:"Producción",icon:"🏭",entries:[{label:"Orden Trabajo",note:"Pendiente de integración"},{label:"Presupuesto",note:"Pendiente de integración"},{label:"Cierre Real",note:"Pendiente de integración"},{label:"Personal",note:"Pendiente de integración"},{label:"Asistencia",note:"Pendiente de integración"},{label:"Producción",note:"Pendiente de integración"},{label:"Costos",note:"Pendiente de integración"}]},
{name:"Control",icon:"📦",entries:[{label:"Inventario",note:"Pendiente de integración"},{label:"Bancos",note:"Pendiente de integración"},{label:"Cuentas",note:"Pendiente de integración"}]},
{name:"Analítica",icon:"📊",entries:[{label:"Dashboard",note:"Pendiente de integración"},{label:"Informes",note:"Pendiente de integración"},{label:"Finanzas",note:"Pendiente de integración"}]},
{name:"Sistema",icon:"⚙️",entries:[{label:"Aprende",note:"Capacitación pendiente"},{label:"Agente",note:"Pendiente de integración"},{label:"Auditoría",note:"Pendiente de integración"},{label:"Accesos",note:"Administración pendiente"},{label:"Mi cuenta",href:"/cuenta"}]}
];
export default function Home(){
const [active,setActive]=useState("Catálogo");
const section=sections.find(s=>s.name===active)||sections[0];
return <div className="legacy-shell">
<div className="legacy-stripe" />
<header className="legacy-header">
<div className="legacy-mark" aria-label="Grupo Duralco">D</div>
<div className="legacy-brand"><div className="legacy-overline">GRUPO DURALCO</div><h1>Calculadora Corebolt</h1><div className="legacy-subtitle">Precios, procesos, peso y costos</div></div>
<div className="legacy-mark legacy-mark-bolt">CB</div>
</header>
<nav className="legacy-catbar" aria-label="Áreas del ERP">{sections.map(s=><button type="button" key={s.name} className={"legacy-cat"+(active===s.name?" active":"")} onClick={()=>setActive(s.name)} aria-current={active===s.name?"page":undefined}>{s.icon} {s.name}</button>)}</nav>
<nav className="legacy-tabs" aria-label={"Módulos de "+active}>{section.entries.map(e=>e.href?<Link key={e.label} href={e.href} className="legacy-tab">{e.label}</Link>:<span key={e.label} className="legacy-tab legacy-tab-disabled" title={e.note}>{e.label}</span>)}</nav>
<main className="legacy-main">
<div className="legacy-stage"><span className="legacy-status">COREBOLT 2.0 · DESARROLLO SQL</span><h2>{section.icon} {section.name}</h2><p>Conservaremos la interfaz y el flujo de COREBOLT V106.62. Las funciones se irán habilitando al completar y validar su migración a SQL.</p></div>
<div className="legacy-module-grid">{section.entries.map(e=><div className="legacy-module" key={e.label}><h3>{e.label}</h3>{e.href?<><p>Primera integración SQL en pruebas.</p><Link className="legacy-action" href={e.href}>Abrir módulo</Link></>:<><p>{e.note}</p><span className="legacy-soon">Pendiente</span></>}</div>)}</div>
<div className="legacy-footnote">Referencia visual: ERP COREBOLT V106.62 · Sin migración de datos históricos · SOE-HN y ERP anterior sin cambios</div>
</main></div>;
}
