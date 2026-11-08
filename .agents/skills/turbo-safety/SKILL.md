---
name: turbo-safety
description: Reglas y protocolo de confirmación para acciones peligrosas o de alto impacto cuando el modo turbo o autónomo está activo.
---

# Protocolo de Seguridad en Modo Turbo

Este comando/skill aplica el protocolo de seguridad obligatorio para prevenir acciones destructivas durante la ejecución autónoma o modo turbo.

## Directrices de Seguridad

Incluso cuando el usuario tenga activado el **Modo Turbo** (ejecución automática continua sin pausas por comando), el agente **DEBE DETENERSE OBLIGATORIAMENTE Y PEDIR PERMISO EXPLÍCITO** antes de ejecutar acciones de alto impacto, peligrosas o destructivas.

### 1. Acciones Críticas o Peligrosas
- **Eliminación o sobreescritura masiva de archivos:** Borrado de carpetas completas o múltiples archivos de código fuente; reemplazos masivos sin respaldo.
- **Archivos sensibles y entorno:** Modificación, sobreescritura o eliminación de archivos `.env`, credenciales, certificados (`.pem`, `.key`), claves API.
- **Comandos destructivos de Git:** `git reset --hard`, `git clean -fd`, `git checkout .`, `git push --force`, borrado de ramas (`git branch -D`).
- **Bases de datos:** `DROP`, `TRUNCATE`, reseteo de migraciones o borrado de colecciones/tablas con datos.
- **Dependencias:** Desinstalación o alteración drástica de paquetes críticos en `package.json`.
- **Reestructuraciones mayores:** Cambios estructurales masivos en el árbol de carpetas o contratos de API.

### 2. Protocolo de Confirmación
1. Pausar la ejecución continua.
2. Presentar:
   - **Acción exacta:** Comando o herramienta que se planea ejecutar.
   - **Alcance / Afectados:** Archivos, ramas o tablas afectadas.
   - **Riesgo:** Posible pérdida de datos o efectos secundarios.
   - **Justificación:** Por qué es necesario.
3. Esperar la aprobación expresa del usuario antes de proceder.

