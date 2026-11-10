const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const source=fs.readFileSync(path.join(__dirname,"../lib/corebolt/v10662/productos.ts"),"utf8");
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const out={exports:{}};vm.runInNewContext(code,{exports:out.exports,module:out,Math,Number,String,Object},{timeout:1500});
const {calcTuerca,LEGACY_CATEGORIAS}=out.exports;
test("Productos: catálogo temporal sin precios de origen inventados",()=>{
 assert.deepEqual(Array.from(LEGACY_CATEGORIAS),["TUERCA A563","TUERCA 2H","ARANDELA F436","ARANDELA PRESION"]);
});
test("Productos: subtotal de varias líneas independiente por categoría",()=>{
 const a=calcTuerca({tipo:"TUERCA 2H",diametro:'3/4"',cantidad:12,precioManual:0},{tipo:"TUERCA 2H",diametro:'3/4"',precio_unit:20});
 const b=calcTuerca({tipo:"ARANDELA F436",diametro:'3/4"',cantidad:30,precioManual:0},{tipo:"ARANDELA F436",diametro:'3/4"',precio_unit:3});
 assert.equal(a.costo_total+b.costo_total,330);
 assert.ok(Math.abs(a.venta_total+b.venta_total-379.5)<1e-8);
});
test("Productos: precio manual no añade impuesto de nuevo",()=>{
 const r=calcTuerca({tipo:"TUERCA 2H",diametro:'3/4"',cantidad:5,precioManual:35},{tipo:"TUERCA 2H",diametro:'3/4"',precio_unit:20});
 assert.equal(r.venta_total,175);
});
test("Productos: falta de precio configurado no crea producto calculado",()=>{
 assert.equal(calcTuerca({tipo:"TUERCA A563",diametro:'1/2"',cantidad:4,precioManual:0},undefined),null);
});
