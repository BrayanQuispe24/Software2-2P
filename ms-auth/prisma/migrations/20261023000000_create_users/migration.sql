-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "ci" VARCHAR(20) NOT NULL,
    "celular" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "acepta_terminos" BOOLEAN NOT NULL DEFAULT false,
    "fecha_acepta_terminos" TIMESTAMP(3),
    "tipo_usuario" VARCHAR(50) NOT NULL DEFAULT 'USUARIO',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_codigo_key" ON "users"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "users_ci_key" ON "users"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
