/* Základ webu: sezóna, živý stav otevřeno, pruh s novinkou, mobilní menu.
   Běží i bez animačních knihoven.

   ====== CO SE UPRAVUJE PŘI ZMĚNĚ PROVOZU (všechno je tady nahoře) ====== */

// Otevírací doba domku (od 21. 9. 2026). Při změně upravit i texty v index.html.
const HOURS = { open: 13 * 60, close: 18 * 60 };

// Sezóna domku – mimo ni web nehlásí otevírací dobu, ale zimní přestávku.
// TODO: potvrdit s majitelem skutečný začátek a konec sezóny.
const SEASON = { od: "03-15", do: "10-31" };

// Pruh nahoře. Novinku stačí přepsat tady; prázdný text = pruh se nezobrazí.
const NOVINKA = {
  text: "Nově máme otevřeno denně 13:00–18:00.",
  datum: "2026-09-21",   // od kdy novinku ukazovat
  dni: 45,               // jak dlouho ji držet na webu
};

/* ====================================================================== */

// aktuální čas v Česku bez ohledu na pásmo návštěvníka
const ted = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
}).formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});

const denVRoce = `${ted.month}-${ted.day}`;
const vSezone = SEASON.od <= SEASON.do
  ? denVRoce >= SEASON.od && denVRoce <= SEASON.do
  : denVRoce >= SEASON.od || denVRoce <= SEASON.do;

(function status() {
  const el = document.getElementById("status");
  if (!el) return;
  const label = el.querySelector("span");
  if (!vSezone) {
    label.textContent = "Zimní přestávka · automaty jedou dál";
    return;
  }
  const minuty = +ted.hour * 60 + +ted.minute;
  if (minuty >= HOURS.open && minuty < HOURS.close) {
    el.classList.add("is-open");
    label.textContent = "Právě otevřeno · do 18:00";
  } else if (minuty < HOURS.open) {
    label.textContent = "Zavřeno · otevíráme ve 13:00";
  } else {
    label.textContent = "Zavřeno · zítra od 13:00";
  }
})();

(function topbar() {
  const bar = document.getElementById("topbar");
  if (!bar) return;
  const text = document.getElementById("topbarText");
  const tag = document.getElementById("topbarTag");

  if (!vSezone) {
    bar.classList.add("topbar--season");
    tag.textContent = "Zimní přestávka";
    text.textContent = "Domek má zimní přestávku. Zmrzlinu v kelímcích seženete v našich automatech nonstop.";
    bar.hidden = false;
    return;
  }
  // novinka se po nastavené době sama schová, ať na webu nestraší stará zpráva
  const start = new Date(NOVINKA.datum + "T00:00:00");
  const konec = new Date(start.getTime() + NOVINKA.dni * 86400000);
  if (NOVINKA.text && new Date() >= start && new Date() <= konec) {
    tag.textContent = "Novinka";
    text.textContent = NOVINKA.text;
    bar.hidden = false;
  }
})();

const burger = document.getElementById("burger");
const links = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  const open = burger.getAttribute("aria-expanded") !== "true";
  burger.setAttribute("aria-expanded", open);
  links.classList.toggle("is-open", open);
});
links.addEventListener("click", e => {
  if (e.target.tagName === "A") {
    burger.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
