# MS 4: Inventario y Mantenimiento

Microservicio para la administración de recursos físicos, equipamiento del gimnasio, ambientes, movimientos de inventario (Kardex) y control de mantenimiento preventivo y correctivo.

* **Framework:** Laravel 11 / 12 (PHP 8.2+)
* **Arquitectura:** Hexagonal (Ports & Adapters)
* **API Surface:** GraphQL (Lighthouse GraphQL)
* **Persistencia:** PostgreSQL independiente (Patrón *Database-per-Service*)

---

## 1. Configuración de Base de Datos

El microservicio utiliza una base de datos propia e independiente: **`ms_inventario_db`**.

En el archivo `.env`:

### Opción A: PostgreSQL Local (pgAdmin / Postgres en puerto 5432)
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ms_inventario_db
DB_USERNAME=postgres
DB_PASSWORD=tu_password_local
```

### Opción B: Docker Compose (Contenedor aislado en puerto 5434)
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5434
DB_DATABASE=ms_inventario_db
DB_USERNAME=inventario_user
DB_PASSWORD=inventario_dev_password
```

Para encender el contenedor de Docker:
```bash
docker compose up -d
```

---

## 2. Ejecutar Migraciones

Una vez creada la base de datos `ms_inventario_db` en tu PostgreSQL (local o Docker):

```bash
php artisan migrate
```

Esto creará las 7 tablas:
1. `ambientes`
2. `marcas`
3. `tipo_equipo`
4. `tipo_movimiento`
5. `equipos`
6. `mantenimientos`
7. `movimiento_inventario`

---

## 3. Levantar el Microservicio Localmente

```bash
php artisan serve --port=4002
```

El servidor quedará disponible en `http://localhost:4002` y el endpoint GraphQL en:
* **Endpoint:** `http://localhost:4002/graphql`

---

## 4. Estructura Hexagonal

```text
app/
├── Core/
│   ├── Domain/                 # Entidades puras y enums (sin dependencias de Laravel)
│   └── Application/            # Casos de uso y puertos de salida (Interfaces)
└── Infrastructure/
    ├── Adapters/
    │   ├── In/GraphQL/         # Queries y Mutations de Lighthouse
    │   └── Out/Persistence/    # Modelos Eloquent, Mappers y Repositorios
    └── Providers/              # Inyección de dependencias (RepositoryServiceProvider)
```
