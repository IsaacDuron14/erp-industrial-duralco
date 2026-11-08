const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),ts=require("typescript"),vm=require("node:vm"),path=require("node:path");
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,"../lib/corebolt/v10662/placas.ts"),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const out={exports:{}};vm.runInNewContext(code,{exports:out.exports,module:out,Math,Number,String,Object}, {timeout:1500});
const {DEFAULT_CONFIG_PLACAS,DEFAULT_PARAMS_PLACAS,calcPlaca}=out.exports;
const base={espesor:'1/4"',forma:"RECTANGULAR",ancho:300,largo:450,diametro:0,area:0,perimetro:0,agujeros:4,precioagujero:15,cantidad:3,clienteLlevaLamina:false,precioManual:0};
const fixtures=[
 [base,520.7959411231321,598.9153322916019,20.1882375,20],
 [{...base,forma:"CUADRADA",ancho:200,largo:0,agujeros:0},206.52338179676357,237.5018890662781,5.9817,72],
 [{...base,forma:"CIRCULAR",diametro:300,agujeros:2},302.1933781080704,347.52238482428095,10.57053643648766,null],
 [{...base,forma:"PERSONALIZADA",area:123456,perimetro:1400,clienteLlevaLamina:true},335.59055118110234,385.9291338582677,18.46191888,null],
 [{...base,precioManual:900},520.7959411231321,900,20.1882375,20]
];
test("V106.62 placas: 12 espesores y parámetros originales",()=>{
 assert.equal(DEFAULT_CONFIG_PLACAS.length,12);
 assert.equal(DEFAULT_PARAMS_PLACAS.ancho,1219.2);assert.equal(DEFAULT_PARAMS_PLACAS.largo,2438.4);
});
for(const [i,[p,cost,sale,weight,pieces]] of fixtures.entries())test("Paridad placas V106.62 "+(i+1),()=>{
 const r=calcPlaca(p,DEFAULT_CONFIG_PLACAS.find(c=>c.espesor===p.espesor));
 assert.ok(r);assert.ok(Math.abs(r.costo_unit-cost)<1e-8);assert.ok(Math.abs(r.venta_unit-sale)<1e-8);
 assert.ok(Math.abs(r.peso_total-weight)<1e-8);assert.equal(r.piezas_lamina,pieces);
});
