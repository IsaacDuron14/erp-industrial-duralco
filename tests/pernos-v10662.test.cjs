// Casos extraídos de la ejecución del calcBolt original V106.62, sin modificar su código.
// El test compila la librería nueva y compara valores de referencia del legado.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
const vm=require("node:vm");
const path=require("node:path");
const file=fs.readFileSync(path.join(__dirname,"../lib/corebolt/v10662/pernos.ts"),"utf8");
const code=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const out={exports:{}};
vm.runInNewContext(code,{module:out,exports:out.exports,console,Math,Number,Set,String,Object}, {timeout:1500});
const {DEFAULT_CONFIG,DEFAULT_PARAMS,calcBolt,buildBoltDetalle,sufijoClienteMaterial}=out.exports;
function sample(x){return {detalle:"",tipo:"RECTO",material:"1018",diametro:'1/2"',cuerpo:24,pata:0,rosca1:4,rosca2:0,cantidad:10,precioManual:0,clienteLlevaMaterial:false,...x};}
const cases=[
 {b:sample({}),venta:165.5220338983051,costo:143.93220338983053,peso:6.061944255435003},
 {b:sample({material:"1045",diametro:'3/4"',tipo:"L",cuerpo:36,pata:6,rosca1:5,rosca2:0,cantidad:8}),venta:488.63305084745764,costo:424.8983050847458,peso:19.095124404620265},
 {b:sample({material:"1018",diametro:'1"',tipo:"J",cuerpo:48,pata:7,rosca1:4,rosca2:0,cantidad:5,clienteLlevaMaterial:true}),venta:240.35000000000002,costo:209.00000000000003,peso:27.783911170743764},
 {b:sample({material:"1018",diametro:'2"',tipo:"DOBLE ROSCA",cuerpo:24,pata:0,rosca1:3,rosca2:4,cantidad:3,precioManual:555}),venta:555,costo:1516.8813559322036,peso:29.097332426088016},
 {b:sample({material:"1252",diametro:'1"',tipo:"RECTO",cuerpo:24,pata:0,rosca1:0,rosca2:0,cantidad:2}),venta:0,costo:0,peso:4.849555404348003}
];
test("V106.62 contiene las 32 combinaciones de fábrica",()=>assert.equal(DEFAULT_CONFIG.length,32));
test("Los parámetros original V106.62 no fueron modificados",()=>assert.equal(JSON.stringify(DEFAULT_PARAMS),JSON.stringify({perdida:0.10,utilidad:0,isv:0.15,corte:0,densidad:7850})));
cases.forEach((c,i)=>test("Paridad de cálculos original caso "+(i+1),()=>{
 const cfg=DEFAULT_CONFIG.find(x=>x.material===c.b.material&&x.diametro===c.b.diametro);
 const r=calcBolt(c.b,cfg);
 assert.ok(r);
 assert.ok(Math.abs(r.venta_unit-c.venta)<1e-8);
 assert.ok(Math.abs(r.costo_unit-c.costo)<1e-8);
 assert.ok(Math.abs(r.peso_total-c.peso)<1e-8);
 assert.ok(Math.abs(r.venta_total-r.venta_unit*c.b.cantidad)<1e-8);
}));
test("El cliente aporta material: su costo se excluye de la cotización",()=>{const b=sample({clienteLlevaMaterial:true});assert.equal(calcBolt(b,DEFAULT_CONFIG[0]).material_unit,0)});
test("Detalle y sufijo conservan comportamiento original",()=>{
 const b=sample({tipo:"J",pata:5});
 assert.equal(buildBoltDetalle(b),'Perno-F1554(G36) Dia 1/2" -4"R -Largo 24" -Tipo J5"');
 assert.equal(sufijoClienteMaterial(b)," SERVICIO DE ROSCADO Y DOBLES (CLIENTE LLEVA MATERIAL)");
});
