/* Datová vrstva webu.
   Načte JSONy z assets/data/, a než dojedou (nebo když se nenačtou vůbec),
   vykreslí web z vestavěné zálohy — takže stránka nikdy nezůstane prázdná.

   Po načtení JSONů se vše překreslí a pošle se událost "zd:data",
   na kterou si animace znovu navážou výběr příchutí.

   Pozn.: build.py dává otisk ?v= jen obrázkům, stylu a skriptům. JSONy proto
   verzujeme ručně konstantou VERZE — po úpravě dat ji zvyš, ať se neukáže
   stará verze z cache prohlížeče. */
window.ZD = (function () {
  "use strict";

  const VERZE = "2";
  const CESTA = "assets/data/";

  /* ---------- vestavěná záloha ---------- */
  const ZALOHA = {
    prichute: {
      prichute: [
        { id: "jahoda", nazev: "jahoda", druh: "ovocná", barva: "#F4A3B4", popis: "Stálice, kterou u nás najdete každý den. Nejčastěji v páru s vanilkou.", foto: "assets/img/prichut-jahoda.webp", dostupne: true },
        { id: "malina", nazev: "malina", druh: "ovocná", barva: "#D2334A", popis: "Ostře červená, výrazná. Sluší jí vanilka vedle.", foto: "assets/img/prichut-malina.webp", dostupne: true },
        { id: "jablko", nazev: "zelené jablko", druh: "ovocná", barva: "#A8C66C", popis: "Svěží a kyselejší. Dobře se snáší se skořicí.", foto: "assets/img/prichut-jablko.webp", dostupne: true },
        { id: "vanilka", nazev: "vanilka", druh: "smetanová", barva: "#F6E7B8", popis: "Klasika, která se hodí ke každé ovocné.", foto: "assets/img/prichut-vanilka.webp", dostupne: true },
        { id: "karamel", nazev: "slaný karamel", druh: "smetanová", barva: "#C98F4E", popis: "Sladká se špetkou soli. Bývá i v kelímcích s sebou.", foto: "assets/img/prichut-karamel.webp", dostupne: true },
        { id: "cokolada", nazev: "čokoláda", druh: "smetanová", barva: "#8B5A3C", popis: "Tmavá a hutná. Jistota pro ty, co nechtějí experimentovat.", foto: "assets/img/prichut-cokolada.webp", dostupne: true },
      ],
    },
    dnes: {
      aktualizovano: "2026-10-01",
      stroje: [
        { stroj: 1, leva: "jahoda", prava: "vanilka", stitek: null },
        { stroj: 2, leva: "TODO", prava: "TODO", stitek: null },
        { stroj: 3, leva: "TODO", prava: "TODO", stitek: null },
      ],
    },
    automaty: {
      domek: { id: "domek", nazev: "Zmrzlinový domek", mesto: "Nučnice", adresa: "Nučnice 40, 411 48 Křešice", poznamka: "u přívozu přes Labe", lat: 50.50801, lng: 14.2275, stav: "provoz", overeno: false, mapa: "https://mapy.cz/s/febajaroma" },
      automaty: [
        { id: "steti", mesto: "Štětí", adresa: "Litoměřická 722", lat: 50.4574, lng: 14.36944, stav: "provoz", poznamka: null, overeno: false },
        { id: "roudnice", mesto: "Roudnice nad Labem", adresa: "Hornická 2500", lat: 50.42585, lng: 14.23866, stav: "provoz", poznamka: null, overeno: false },
        { id: "litomerice", mesto: "Litoměřice", adresa: "Na Výsluní", lat: 50.55008, lng: 14.12754, stav: "provoz", poznamka: "vedle Alzaboxu", overeno: false },
        { id: "lovosice", mesto: "Lovosice", adresa: "Terezínská 87", lat: 50.50912, lng: 14.07108, stav: "provoz", poznamka: null, overeno: false },
        { id: "melnik", mesto: "Mělník", adresa: "Nádražní 1750/19", lat: 50.35613, lng: 14.48701, stav: "mimo", poznamka: "zadní strana budovy Barvy-Laky; od 23. 9. 2026 po poškození mimo provoz", overeno: false },
      ],
    },
    builder: {
      nadoby: [
        { id: "kornout-maly", nazev: "Malý kornout", cena: 35, kopecku: 1 },
        { id: "kornout-velky", nazev: "Velký kornout", cena: 45, kopecku: 2 },
        { id: "miska", nazev: "Miska", cena: 60, kopecku: 2 },
        { id: "kelimek", nazev: "Kelímek s sebou", cena: null, kopecku: 1, poznamka: "TODO: cena" },
      ],
      priplatky: { poleva: { nazev: "Poleva", cena: 15 }, posyp: { nazev: "Posyp", cena: 10 } },
      polevy: [], posypy: [],
    },
  };

  let data = JSON.parse(JSON.stringify(ZALOHA));

  /* ---------- pomůcky ---------- */
  const jeTodo = v => typeof v === "string" && v.trim().toUpperCase() === "TODO";
  const prichut = id => data.prichute.prichute.find(p => p.id === id) || null;
  const vNabidce = () => data.prichute.prichute.filter(p => p.dostupne !== false);

  // kopeček pro příchutě, které zatím nemají fotku
  const kopecekSvg = (barva, velky) => {
    const r = velky ? 'viewBox="0 0 120 120" class="kopecek kopecek--velky"' : 'viewBox="0 0 120 120" class="kopecek"';
    return `<svg ${r} aria-hidden="true">` +
      `<path d="M22 74c0-23 17-42 38-42s38 19 38 42c0 5-3 8-8 8H30c-5 0-8-3-8-8z" fill="${barva}"/>` +
      `<path d="M38 60c4-10 12-17 22-18" stroke="rgba(255,255,255,.55)" stroke-width="7" stroke-linecap="round" fill="none"/>` +
      `<ellipse cx="60" cy="86" rx="40" ry="7" fill="rgba(0,0,0,.12)"/></svg>`;
  };

  /* ---------- hero: co se právě točí ---------- */
  function vykresliDnes() {
    const box = document.getElementById("dnes");
    if (!box) return;
    const dvojice = (data.dnes.stroje || [])
      .map(s => ({ s, a: prichut(s.leva), b: prichut(s.prava) }))
      .filter(x => x.a && x.b);

    const seznam = box.querySelector(".dnes__seznam");
    if (!seznam) return;
    seznam.innerHTML = "";

    if (!dvojice.length) {
      seznam.innerHTML = '<li class="dnes__chybi">Dnešní příchutě najdete na <a class="podtrzeny" href="https://www.instagram.com/zmrzlinovy_domek/" target="_blank" rel="noopener">Instagramu</a>.</li>';
      return;
    }

    dvojice.forEach(({ s, a, b }) => {
      const li = document.createElement("li");
      li.className = "dnes__par";
      li.innerHTML =
        '<span class="dnes__kulicky" aria-hidden="true">' +
        `<i style="--c:${a.barva}"></i><i style="--c:${b.barva}"></i></span>` +
        `<span class="dnes__nazvy">${a.nazev} × ${b.nazev}</span>` +
        (s.stitek ? `<span class="dnes__stitek-maly">${s.stitek}</span>` : "");
      seznam.appendChild(li);
    });

    const neznamych = (data.dnes.stroje || []).filter(s => jeTodo(s.leva) || jeTodo(s.prava)).length;
    const pozn = box.querySelector(".dnes__pozn");
    if (pozn) {
      pozn.textContent = neznamych
        ? "Další dvojice měníme skoro každý den — co je dnes, píšeme na Instagram."
        : "Dvojice měníme skoro každý den.";
    }
  }

  /* ---------- sekce Vyber si příchuť ---------- */
  function vykresliBubliny() {
    const ul = document.getElementById("bubbles");
    if (!ul) return;
    const vyber = vNabidce();
    if (!vyber.length) return;

    ul.innerHTML = "";
    ul.dataset.pocet = vyber.length;
    vyber.forEach(p => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.c = p.barva;
      b.dataset.kind = p.druh;
      b.dataset.name = p.nazev;
      b.dataset.note = p.popis;
      if (p.foto) b.dataset.img = p.foto;
      b.setAttribute("aria-label", p.nazev);
      b.innerHTML = p.foto
        ? `<img src="${p.foto}" alt="" width="560" height="560" loading="lazy">`
        : kopecekSvg(p.barva, false);
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  /* ---------- ceník ---------- */
  function vykresliCenik() {
    const ul = document.getElementById("ceny");
    if (!ul) return;
    ul.innerHTML = "";
    data.builder.nadoby.forEach(n => {
      if (n.cena == null) return;              // kelímek bez ceny do tabule nedáváme
      const li = document.createElement("li");
      li.innerHTML = `<span>${n.nazev}</span><b>${n.cena}</b>`;
      ul.appendChild(li);
    });
    [["posyp", data.builder.priplatky.posyp], ["poleva", data.builder.priplatky.poleva]].forEach(([, p]) => {
      if (!p) return;
      const li = document.createElement("li");
      li.className = "ceny--priplatek";
      li.innerHTML = `<span>${p.nazev}</span><b>+${p.cena}</b>`;
      ul.appendChild(li);
    });
  }

  /* ---------- automaty: dlaždice v sekci i seznam v patičce ---------- */
  function vykresliAutomaty() {
    const mrizka = document.getElementById("mista");
    if (mrizka) {
      mrizka.innerHTML = "";
      data.automaty.automaty.forEach(a => {
        const odkaz = document.createElement("a");
        odkaz.className = "misto" + (a.stav === "mimo" ? " misto--mimo" : "");
        odkaz.href = "https://mapy.cz/?q=" + encodeURIComponent(a.adresa + ", " + a.mesto);
        odkaz.target = "_blank";
        odkaz.rel = "noopener";
        odkaz.dataset.automat = a.id;
        odkaz.innerHTML =
          `<b>${a.mesto}</b><span>${a.adresa}${a.poznamka && a.stav !== "mimo" ? ", " + a.poznamka : ""}</span>` +
          (a.stav === "mimo"
            ? '<em class="mimo">Dočasně mimo provoz</em>'
            : '<em>Navigovat →</em>');
        mrizka.appendChild(odkaz);
      });
    }

    const vPate = document.getElementById("pataAutomaty");
    if (vPate) {
      vPate.innerHTML = "";
      data.automaty.automaty.forEach(a => {
        const li = document.createElement("li");
        if (a.stav === "mimo") {
          li.className = "pata__mimo";
          li.textContent = `${a.mesto} — dočasně mimo provoz`;
        } else {
          li.textContent = `${a.mesto} — ${a.adresa}`;
        }
        vPate.appendChild(li);
      });
    }
  }

  function vykresliVse() {
    vykresliDnes();
    vykresliBubliny();
    vykresliCenik();
    vykresliAutomaty();
  }

  /* ---------- načtení ---------- */
  async function nactiSoubor(jmeno) {
    const r = await fetch(`${CESTA}${jmeno}.json?v=${VERZE}`, { cache: "no-cache" });
    if (!r.ok) throw new Error(jmeno + ": " + r.status);
    return r.json();
  }

  async function nacti() {
    const jmena = ["prichute", "dnes", "automaty", "builder"];
    const vysledky = await Promise.allSettled(jmena.map(nactiSoubor));
    vysledky.forEach((v, i) => {
      if (v.status === "fulfilled" && v.value) data[jmena[i]] = v.value;
    });
    vykresliVse();
    document.dispatchEvent(new CustomEvent("zd:data", { detail: data }));
    return data;
  }

  // první vykreslení ze zálohy proběhne hned, ať na webu nic nechybí
  vykresliVse();
  const pripraveno = nacti().catch(() => data);

  return { get data() { return data; }, ZALOHA, nacti, pripraveno, prichut, vykresliVse };
})();
