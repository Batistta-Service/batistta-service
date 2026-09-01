# Cómo publicar Batistta Service con tu propio dominio

No vas a usar terminal en ningún paso. Todo se hace haciendo clic en páginas web. Vas a crear 3 cuentas gratuitas: **Supabase** (guarda tus datos), **GitHub** (guarda el código), **Vercel** (publica la app).

---

## Paso 1 — Crear la base de datos (Supabase)

1. Entra a **supabase.com** → "Start your project" → crea una cuenta gratis.
2. Clic en "New project". Ponle el nombre "batistta-service" y una contraseña (guárdala).
3. Cuando el proyecto esté listo, ve a **Table Editor** (menú izquierdo) → "New table".
   - Nombre de la tabla: `kv_store`
   - Agrega dos columnas: `key` (tipo `text`, marcar como Primary Key) y `value` (tipo `text`)
   - Guarda.
4. Ve a **Project Settings** (ícono de engranaje) → **API Keys**.
   - Copia el valor de **Project URL**.
   - Copia la clave que empieza con `sb_publishable_...` (Supabase la llama "Publishable key" — es la que antes se llamaba "anon public"; si no ves ninguna, puede haber un botón "Create new API keys" para generarla).
   - Guarda ambos en un bloc de notas, los vas a necesitar en el Paso 3.

---

## Paso 2 — Subir el código a GitHub

1. Entra a **github.com** → crea una cuenta gratis (si no tienes).
2. Clic en el botón verde "New" para crear un repositorio.
   - Nombre: `batistta-service`
   - Déjalo en "Public" o "Private", como prefieras.
   - Clic en "Create repository".
3. En la página del repositorio recién creado, busca el link **"uploading an existing file"**.
4. Arrastra **todos los archivos y carpetas** de este proyecto que te compartí (descomprime el zip primero) a esa página.
5. Abajo, clic en "Commit changes".

---

## Paso 3 — Publicar la app (Vercel)

1. Entra a **vercel.com** → crea una cuenta gratis usando tu cuenta de GitHub (botón "Continue with GitHub").
2. Clic en "Add New..." → "Project".
3. Busca y selecciona el repositorio `batistta-service` → "Import".
4. Antes de darle a "Deploy", abre la sección **"Environment Variables"** y agrega dos:
   - `VITE_SUPABASE_URL` → pega el Project URL que copiaste en el Paso 1
   - `VITE_SUPABASE_ANON_KEY` → pega la clave `sb_publishable_...` que copiaste en el Paso 1
5. Clic en "Deploy". Espera 1-2 minutos.
6. Cuando termine, Vercel te da una URL gratis tipo `batistta-service.vercel.app` — ya puedes entrar, poner un número de teléfono de prueba (ej. `5550142`) y ver que funcione.

---

## Paso 4 — Conectar tu dominio propio

**Opción simple: comprar el dominio directamente en Vercel**
1. Dentro de tu proyecto en Vercel, ve a la pestaña **"Domains"**.
2. Escribe el dominio que quieres (ej. `batisttaservice.com`) → si está disponible, Vercel te deja comprarlo ahí mismo con tarjeta. Queda conectado automáticamente, sin pasos extra.

**Si ya compraste el dominio en otro lado (Namecheap, GoDaddy, etc.)**
1. En Vercel → "Domains" → escribe tu dominio → "Add".
2. Vercel te muestra 1-2 registros para agregar (algo como un "A record" y un "CNAME").
3. Entra a la página donde compraste el dominio, busca la sección "DNS" o "Manage DNS", y agrega esos mismos valores que te dio Vercel.
4. Puede tardar entre 10 minutos y unas horas en activarse.

---

## Importante sobre seguridad

Cualquiera que tenga el link y el número de teléfono de un cliente puede **ver** esa reparación (estado y notas) — eso es intencional, para que los clientes puedan consultar sin contraseña.

Pero **cambiar el estado o agregar notas está protegido con una clave del taller**: `begtaller`. Un cliente que entra con su número puede ver todo, pero no va a ver los botones para modificar nada hasta que alguien toque "Modo taller" e ingrese esa clave — algo que solo debería hacer el personal del taller.

Es una protección simple (no es un sistema de cuentas), pero alcanza para que un cliente cualquiera no pueda tocar el estado de una reparación ajena. Si en algún momento querés cambiar la clave, avisame y te la actualizo.

## ¿Algo no funciona?

Si algo falla, avísame en qué paso te quedaste y el mensaje de error que ves — te ayudo a resolverlo.
