// Encrypts the <body> of a page so it only opens with a password.
//
// Usage (PowerShell):
//   $env:PAGE_PASSWORD = "your-password"; node tools/encrypt-page.mjs private/night-mode.src.html night-mode.html
//
// The readable source lives in private/ (ignored by git). Only the encrypted
// output is published. The password is never written to disk.

import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [src, out] = process.argv.slice(2);
const password = process.env.PAGE_PASSWORD;
if (!src || !out || !password) {
  console.error("Usage: PAGE_PASSWORD=... node tools/encrypt-page.mjs <source.html> <output.html>");
  process.exit(1);
}

const html = readFileSync(src, "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
if (!head || !body) throw new Error("Could not find <head> and <body> in " + src);

const ITERATIONS = 310000;
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
);
const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(body)));
const b64 = (u8) => Buffer.from(u8).toString("base64");

// script.js is loaded only after unlocking, so it wires up the real page.
const lockedHead = head.replace(/\s*<script src="script\.js"[^>]*><\/script>/, "");

// Lock screen title comes from the page's <h1>; each page remembers its own unlock.
const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "Case study";
const title = h1.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// One unlock opens every case study that shares the password, so readers can move between them.
const storageKey = "unlock:case-studies";

const page = `<!DOCTYPE html>
<html lang="en">
<head>${lockedHead}</head>
<body>
  <main class="lock" id="lock">
    <a class="brand" href="index.html" aria-label="Lorenzo Mariotto, home">
      <span class="brand-mark">L</span>
      <span class="brand-name">Lorenzo Mariotto</span>
    </a>
    <form class="lock-card" id="lock-form" autocomplete="off">
      <p class="eyebrow">Protected case study</p>
      <h1>${title}</h1>
      <p class="lock-note">This project is password protected. Enter the password to view it, or get in touch to request access.</p>
      <label class="sr-only" for="lock-pw">Password</label>
      <div class="lock-row">
        <input id="lock-pw" type="password" placeholder="Password" required autofocus>
        <button class="button" type="submit">Unlock <span aria-hidden="true">→</span></button>
      </div>
      <p class="lock-error" id="lock-error" role="alert" hidden>That password isn’t right. Please try again.</p>
      <p class="lock-links"><a class="text-link" href="index.html">← Back to home</a> <a class="text-link" href="index.html#contact">Request access</a></p>
    </form>
    <noscript><p class="lock-note">Please enable JavaScript to unlock this page.</p></noscript>
  </main>
  <script>
  (() => {
    const DATA = { salt: "${b64(salt)}", iv: "${b64(iv)}", ct: "${b64(cipher)}", it: ${ITERATIONS} };
    const KEY = "${storageKey}";
    const form = document.getElementById("lock-form");
    const input = document.getElementById("lock-pw");
    const error = document.getElementById("lock-error");
    const btn = form.querySelector("button");
    const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

    async function unlock(pw) {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: bytes(DATA.salt), iterations: DATA.it, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
      );
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(DATA.iv) }, key, bytes(DATA.ct));
      document.body.innerHTML = new TextDecoder().decode(plain);
      // Scripts added via innerHTML don't run, so re-create them.
      document.body.querySelectorAll("script").forEach((old) => {
        const fresh = document.createElement("script");
        [...old.attributes].forEach((a) => fresh.setAttribute(a.name, a.value));
        fresh.textContent = old.textContent;
        old.replaceWith(fresh);
      });
      const s = document.createElement("script");
      s.src = "script.js";
      document.body.appendChild(s);
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      btn.disabled = true;
      error.hidden = true;
      try {
        await unlock(input.value);
        try { sessionStorage.setItem(KEY, input.value); } catch {}
      } catch {
        error.hidden = false;
        input.select();
        btn.disabled = false;
      }
    });

    let saved = null;
    try { saved = sessionStorage.getItem(KEY); } catch {}
    if (saved) unlock(saved).catch(() => { try { sessionStorage.removeItem(KEY); } catch {} });
  })();
  </script>
</body>
</html>
`;

writeFileSync(out, page);
console.log(`Encrypted ${src} -> ${out} (${cipher.length} bytes of ciphertext)`);
