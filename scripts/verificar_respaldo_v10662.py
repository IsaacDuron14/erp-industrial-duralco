#!/usr/bin/env python3
"""Auditoría local y de solo lectura del JSON de respaldo V106.62. No expone registros."""
import argparse
import collections
import json
import pathlib
import sys

BACKUP = """bolt-config bolt-params bolt-list bolt-materiales placa-config placa-params placa-list placa-espesores tuerca-config tuerca-params tuerca-list cotiz-fields cotiz-overrides cotiz-clientes cotiz-vendedores cotiz-metodos cotiz-counter cotiz-historial inv-varilla inv-placas inv-tuercas fact-sucursal fact-fields fact-overrides fact-counter fact-historial presup-actual presup-historial presup-operarios presup-tiempos presup-asignacion presup-herramientas cierre-actual cierre-historial ot-fields ot-counter ot-historial auth-config oc-fields oc-counter oc-items oc-historial oc-proveedores bitacora gastos-operativos bancos-cuentas bancos-movimientos entrega-fields entrega-counter entrega-historial recibo-counter recibo-historial recibo-porcentajes requisiciones-historial personal-operarios-v1 produccion-registros-v1 produccion-config-v1""".split()
EXTRA = """inventario-maestro-v1 inventario-kardex-v1 inventario-requisiciones-v1 inventario-precios-fusion-v89 prod-divisiones prod-categorias agente-api-url agente-chat app-version""".split()
HISTORY = """cotiz-historial presup-historial ot-historial fact-historial recibo-historial oc-historial entrega-historial cierre-historial bancos-movimientos requisiciones-historial""".split()

def decode(raw):
    if isinstance(raw, dict) and raw.get("corebolt_encrypted"):
        raise ValueError("Respaldo cifrado AES-GCM: descifrar solo con el mecanismo autorizado. Nunca enviar la clave.")
    if not isinstance(raw, dict):
        raise ValueError("Se esperaba JSON objeto.")
    output={}
    for k,v in raw.items():
        if isinstance(v,str):
            try:output[k]=json.loads(v)
            except ValueError:output[k]=v
        else:output[k]=v
    return output

def normalizar(numero):
    valor=str(numero or "").strip()
    return str(int(valor)) if valor.isdigit() else valor.casefold()

def auditar(data):
    result={"version":"V106.62","solo_lectura":True,"claves_respaldo":len(BACKUP),
            "claves_presentes":sum(k in data for k in BACKUP),
            "claves_ausentes":[k for k in BACKUP if k not in data],
            "claves_extra_presentes":[k for k in EXTRA if k in data],
            "claves_extra_ausentes":[k for k in EXTRA if k not in data],
            "colecciones":{},"alertas":[]}
    for key in HISTORY:
        rows=data.get(key)
        if rows is None:
            result["colecciones"][key]={"estado":"ausente_o_nula"}
            continue
        if not isinstance(rows,list):
            result["colecciones"][key]={"estado":"formato_inesperado","tipo":type(rows).__name__}
            result["alertas"].append("FORMATO:"+key)
            continue
        nums=[normalizar(r["numero"]) for r in rows if isinstance(r,dict) and r.get("numero") not in (None,"")]
        repeated=sum(n-1 for n in collections.Counter(nums).values() if n>1)
        invalid=sum(not isinstance(r,dict) for r in rows)
        result["colecciones"][key]={"estado":"lista","registros":len(rows),"con_numero":len(nums),
              "numeros_potencialmente_duplicados":repeated,"elementos_no_objeto":invalid}
        if repeated:result["alertas"].append("NUMERO_REPETIDO:"+key)
        if invalid:result["alertas"].append("ELEMENTO_INVALIDO:"+key)
    quotes=data.get("cotiz-historial")
    quote_numbers={normalizar(row["numero"]) for row in quotes if isinstance(row,dict) and row.get("numero")} if isinstance(quotes,list) else set()
    for key,field in [("presup-historial","referencia"),("ot-historial","cotizacionOrigen"),
                      ("fact-historial","cotizacionOrigen"),("recibo-historial","cotizacionOrigen")]:
        rows=data.get(key)
        if not quote_numbers or not isinstance(rows,list):continue
        missing=sum(normalizar(row[field]) not in quote_numbers for row in rows if isinstance(row,dict) and row.get(field))
        result["colecciones"][key]["referencias_cotizacion_no_encontradas"]=missing
        if missing:result["alertas"].append("REFERENCIA_NO_ENCONTRADA:"+key)
    result["advertencia"]="El respaldo estándar puede omitir KV remoto, otros dispositivos y datos del Inventario Maestro/Kardex. No demuestra una migración completa."
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("respaldo",type=pathlib.Path,help="Archivo JSON local no cifrado")
    args=p.parse_args()
    try:
        raw=json.loads(args.respaldo.read_text(encoding="utf-8"))
        print(json.dumps(auditar(decode(raw)),indent=2,ensure_ascii=False))
        return 0
    except (OSError,ValueError) as exc:
        print("ERROR:",exc,file=sys.stderr)
        return 2

if __name__=="__main__":sys.exit(main())
