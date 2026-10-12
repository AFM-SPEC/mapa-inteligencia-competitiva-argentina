/* Datos de contacto del sitio. Dejar vacío lo que no se quiera mostrar:
   si no hay correo, teléfono, dirección ni formulario, la sección «Contacto»
   y el formulario «Dejanos tus comentarios» no aparecen. El formulario necesita `envio` (un servicio que reciba los mensajes) o, si no, `email` (abre el correo de quien escribe). */
window.CONFIG = {
  organismo: "NEETI",
  area: "",
  email: "info@neetipol.com",
  telefono: "",
  direccion: "",
  formulario: "",
  envio: "",   // dirección a la que se envía el formulario de comentarios (por ejemplo, de Formspree)
};
