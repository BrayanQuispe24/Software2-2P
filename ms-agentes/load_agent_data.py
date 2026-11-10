#!/usr/bin/env python3
"""
Script de Carga de Datos Reales e Importantes para el Agente Inteligente (CU-23).

Uso:
  python load_agent_data.py
  (o dentro del contenedor: docker compose exec ms-agentes python load_agent_data.py)
"""

import sys
import os

# Asegurar que el directorio raíz esté en sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.db import engine, Base, SessionLocal
from app.infrastructure.schema import ensure_schema
from app.application.seed_data import ejecutar_carga_datos_reales

def main():
    print("=" * 70)
    print("🚀 APEX FITNESS - CARGA DE DATOS REALES PARA CENTRO DE MONITOREO")
    print("=" * 70)

    try:
        # Asegurar que las tablas existan
        ensure_schema(engine, Base.metadata)
        print("✅ Esquema de base de datos verificado.")

        # Cargar datos
        db = SessionLocal()
        try:
            print("⏳ Cargando alertas, indicadores, anomalías y acciones...")
            resultado = ejecutar_carga_datos_reales(db)
            print("=" * 70)
            if resultado.get("already_seeded"):
                print(f"⚠️ AVISO: {resultado['message']}")
                print(f"   Fecha de carga inicial: {resultado.get('cargado_en')}")
                return

            print(f"🎉 ÉXITO: {resultado['message']}")
            print(f"   - Base de gimnasio sembrada: {resultado.get('gimnasio_sembrado')}")
            print(f"   - Base de inventario sembrada: {resultado.get('inventario_sembrado')}")
            print(f"   - Indicadores evaluados: {resultado.get('indicadores_evaluados')}")
            print(f"   - Anomalías detectadas: {resultado.get('anomalias_detectadas')}")
            print(f"   - Alertas generadas orgánicamente por el agente: {resultado.get('alertas_generadas_por_el_agente')}")
            print(f"   - Acciones disparadas: {resultado.get('acciones_disparadas')}")
            print("=" * 70)
            print("💡 Ahora abre tu navegador en: https://apexfitness.bratox.me/admin/monitoreo-inteligente")
            print("=" * 70)
        finally:
            db.close()
    except Exception as exc:
        print(f"❌ Error al cargar datos: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

