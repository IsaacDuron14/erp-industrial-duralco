// Productos/tuercas V106.62: el catálogo original comienza vacío y procede del respaldo.
// No inventamos precios ni productos al clonar.
export type ProductoConfig={tipo:string;diametro:string;precio_unit:number};
export type Producto={tipo:string;diametro:string;cantidad:number;precioManual:number;detalle?:string};
export const DEFAULT_PARAMS_PRODUCTOS={utilidad:0,isv:0.15};
export const LEGACY_CATEGORIAS=["TUERCA A563","TUERCA 2H","ARANDELA F436","ARANDELA PRESION"];
export function findProductKey(tipo:string,dia:string,catalogo:Record<string,ProductoConfig>){
 const canon=(s:string)=>s.trim().toLowerCase();
 return Object.keys(catalogo).find(k=>canon(catalogo[k].tipo)===canon(tipo)&&canon(catalogo[k].diametro)===canon(dia))||null;
}
export function calcTuerca(x:Producto,c:ProductoConfig|undefined,params=DEFAULT_PARAMS_PRODUCTOS){
 if(!c)return null;
 const costo_unit=c.precio_unit;
 const venta_unit=Number(x.precioManual)>0?Number(x.precioManual):costo_unit*(1+params.utilidad)*(1+params.isv);
 const qty=Number(x.cantidad)||0;
 return {costo_unit,venta_unit,costo_total:costo_unit*qty,venta_total:venta_unit*qty,precioCargado:c.precio_unit>0};
}
