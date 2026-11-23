const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const s=fs.readFileSync(path.join(__dirname,"../lib/corebolt/reportes/consulta-documental.ts"),"utf8");
const code=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const box={exports:{}};vm.runInNewContext(code,{exports:box.exports,module:box,Number,Set,String},{timeout:2000});
const {consultarDocumentos,resumenDocumentos,compararModulosEInformes,estadoCanonico}=box.exports;
const ot=[
{id:"ot-a",numero_original:"00082",estado:"En ejecución",fecha:"2026-10-28",unidades:18},
{id:"ot-b",numero_original:"00081",estado:"Anulada",fecha:"2026-10-28",unidades:99},
{id:"ot-c",numero_original:"00080",estado:"En ejecución",fecha:"2026-09-11",eliminado_en:"2026-10-29",unidades:48},
{id:"ot-d",numero_original:"00079",estado:"Finalizada",fecha:"2026-10-29",unidades:6},
{id:"ot-d",numero_original:"00079",estado:"Finalizada",fecha:"2026-10-29",unidades:6}
];
test("OT: informe y listado comparten mismo selector y excluyen anuladas/eliminadas",()=>{
 const panel=consultarDocumentos(ot,{desde:"2026-10-01",hasta:"2026-10-31"});
 const informe=consultarDocumentos(ot,{desde:"2026-10-01",hasta:"2026-10-31"});
 assert.deepEqual(panel.map(x=>x.id),["ot-a","ot-d"]);
 assert.equal(compararModulosEInformes(panel,informe).mismoConjunto,true);
 assert.equal(resumenDocumentos(ot,{desde:"2026-10-01",hasta:"2026-10-31"}).unidades,24);
});
test("OT: anulada conserva trazabilidad consultable separadamente",()=>{
 const anexos=consultarDocumentos(ot,{estados:["anulado","eliminado"]});
 assert.deepEqual(anexos.map(x=>x.id),["ot-b","ot-c"]);
});
test("OT: fecha faltante no puede entrar en período y números similares no identifican documento",()=>{
 const input=[{id:"1",numero_original:"0001",fecha:null},{id:"2",numero_original:"00011",fecha:"2026-10-29"}];
 assert.deepEqual(consultarDocumentos(input,{desde:"2026-10-01"}).map(x=>x.id),["2"]);
 assert.deepEqual(compararModulosEInformes([input[0]],[input[1]]).soloModulo,["1"]);
});
test("OT: diferentes listas se detectan, nunca se inventa conciliación",()=>{
 const panel=consultarDocumentos(ot), informe=consultarDocumentos(ot).filter(r=>r.id!=="ot-a");
 const delta=compararModulosEInformes(panel,informe);
 assert.equal(delta.mismoConjunto,false);assert.deepEqual(delta.soloModulo,["ot-a"]);
});
test("Estados heredados 'nulo' y 'anulada' no entran en totales vigentes",()=>{
 assert.equal(estadoCanonico({id:"x",numero_original:"1",fecha:null,nulo:true}),"anulado");
 assert.equal(estadoCanonico({id:"x",numero_original:"1",fecha:null,anulada:true}),"anulado");
});
