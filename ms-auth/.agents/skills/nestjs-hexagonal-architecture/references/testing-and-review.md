# Estrategia de Pruebas y Checklist de Auditoría

En la arquitectura hexagonal, cada capa se prueba con el nivel de aislamiento adecuado.

---

## 1. Pruebas Unitarias Puras (Domain y Application)

- **Sin NestJS, sin Base de Datos, sin Mocks complejos de librerías.**
- Usar fakes en memoria (`FakeUserRepository` o `vi.fn()`).

```typescript
// test/unit/application/register-user.use-case.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '../../../src/auth/application/use-cases/register-user.use-case';
import { UserRepositoryPort } from '../../../src/auth/application/ports/out/user-repository.port';
import { User } from '../../../src/auth/domain/entities/user.entity';

class FakeUserRepository implements UserRepositoryPort {
  users: User[] = [];
  async findByEmail(email: string) {
    return this.users.find(u => u.getEmail() === email) || null;
  }
  async save(user: User) {
    this.users.push(user);
  }
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let repo: FakeUserRepository;

  beforeEach(() => {
    repo = new FakeUserRepository();
    useCase = new RegisterUserUseCase(repo);
  });

  it('debe registrar un nuevo usuario si el correo no existe', async () => {
    const res = await useCase.execute({
      id: '123',
      email: 'test@domain.com',
      passwordHash: 'hashed_pwd',
    });

    expect(res.userId).toBe('123');
    expect(repo.users.length).toBe(1);
  });

  it('debe arrojar error si el usuario ya existe', async () => {
    await repo.save(User.create('1', 'test@domain.com', 'pwd'));

    await expect(
      useCase.execute({ id: '2', email: 'test@domain.com', passwordHash: 'pwd' })
    ).rejects.toThrow('ya existe');
  });
});
```

---

## 2. Pruebas de Integración (Adapters Out y Mappers)

- Probar repositorios reales (Mongoose con testcontainers o base de datos de test, o TypeORM en memoria).
- Verificar que las consultas, los índices únicos y las transacciones funcionan como se espera.
- Comprobar que los mappers convierten fielmente entre objetos de base de datos y entidades de dominio sin perder datos ni violar invariantes.

---

## 3. Pruebas E2E (Adapters In y Módulo Completo)

- Usar `supertest` y el módulo de NestJS montado (`Test.createTestingModule`).
- Probar el contrato HTTP completo: código de estado, headers, serialización del JSON y filtros de excepciones.

---

## 4. Checklist Rápido de Auditoría

Antes de considerar terminada una funcionalidad:

| Criterio | Verificación |
|---|---|
| **¿Imports de Nest en Domain?** | Debe ser 0. Buscar `@Injectable`, `@Controller`, etc. en `src/**/domain/**`. |
| **¿Imports de Nest en Application?** | Debe ser 0. Casos de uso son clases planas de TS. |
| **¿Modelos de ORM en Ports?** | Ningún puerto debe retornar ni recibir schemas de Mongoose, entidades TypeORM ni modelos Prisma. |
| **¿Lógica en Controladores?** | El controlador solo mapea request/response y llama a `useCase.execute()`. |
| **¿Tests unitarios rápidos?** | Los tests de `domain/` y `application/` deben correr en milisegundos sin levantar Nest. |
