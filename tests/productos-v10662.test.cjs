const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const source=fs.readFileSync(path.join(__dirname,"../lib/corebolt/v10662/productos.ts"),"utf8");
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const out={exports:{}};vm.runInNewContext(code,{exports:out.exports,module:out,Math,Number,String,Object}, {timeout:1500});
const {DEFAULT_PARAMS_PRODUCTOS,LEGACY_CATEGORIAS,calcTuerca,findProductKey}=out.exports;
test("V106.62 productos: sin precios iniciales inventados",()=>{assert.equal(LEGACY_CATEGORIAS.length,4);assert.equal(DEFAULT_PARAMS_PRODUCTOS.isv,0.15)});
test("Precio y subtotal de producto equivalentes a V106.62",()=>{
 const cfg={tipo:"TUERCA 2H",diametro:'3/4"',precio_unit:20};
 const r=calcTuerca({tipo:cfg.tipo,diametro:cfg.diametro,cantidad:12,precioManual:0},cfg);
 assert.ok(r);assert.equal(r.costo_total,240);assert.ok(Math.abs(r.venta_total-276)<1e-8);
 const m=calcTuerca({tipo:cfg.tipo,diametro:cfg.diametro,cantidad:12,precioManual:35},cfg);
 assert.ok(m);assert.equal(m.venta_total,420);
});
test("Búsqueda canónica de tipo y medida",()=>{
 const catalogo={"TUERCA 2H|3/4":{tipo:"TUERCA 2H",diametro:'3/4"',precio_unit:20}};
 assert.equal(findProductKey(" tuerca 2h ",' 3/4" ',catalogo),"TUERCA 2H|3/4");
});
