"use strict";
/* Cosas que comparten todas las páginas: herramientas de accesibilidad y datos de contacto. */
(function () {
  const TEXTO_FORMULARIO = { enviando: "Enviando…", enviado: "Enviado", error: "No se pudo enviar. Se abrirá tu programa de correo para que puedas enviar el mensaje.", respaldo: "Se abrió tu programa de correo con el mensaje listo para enviar." };
  const raiz = document.documentElement;
  const KEY = "mapa-ar-accesibilidad";
  const estado = { tam: 0, gris: false, contraste: false, subrayar: false };

  function leer() {
    try { Object.assign(estado, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* sin almacenamiento */ }
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ }
  }
  function aplicar() {
    estado.tam = Math.max(-2, Math.min(4, estado.tam | 0));
    raiz.style.fontSize = 100 + estado.tam * 10 + "%";
    raiz.classList.toggle("gris", !!estado.gris);
    raiz.classList.toggle("contraste", !!estado.contraste);
    raiz.classList.toggle("subrayar", !!estado.subrayar);
    document.querySelectorAll("[data-acc]").forEach(b => {
      const k = b.dataset.acc;
      if (["gris", "contraste", "subrayar"].includes(k)) b.setAttribute("aria-pressed", String(!!estado[k]));
    });
  }

  leer();
  aplicar();
  document.querySelectorAll("[data-acc]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.acc;
    if (k === "mas") estado.tam++;
    else if (k === "menos") estado.tam--;
    else if (k === "reset") Object.assign(estado, { tam: 0, gris: false, contraste: false, subrayar: false });
    else estado[k] = !estado[k];
    aplicar();
    guardar();
    window.dispatchEvent(new Event("resize")); // el mapa se reacomoda al cambiar el tamaño del texto
  }));

  /* contacto: sólo aparece si hay datos cargados en config.js */
  const c = window.CONFIG || {};
  const hay = c.email || c.telefono || c.direccion || c.formulario;
  const sec = document.getElementById("contacto");
  if (sec && hay) {
    const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const filas = [];
    if (c.area) filas.push(`<dt>Área</dt><dd>${esc(c.area)}</dd>`);
    if (c.direccion) filas.push(`<dt>Dirección</dt><dd>${esc(c.direccion)}</dd>`);
    if (c.telefono) filas.push(`<dt>Teléfono</dt><dd>${esc(c.telefono)}</dd>`);
    if (c.email) filas.push(`<dt>Correo</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>`);
    if (c.formulario) filas.push(`<dt>Formulario</dt><dd><a href="${esc(c.formulario)}" rel="noopener">Acceder al formulario de contacto</a></dd>`);
    document.getElementById("contactoCuerpo").innerHTML = `<p><strong>${esc(c.organismo || "")}</strong></p><dl>${filas.join("")}</dl>`;
    sec.hidden = false;
    const m = document.getElementById("menuContacto");
    if (m) m.hidden = false;
  }
  /* formulario de comentarios: aparece sólo si hay un destino (envio o email) en config.js */
  const com = document.getElementById("comentarios");
  if (com && (c.envio || c.email)) {
    com.hidden = false;
    const form = document.getElementById("formComentarios");
    const estadoForm = document.getElementById("estadoForm");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const quiero = d.getAll("quiero").join("; ");
      d.delete("quiero"); d.append("quiero", quiero);
      if (d.get("_honey")) return;
      if (c.envio) {
        estadoForm.textContent = TEXTO_FORMULARIO.enviando;
        try {
          const datos = Object.fromEntries(d.entries());
          const r = await fetch(c.envio, { method: "POST", body: JSON.stringify(datos), headers: { Accept: "application/json", "Content-Type": "application/json" } });
          if (!r.ok) throw new Error(String(r.status));
          const resultado = await r.json();
          if (resultado.success === false) throw new Error("formsubmit");
          form.reset();
          estadoForm.textContent = TEXTO_FORMULARIO.enviado;
        } catch (e) {
          const cuerpo = [...d.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
          location.href = `mailto:${c.email}?subject=${encodeURIComponent(d.get("_subject") || "Comentarios sobre el mapa")}&body=${encodeURIComponent(cuerpo)}`;
          estadoForm.textContent = TEXTO_FORMULARIO.error;
        }
      } else {
        const cuerpo = [...d.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${c.email}?subject=${encodeURIComponent("Comentarios sobre el mapa")}&body=${encodeURIComponent(cuerpo)}`;
        estadoForm.textContent = TEXTO_FORMULARIO.respaldo;
      }
    });
  }
})();
