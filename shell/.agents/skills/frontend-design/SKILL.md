---
name: frontend-design
description: Directrices de diseño visual distintivo e intencional al construir o rediseñar interfaces web y landing pages. Ayuda a definir dirección estética, tipografía con carácter, composiciones con intención y a evitar patrones genéricos o clichés de IA (AI slop, plantillas SaaS predecibles, gradientes morados idénticos y tarjetas uniformes).
---

# Frontend Design: Diseño Visual Distintivo y Anti-Cliché de IA

Aborda cada tarea de interfaz como el **director de diseño de un estudio de autor**, reconocido por darle a cada proyecto una identidad visual inconfundible y específica que nadie confundiría con una plantilla genérica. El cliente rechaza los diseños predecibles o "con olor a IA" (*AI slop*); exige una postura de diseño deliberada con opciones audaces y coherentes en paleta, tipografía, composición y redacción.

---

## 1. Conexión auténtica con la temática y el rubro

Antes de diseñar o tirar código, identifica con precisión:
1. **El sujeto o producto real:** Materiales, jerga, dinámicas de uso y cultura visual del sector (un gimnasio de fuerza tiene texturas, tensiones y contrastes totalmente distintos a una fintech o a una app médica).
2. **La audiencia objetivo:** Quién usará la interfaz y qué mentalidad tiene al entrar.
3. **El trabajo principal del diseño:** Informar, convertir, guiar, dar estatus o resolver una tarea rápida.

Construye siempre con **contenido y conceptos reales del dominio**, nunca con datos abstractos o textos de relleno corporativos.

---

## 2. Principios de Diseño

### Hero Section: El impacto inicial
El hero es lo primero que ve el usuario. Ábrelo con lo más característico y representativo del mundo temático en la forma más apropiada: un titular con peso, una imagen con tensión, un selector interactivo o una demostración en vivo.
* *Alerta cliché:* El típico titular genérico acompañado de un número grande con etiqueta diminuta y un acento en gradiente es la respuesta por defecto de los modelos; úsalo solo si realmente es la mejor opción justificada.

### Tipografía: El carácter de la interfaz
La tipografía sostiene la personalidad de la página:
* No necesitas diez fuentes: usa **una o máximo dos familias bien contrastadas** (ej. una sans grotesca/geométrica robusta combinada con una serifa editorial, o una sans moderna con una monospace técnica).
* Define una escala tipográfica clara con pesos, interlineados y trackings intencionales. El tratamiento tipográfico debe ser un elemento visual activo, no un mero contenedor de texto.
* Limita los largos de línea a menos de 75-80 caracteres para lectura óptima.

### Señales comunes de "Diseño generado por IA" a EVITAR:
* ❌ Destacar una sola palabra del titular aplicándole cursiva o un color chillón diferente al resto de la frase.
* ❌ Sobrecargar de "eyebrows" (etiquetas superiores en mayúsculas `ALL CAPS` con tracking exagerado) arriba de cada título.
* ❌ Poner prefijos numéricos decorativos tipo `01 / 02 / 03` cuando el contenido no es realmente una secuencia o cronología.
* ❌ Utilizar el "SaaS Card Kit": partir todo el contenido en cajas idénticas con esquinas excesivamente redondeadas (`rounded-2xl`), el mismo fondo gris con sombra difusa idéntica y bordes morados o cian en cada hover.
* ❌ Animaciones indiscriminadas: poner transiciones de entrada `fade-in-up` y rebote a absolutamente todas las tarjetas hace que la página se sienta artificial y pesada.

### Estructura visual como información
Los divisores, bordes, etiquetas y contrastes deben **organizar información real**, no existir solo como decoración. Si agrupas elementos, que sea porque comparten relación lógica o jerarquía visual.

### Movimiento y micro-interacciones
Usa el movimiento no accionado por el usuario de forma muy contenida y deliberada. Un solo momento coreografiado (o un elemento visual con vida propia) tiene mucho más valor que efectos flotantes en cada rincón. Las micro-animaciones deben responder a la acción humana: abrir, desplegar, validar, seleccionar.

---

## 3. Calibración: Vicios de IA que se deben erradicar

Actualmente, los diseños generados por IA tienden a caer en estos estereotipos predecibles:
1. **El clon oscuro tech:** Fondo `#0b0f19` / `#0f172a` con gradiente radial morado (`#6366f1`) en el centro, tarjetas glassmorphism idénticas y botones con sombra violeta neón.
2. **El clon editorial cálido:** Fondo crema/hueso (`#F4F1EA`), títulos con serifa elegante y acentos terracota/arcilla (`#D97757`).
3. **El clon brutalista estricto:** Bordes negros duros de 1px sin radio alguno (`rounded-none`), fuentes monospace para todo y acento verde lima ácido.

**Regla de oro:** Si el brief o el usuario no te pide expresamente uno de estos tres paquetes, **no gastes tu libertad en reproducir el estereotipo de turno**. Diseña combinaciones cromáticas y composiciones con identidad propia.

---

## 4. Proceso en dos pases: Planificar y Construir

1. **Pase 1 - Dirección de Arte:**
   - **Paleta base:** 4 a 6 valores hexadecimales con rol claro (fondo, superficie, texto primario, texto secundario, acento protagonista y tono de contraste).
   - **Tipografía:** Familias elegidas y su función jerárquica.
   - **Concepto de layout:** Ritmo de la página, alineación intencional (asimétrica, balanceada, editorial) y distribución del espacio en blanco.
2. **Pase 2 - Auto-crítica antes de codificar:**
   - Pregúntate: *¿Esto parece una plantilla que cualquier IA generaría en 2 segundos para cualquier rubro?*
   - Si la respuesta es sí, cambia al menos dos decisiones: la disposición de los bloques, el peso visual o la paleta.
3. **Construcción y contención:**
   - Aplica el principio de Coco Chanel: *"Antes de salir, mírate al espejo y quítate un accesorio"*. Deja que un elemento sea la estrella visual memorable y mantén lo demás limpio, legible y en armonía.

---

## 5. Redacción y Copywriting con voz humana

Las palabras son diseño. El copy templado arruina el mejor diseño visual:
* ❌ **Evita el humo corporativo:** *"Potencia tu experiencia con nuestra solución integral de última generación impulsada por innovación"*.
* ✅ **Escribe concreto y al grano:** Habla como habla la gente real del rubro. Nombra los beneficios tangibles: horarios reales, máquinas específicas, procesos exactos, precios sin vueltas.
* **Voz activa en los botones de acción:** Los botones deben decir qué pasará: *"Ver horarios de clases"*, *"Solicitar pase de 1 día"*, *"Conocer instructores"*.
* **Claridad antes que ingenio forzado:** Un mensaje legible y transparente siempre genera mayor confianza y conversión que una metáfora abstracta.
