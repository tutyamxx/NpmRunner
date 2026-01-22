# 📦 NpmRunner

- 📦 **NpmRunner** is a browser-based JavaScript sandbox that lets you **explore and run npm packages directly in the browser**.
- ⚠️ Not affiliated with `npm, Inc`.

You can:
- Load any npm package by URL
- Automatically fetch and render its README
- Run example code in an isolated iframe
- See console output and errors in real time
- Toggle between **dark / light themes**
- Test packages without installing anything locally

---

## ⚠️ Limitations

- `CommonJS`-only packages may not work
- Native Node APIs (`fs`, `path`, `process`) are unavailable
- Some packages expect a Node runtime
- Not all `README` include runnable browser examples

---

## 🚀 Live Usage

Visit:

- [https://npmrunner.vercel.app/sandbox/orc-me](https://npmrunner.vercel.app/sandbox/orc-me)
- [https://npmrunner.vercel.app/sandbox/contains-emoji](https://npmrunner.vercel.app/sandbox/contains-emoji)

Just replace the package name in the URL.

---

## ✨ Features

- 🧪 Auto-fetch `README` from the npm registry with `HTML` support
- 🧪 Auto import sample code into the `IDE` from `README`, if present
- 🧪 Run `JavaScript` safely inside a `sandboxed iframe`
- 🧪 Dynamic ESM loading via `esm.run`
- 🧪 Monaco Editor (`VS Code–like experience`)
- 🧪 Console output & error capturing
- 🧪 Clear editor & clear console buttons
- 🧪 `Dark` / `Light theme` (persisted via localStorage - WIP)
- 🧪 Shareable URLs per package

---

## 🧑‍💻 Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/tutyamxx/NpmRunner.git
cd NpmRunner/
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Then open:

http://localhost:5173/

---

## 💡 Disclaimer

This project is for educational and experimental purposes only.
It is **not affiliated with npm, Inc.**

