# Microfrontend Angular: Inventario y Mantenimiento (`@plataforma/inventario`)

Microfrontend desarrollado en **Angular 21** para la administración de equipamiento deportivo, ambientes, alertas de mantenimiento preventivo/correctivo y control de movimientos de inventario (Kardex).

* **Framework:** Angular 21 (Standalone Components & Signals)
* **Arquitectura:** Clean Architecture (Domain, Application, Infrastructure, Presentation)
* **Orquestador:** single-spa (Montado en el Shell React)
* **API Backend:** GraphQL (`http://localhost:4002/graphql` de `ms-inventario` en Laravel)

---

## 1. Arquitectura Limpia por Capas

```text
src/app/
├── core/
│   ├── graphql/graphql.client.ts         # Cliente HTTP a http://localhost:4002/graphql
│   └── tokens/injection-tokens.ts        # Tokens IoC de Angular
│
└── features/
    ├── equipos/                          # Agregado de Equipos
    │   ├── domain/                       # Entidades y Puertos (TS puro)
    │   ├── application/                  # Casos de uso (Listar, Crear, Cambiar Estado)
    │   └── infrastructure/               # GraphQL Queries, Mappers y Adaptador
    │
    ├── mantenimientos/                   # Agregado de Mantenimiento
    │   ├── domain/                       # Modelos y Enums (Preventivo/Correctivo)
    │   ├── application/                  # Casos de uso (Alertas, Programar, Completar)
    │   └── infrastructure/               # GraphQL Queries, Mappers y Adaptador
    │
    ├── inventario/                       # Agregado de Kardex
    │   ├── domain/                       # Modelos de movimientos
    │   ├── application/                  # Casos de uso (Registrar Movimiento, Consultar)
    │   └── infrastructure/               # GraphQL Queries y Adaptador
    │
    └── inventario-dashboard/             # Capa de Presentación
        ├── inventario-dashboard.component.ts   # Signals y orquestación UI
        ├── inventario-dashboard.component.html # Vistas, modales y tablas
        └── inventario-dashboard.component.css  # Estilos Dark Mode acordes al Shell
```

---

## 2. Ejecución Local (Modo Independiente)

Para levantar el microfrontend en desarrollo:

```bash
npm start
```

* **URL Local:** `http://localhost:9104`
* Permite probar la UI y realizar consultas de equipos, crear inventario y registrar mantenimientos directamente contra `ms-inventario`.

---

## 3. Integración con el Shell (`single-spa`)

En `src/main.ts` se exportan las funciones de ciclo de vida de **single-spa**:
* `bootstrap(props)`
* `mount(props)`
* `unmount(props)`

El Shell de React (`shell`) está configurado para:
* Reconocer el microfrontend en la ruta `/inventario/*`.
* Mostrar el enlace en el Sidebar con icono de herramienta para perfiles `ADMINISTRADOR`, `RECEPCIONISTA` e `INSTRUCTOR`.
* Descargar el módulo dinámicamente desde `http://localhost:9104/main.js` o renderizar su placeholder elegante si el microfrontend no está en ejecución.
