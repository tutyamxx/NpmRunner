# 📦 NpmRunner

<div align="center">
  <img src="banner.png" alt="NpmRunner Banner" width="600" style="max-width: 100%; height: auto;" />

  <!-- CI/CD workflow badge 🏖️ -->
  <a href="https://github.com/tutyamxx/NpmRunner/actions/workflows/ci.yml">
    <img src="https://github.com/tutyamxx/NpmRunner/actions/workflows/ci.yml/badge.svg" alt="CI/CD">
  </a>

  <!-- Stylelint, ESLint, and Tests job badges 🏖️ -->
  <img src="https://img.shields.io/github/actions/workflow/status/tutyamxx/NpmRunner/ci.yml?job=stylelint&label=Stylelint&color=brightgreen" alt="Stylelint">
  <img src="https://img.shields.io/github/actions/workflow/status/tutyamxx/NpmRunner/ci.yml?job=eslint&label=ESLint&color=brightgreen" alt="ESLint">
  <img src="https://img.shields.io/github/actions/workflow/status/tutyamxx/NpmRunner/ci.yml?job=tests&label=Tests&color=brightgreen" alt="Tests">
</div>

- **NpmRunner** is a `browser-based` JavaScript 🏖️ `sandbox` that lets you **explore and run npm packages directly in the browser**.
- **NOT** affiliated with `npm, Inc`.
- **NOT** a `RunKit` replacement but you can run stuff here

## 🏖️ What You Can Do / Features

- 🏖️ Load any npm package by `URL`
- 🏖️ Automatically fetch and render its `README` with `HTML` support
- 🏖️ Auto-import sample code from `README` into the `IDE`, if present
- 🏖️ Run JavaScript safely inside a sandboxed iframe
- 🏖️ Dynamic `ESM` loading, with `CommonJS (require)` support
- 🏖️ Monaco Editor (`VS Code–like experience`)
- 🏖️ See console output and errors in real time
- 🏖️ Clear editor & clear console buttons
- 🏖️ Toggle between `Dark` / `Light` themes
- 🏖️ Shareable URLs per package
- 🏖️ Test packages without installing anything locally
- 🏖️ Works with almost all packages (WIP here, trying to make almost all of them load)

## ⚠️ Limitations

- Native Node APIs (`fs`, `path`, `process`) are unavailable
- Some packages expect a Node runtime
- Not all `README` include runnable browser examples

## 🪁 TODO

- TypeScript support (I might or might not, WIP)
- Add more stuff.

## 🚀 Live Usage

Example usage:

- [https://npmrunner.vercel.app/sandbox/orc-me](https://npmrunner.vercel.app/sandbox/orc-me)
- [https://npmrunner.vercel.app/sandbox/contains-emoji](https://npmrunner.vercel.app/sandbox/contains-emoji)
- [https://npmrunner.vercel.app/sandbox/is-valid-domain-extension](https://npmrunner.vercel.app/sandbox/is-valid-domain-extension)
- [https://npmrunner.vercel.app/sandbox/long](https://npmrunner.vercel.app/sandbox/long)
- [https://npmrunner.vercel.app/sandbox/mathml-tag-names](https://npmrunner.vercel.app/sandbox/mathml-tag-names)

Just replace the `package name` in the URL.

```bash
https://npmrunner.vercel.app/sandbox/<package name>
```

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

## 💡 Disclaimer

This project is for educational and experimental purposes only.
It is **not affiliated with npm, Inc.**

<p align="center">
  <a href="https://github.com/tuty4amxx/npmrunner">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
  </a>
</p>
