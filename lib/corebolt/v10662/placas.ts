// Cálculo de placas trasladado de COREBOLT V106.62 sin alterar fórmulas.
export type PlacaConfig={espesor:string;espesor_mm:number;precio_lamina:number;corte_lpulg:number;ancho_lamina?:number;largo_lamina?:number};
export type Placa={espesor:string;forma:"RECTANGULAR"|"CUADRADA"|"CIRCULAR"|"PERSONALIZADA";ancho:number;largo:number;diametro:number;area:number;perimetro:number;agujeros:number;precioagujero:number;cantidad:number;clienteLlevaLamina:boolean;precioManual:number};
export const DEFAULT_PARAMS_PLACAS={ancho:1219.2,largo:2438.4,perdida:0,utilidad:0,isv:0.15};
export const DEFAULT_CONFIG_PLACAS:PlacaConfig[]=[
['3/32"',2.38,1207.9,3.5],['1/8"',3.18,1818,3.5],['3/16"',4.76,2727,5],
['1/4"',6.35,3645,5],['3/8"',9.53,5500.89,7],['1/2"',12.7,7404.36,7],
['5/8"',15.88,10366.83,10],['3/4"',19.05,13669.02,10],['1"',25.4,16434.14,10],
['1 1/4"',31.75,23200,18],['1 1/2"',38.1,0,22],['2"',50.8,0,30]
].map(([espesor,espesor_mm,precio_lamina,corte_lpulg])=>({espesor:String(espesor),espesor_mm:Number(espesor_mm),precio_lamina:Number(precio_lamina),corte_lpulg:Number(corte_lpulg)}));
export function calcPlaca(p:Placa,c:PlacaConfig|undefined,params=DEFAULT_PARAMS_PLACAS){
 if(!c)return null;
 let area_mm2=0,perim_mm=0;
 if(p.forma==="RECTANGULAR"){area_mm2=p.ancho*p.largo;perim_mm=2*(p.ancho+p.largo);}
 else if(p.forma==="CUADRADA"){area_mm2=p.ancho*p.ancho;perim_mm=4*p.ancho;}
 else if(p.forma==="CIRCULAR"){area_mm2=Math.PI*p.diametro*p.diametro/4;perim_mm=Math.PI*p.diametro;}
 else if(p.forma==="PERSONALIZADA"){area_mm2=Number(p.area)||0;perim_mm=Number(p.perimetro)||0;}
 const anchoLamina=Number(c.ancho_lamina)||params.ancho;
 const largoLamina=Number(c.largo_lamina)||params.largo;
 const area_lamina_pulg2=(anchoLamina/25.4)*(largoLamina/25.4);
 const material_unit=p.clienteLlevaLamina?0:(area_mm2>0?(area_mm2/645.16)*(c.precio_lamina/area_lamina_pulg2)*(1+params.perdida):0);
 const corte_unit=perim_mm>0?(perim_mm/25.4)*c.corte_lpulg:0;
 const agujeros_unit=(Number(p.agujeros)||0)*(Number(p.precioagujero)||0);
 const costo_unit=material_unit+corte_unit+agujeros_unit;
 const venta_unit=Number(p.precioManual)>0?Number(p.precioManual):costo_unit*(1+params.utilidad)*(1+params.isv);
 const qty=Number(p.cantidad)||0;
 let piezas_lamina:number|null=null;
 if(p.forma==="RECTANGULAR"&&p.ancho>0&&p.largo>0)piezas_lamina=Math.floor(anchoLamina/p.ancho)*Math.floor(largoLamina/p.largo);
 else if(p.forma==="CUADRADA"&&p.ancho>0)piezas_lamina=Math.floor(anchoLamina/p.ancho)*Math.floor(largoLamina/p.ancho);
 const peso_unit=area_mm2*c.espesor_mm*7850/1e9;
 return {material_unit,corte_unit,agujeros_unit,costo_unit,venta_unit,costo_total:costo_unit*qty,venta_total:venta_unit*qty,peso_unit,peso_total:peso_unit*qty,perim_mm,piezas_lamina,precioCargado:c.precio_lamina>0};
}
