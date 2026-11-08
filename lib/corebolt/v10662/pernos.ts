// Réplica funcional estricta de calcBolt de COREBOLT V106.62.
// Las cifras, reglas y fórmulas se conservan incluso donde hay defectos conocidos.
// No usar en producción hasta completar pruebas de equivalencia.
export type PernoConfig={material:string;diametro:string;diametro_mm:number;norma:string;largo_barra:number;precio_barra:number;roscado_lpulg:number;doblez:number};
export type Perno={detalle:string;tipo:"RECTO"|"L"|"J"|"DOBLE ROSCA";material:string;diametro:string;cuerpo:number;pata:number;rosca1:number;rosca2:number;cantidad:number;precioManual:number;clienteLlevaMaterial:boolean};
export type Params={perdida:number;utilidad:number;isv:number;corte:number;densidad:number};
export const DEFAULT_PARAMS:Params={perdida:0.10,utilidad:0,isv:0.15,corte:0,densidad:7850};
export const DEFAULT_CONFIG:PernoConfig[]=[
["1018",'1/2"',12.7,"F1554(G36)",236,500,20,40],
["1018",'5/8"',15.88,"F1554(G36)",236,500,25,50],
["1018",'3/4"',19.05,"F1554(G36)",236,750,30,50],
["1018",'1"',25.4,"F1554(G36)",236,1400,35,50],
["1018",'1 1/4"',31.75,"F1554(G36)",236,2100,35,100],
["1018",'1 1/2"',38.1,"F1554(G36)",236,0,0,100],
["1018",'2"',50.8,"F1554(G36)",236,5300,120,100],
["1045",'1/2"',12.7,"F1554(G55)",236,650,25,50],
["1045",'5/8"',15.88,"F1554(G55)",236,600,30,60],
["1045",'3/4"',19.05,"F1554(G55)",236,850,35,60],
["1045",'1"',25.4,"F1554(G55)",236,1400,35,75],
["1045",'1 1/4"',31.75,"F1554(G55)",236,2200,45,100],
["1045",'1 3/8"',34.93,"F1554(G55)",236,3400,75,100],
["1045",'1 1/2"',38.1,"F1554(G55)",236,3600,55,100],
["1045",'2"',50.8,"F1554(G55)",236,5700,125,100],
["CORRUGADA",'1/2"',12.7,"Corrugada",354,0,0,20],
["CORRUGADA",'5/8"',15.88,"Corrugada",354,0,0,25],
["CORRUGADA",'3/4"',19.05,"Corrugada",354,0,0,30],
["CORRUGADA",'1"',25.4,"Corrugada",354,985,30,30],
["CORRUGADA",'1 1/4"',31.75,"Corrugada",354,0,0,30],
["CORRUGADA",'2"',50.8,"Corrugada",354,0,0,120],
["1252",'5/8"',15.88,"F1554(G105)",236,0,0,0],
["1252",'3/4"',19.05,"F1554(G105)",236,0,0,0],
["1252",'1"',25.4,"F1554(G105)",236,0,0,0],
["1252",'1 1/4"',31.75,"F1554(G105)",236,0,0,0],
["1252",'1 1/2"',38.1,"F1554(G105)",236,0,0,0],
["BARRA ROSCADA",'3/8"',9.53,"Roscada",0,0,0,0],
["BARRA ROSCADA",'1/2"',12.7,"Roscada",0,0,0,0],
["BARRA ROSCADA",'5/8"',15.88,"Roscada",0,0,0,0],
["BARRA ROSCADA",'3/4"',19.05,"Roscada",0,0,0,0],
["BARRA ROSCADA",'1"',25.4,"Roscada",0,0,0,0],
["BARRA ROSCADA",'1 1/4"',31.75,"Roscada",0,0,0,0],
].map(([material,diametro,diametro_mm,norma,largo_barra,precio_barra,roscado_lpulg,doblez])=>({
 material:String(material),diametro:String(diametro),diametro_mm:Number(diametro_mm),norma:String(norma),
 largo_barra:Number(largo_barra),precio_barra:Number(precio_barra),roscado_lpulg:Number(roscado_lpulg),doblez:Number(doblez)
}));
export function buildBoltDetalle(b:Perno){
 const gradeMap:Record<string,string>={"1018":"F1554(G36)","1045":"F1554(G55)","1252":"F1554(G105)"};
 const normaLabel=gradeMap[b.material]||b.material;
 const roscaTxt=b.rosca2>0?`${b.rosca1}+${b.rosca2}`:`${b.rosca1}`;
 return `Perno-${normaLabel} Dia ${b.diametro} -${roscaTxt}"R -Largo ${b.cuerpo}" -Tipo ${b.tipo}${b.pata>0?b.pata+'"':""}`;
}
export function sufijoClienteMaterial(b:Perno){
 const rosca=b.rosca1>0||b.rosca2>0,doblez=b.tipo==="L"||b.tipo==="J";
 return rosca&&doblez?" SERVICIO DE ROSCADO Y DOBLES (CLIENTE LLEVA MATERIAL)":
 rosca?" SERVICIO DE ROSCADO (CLIENTE LLEVA MATERIAL)":
 doblez?" SERVICIO DE DOBLES (CLIENTE LLEVA MATERIAL)":
 " SERVICIO (CLIENTE LLEVA MATERIAL)";
}
export function calcBolt(b:Perno,cfg:PernoConfig|undefined,params:Params=DEFAULT_PARAMS){
 if(!cfg)return null;
 const cuerpoTotal=(Number(b.cuerpo)||0)+(Number(b.pata)||0);
 const material_unit=b.clienteLlevaMaterial?0:(cfg.largo_barra>0?(cuerpoTotal/cfg.largo_barra)*cfg.precio_barra:0);
 const roscado_unit=((Number(b.rosca1)||0)+(Number(b.rosca2)||0))*cfg.roscado_lpulg;
 const doblez_unit=(b.tipo==="L"||b.tipo==="J")?cfg.doblez:0;
 const subtotal=material_unit+roscado_unit+doblez_unit+(Number(params.corte)||0);
 const costo_unit=subtotal*(1+params.perdida);
 const venta_unit=Number(b.precioManual)>0?Number(b.precioManual):costo_unit*(1+params.utilidad)*(1+params.isv);
 const qty=Number(b.cantidad)||0;
 const peso_unit=Math.PI*Math.pow(cfg.diametro_mm/1000,2)/4*(cuerpoTotal*0.0254)*params.densidad;
 return {material_unit,roscado_unit,doblez_unit,subtotal,costo_unit,venta_unit,costo_total:costo_unit*qty,
 venta_total:venta_unit*qty,peso_unit,peso_total:peso_unit*qty,norma:cfg.norma,precioCargado:cfg.precio_barra>0};
}
