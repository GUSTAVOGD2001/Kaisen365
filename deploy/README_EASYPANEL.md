# Despliegue en EasyPanel (estático con Nginx)

## 1) Preparar .env (local o CI)
Crea un archivo .env (NO lo subas a Git) con:
VITE_API_URL=http://TU-IP-O-HOST:3001

## 2) Construir Docker (EasyPanel)
- En EasyPanel, crea una nueva App tipo "Dockerfile".
- Directorio de build: raíz del repo
- Dockerfile path: deploy/Dockerfile
- Puerto expuesto del contenedor: 80
- Deploy

## 3) Sin Docker (opción estática)
- Local: npm i && npm run build
- Sube la carpeta dist/ a una "Static App" (Nginx) en EasyPanel
- Asegura fallback a /index.html (usa el nginx.conf provisto)

## 4) Probar
- Abre la URL que te da EasyPanel (IP:puerto o subdominio)
- La app debe cargar como SPA. Si consume API, pon VITE_API_URL correcto antes del build.

## 5) Notas
- No subir .env al repo.
- Cada cambio de VITE_API_URL requiere nuevo build.
