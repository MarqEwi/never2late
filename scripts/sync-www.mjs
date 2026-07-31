// Kopiert die Web-App in den www/-Ordner (Quelle für Capacitor).
// Als Node-Skript, damit es auf Windows, Mac und Linux gleich funktioniert.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("www", { recursive: true });

for (const f of ["index.html", "datenschutz.html", "manifest.webmanifest", "sw.js"]) {
  cpSync(f, `www/${f}`);
}
cpSync("icons", "www/icons", { recursive: true });

console.log("www/ aktualisiert.");
