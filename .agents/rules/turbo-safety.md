---
trigger: always_on
description: Reglas y protocolo de confirmación para acciones peligrosas o de alto impacto en Modo Turbo
---

# Seguridad y Protocolo de Confirmación en Modo Turbo / Ejecución Autónoma

Incluso cuando el usuario tenga activado el **Modo Turbo** (ejecución automática continua sin pausas por comando), el agente **DEBE DETENERSE OBLIGATORIAMENTE Y PEDIR PERMISO EXPLÍCITO** antes de ejecutar acciones de alto impacto, peligrosas o destructivas.

---

### 1. Acciones Consideradas Críticas o Peligrosas
Se requiere confirmación explícita ante cualquiera de las siguientes operaciones:

* **Eliminación o sobreescritura masiva de archivos:**
  - Borrado de carpetas completas o múltiples archivos de código fuente.
  - Sobreescritura total de módulos o archivos con cambios que descarten código previo no respaldado.
* **Archivos sensibles y configuración de entorno:**
  - Modificación, sobreescritura o eliminación de archivos `.env`, credenciales, certificados (`.pem`, `.key`), claves API o configuraciones de infraestructura.
* **Comandos destructivos de control de versiones (Git):**
  - Comandos como `git reset --hard`, `git clean -fd`, `git checkout .`, `git push --force` o eliminación de ramas (`git branch -D`).
* **Operaciones destructivas de bases de datos o persistencia:**
  - Ejecución de comandos o scripts que incluyan `DROP`, `TRUNCATE`, reseteo de migraciones o eliminación de colecciones/tablas con datos.
* **Alteración drástica de dependencias:**
  - Desinstalación o modificación masiva de dependencias críticas en `package.json` sin previa solicitud del usuario.
* **Reestructuraciones arquitectónicas mayores:**
  - Cambios que alteren radicalmente la estructura de carpetas del proyecto, muden múltiples módulos simultáneamente o rompan contratos de API existentes.

---

### 2. Protocolo de Solicitud de Permiso
Antes de proceder con cualquiera de las acciones anteriores, el agente debe:

1. **Pausar la ejecución automática.**
2. **Presentar un resumen claro del impacto:**
   - **Acción exacta:** Comando o herramienta que se planea ejecutar.
   - **Alcance / Afectados:** Lista de archivos, ramas o tablas que se modificarán o eliminarán.
   - **Riesgo:** Posible pérdida de información o efectos secundarios.
   - **Justificación:** Por qué se requiere este paso.
3. **Esperar la aprobación expresa del usuario** antes de continuar con la acción.
