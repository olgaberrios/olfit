# OlFit 🦆💪

Tracker personal de Fuertafit. PWA instalable en móvil, sincronización entre dispositivos via GitHub Gist.

**URL:** https://olgaberrios.github.io/olfit/

---

## Subir a GitHub por primera vez

```bash
# En la carpeta del proyecto:
git init
git add .
git commit -m "🚀 OlFit inicial"
git branch -M main
git remote add origin https://github.com/olgaberrios/olfit.git
git push -u origin main
```

## Activar GitHub Pages

1. Ve a tu repo → **Settings** → **Pages**
2. En *Source* selecciona **GitHub Actions**
3. Guarda — el workflow se ejecuta automáticamente en cada push

La app estará en: **https://olgaberrios.github.io/olfit/**

---

## Conectar GitHub Gist (sincronización entre dispositivos)

1. Ve a https://github.com/settings/tokens
2. Genera un **Personal Access Token (classic)**
3. Marca solo el scope: ✅ `gist`
4. Copia el token (empieza por `ghp_...`)
5. En la app → **Config** → pega el token → **Conectar Gist**

La primera vez se crea un Gist privado automáticamente.  
En el segundo dispositivo, pega el mismo token y el ID del Gist que aparece en Config.

---

## Instalar en el móvil como app

**iPhone/iPad:** Safari → compartir → "Añadir a pantalla de inicio"  
**Android:** Chrome → menú → "Instalar app" o "Añadir a pantalla de inicio"

---

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
