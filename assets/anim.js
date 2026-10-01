/* Pohyb webu — GSAP + ScrollTrigger + MotionPath + Draggable, plynulý scroll Lenis.
   Celé je to nadstavba: bez knihoven (nebo s vypnutými animacemi v systému)
   zůstane web statický a plně čitelný. */
(function () {
  const gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(window.ScrollTrigger, window.MotionPathPlugin, window.Draggable);
  const ST = window.ScrollTrigger;
  const mene = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-anim");

  /* ---- plynulý scroll ---- */
  if (window.Lenis && !mene) {
    const lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      const cil = id === "#top" ? 0 : document.querySelector(id);
      if (cil === null) return;
      e.preventDefault();
      lenis.scrollTo(cil, { offset: cil === 0 ? 0 : -70 });
    }));
  }

  /* ---- nadpisy: skládání po slovech / písmenech ---- */
  function rozlozit(el, po) {
    const kusy = [];
    const maska = znak => {
      const m = document.createElement("span");
      m.className = "sp";
      const v = document.createElement("span");
      v.className = "sp__i";
      v.textContent = znak;
      m.appendChild(v);
      kusy.push(v);
      return m;
    };
    const obal = uzel => {
      const frag = document.createDocumentFragment();
      for (const slovo of uzel.textContent.split(/(\s+)/)) {
        if (!slovo.trim()) { frag.appendChild(document.createTextNode(slovo)); continue; }
        if (po === "chars") {
          const w = document.createElement("span");
          w.className = "spw";
          [...slovo].forEach(z => w.appendChild(maska(z)));
          frag.appendChild(w);
        } else {
          frag.appendChild(maska(slovo));
        }
      }
      uzel.replaceWith(frag);
    };
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) obal(n);
      else if (n.nodeType === 1) [...n.childNodes].forEach(m => m.nodeType === 3 && obal(m));
    });
    return kusy;
  }

  document.querySelectorAll("[data-reveal]").forEach(el => {
    const kusy = rozlozit(el, el.dataset.reveal);
    if (!kusy.length || mene) return;
    gsap.from(kusy, {
      yPercent: 118, rotate: 4, opacity: 0, duration: .8, ease: "back.out(1.6)",
      stagger: el.dataset.reveal === "chars" ? .028 : .05,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  /* ---- vynoření bloků ---- */
  if (!mene) [".polozka", ".misto", ".citace__mrizka blockquote", ".polaroidy figure", ".fakta li", ".ceny li", ".odrazky li", ".dotazy details"].forEach(sel => {
    const prvky = gsap.utils.toArray(sel);
    if (!prvky.length) return;
    gsap.from(prvky, {
      y: 40, opacity: 0, duration: .65, ease: "power3.out", stagger: .07, immediateRender: false,
      scrollTrigger: { trigger: prvky[0].parentElement, start: "top 86%", once: true },
    });
  });

  /* ---- parallax fotek ---- */
  if (!mene) {
    gsap.to(".uvod__koláž", { y: -46, ease: "none", scrollTrigger: { trigger: ".blok--uvod", start: "top top", end: "bottom top", scrub: .6 } });

    // kolečka v úvodu se jemně posouvají za myší — koláž tím ožije
    const kolaz = document.querySelector("[data-parallax]");
    if (kolaz && matchMedia("(hover: hover)").matches) {
      const vrstvy = [...kolaz.querySelectorAll("[data-hloubka]")].map(el => ({
        el, h: +el.dataset.hloubka,
        x: gsap.quickTo(el, "x", { duration: .8, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: .8, ease: "power3" }),
      }));
      addEventListener("pointermove", e => {
        const r = kolaz.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        vrstvy.forEach(v => { v.x(dx * v.h); v.y(dy * v.h); });
      });
    }

    // kolečka se plynule vznášejí, i když myš stojí
    gsap.utils.toArray(".uvod__kolecko").forEach((el, i) => {
      gsap.to(el, { yPercent: i % 2 ? 6 : -6, duration: 3.4 + i * .6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });
    gsap.utils.toArray(".polozka__foto img").forEach(img => {
      gsap.fromTo(img, { y: -10 }, { y: 10, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: .8 } });
    });
  }

  /* ---- běžící pás zrychluje podle scrollu ---- */
  const pas = document.getElementById("bandTrack");
  if (pas && !mene) {
    pas.parentElement.classList.add("is-js");
    const sirka = pas.scrollWidth / 2;
    const jizda = gsap.to(pas, { x: -sirka, duration: sirka / 62, ease: "none", repeat: -1 });
    let zpomal;
    ST.create({
      onUpdate: self => {
        gsap.to(jizda, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3), duration: .3, overwrite: true });
        clearTimeout(zpomal);
        zpomal = setTimeout(() => gsap.to(jizda, { timeScale: 1, duration: 1.2, overwrite: true }), 260);
      },
    });
  }

  /* ---- plovoucí posyp v úvodu ---- */
  const hriste = document.getElementById("floaties");
  if (hriste && !mene) {
    const tvary = [
      '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="20" rx="3" fill="%C"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="%C"/></svg>',
      '<svg viewBox="0 0 24 24"><path d="M12 3c4 6 7 9 7 12.5a7 7 0 0 1-14 0C5 12 8 9 12 3z" fill="%C"/></svg>',
    ];
    const barvy = ["%23fff", "%23A8C66C", "%23F2D45C", "%23D2334A", "%236B4430", "%23FFF3E6"];
    const kusy = [];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.className = "floatie";
      s.innerHTML = tvary[i % tvary.length].replace("%C", barvy[i % barvy.length]);
      s.style.left = (4 + Math.random() * 92) + "%";
      s.style.top = (12 + Math.random() * 74) + "%";
      s.style.width = (11 + Math.random() * 15) + "px";
      hriste.appendChild(s);
      kusy.push(s);
    }
    const mezi = (a, b) => a + Math.random() * (b - a);
    const letet = el => {
      gsap.set(el, { opacity: 0, scale: .4, rotate: mezi(-40, 40) });
      const doba = mezi(3.2, 5.2);
      const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(mezi(.4, 3), () => letet(el)) });
      tl.to(el, { opacity: .9, scale: 1, duration: .5, ease: "power2.out" })
        .to(el, { y: -mezi(70, 170), duration: doba * .45, ease: "power2.out" }, 0)
        .to(el, { y: 0, duration: doba * .55, ease: "power2.in" }, doba * .45)
        .to(el, { x: mezi(-70, 70), duration: doba, ease: "sine.inOut" }, 0)
        .to(el, { rotate: `+=${mezi(-180, 180)}`, duration: doba, ease: "none" }, 0)
        .to(el, { opacity: 0, scale: .5, duration: .6, ease: "power2.in" }, doba - .6);
      el._tl = tl;
    };
    kusy.forEach((el, i) => gsap.delayedCall(i * .3, () => letet(el)));
    document.addEventListener("visibilitychange", () => {
      kusy.forEach(el => el._tl && (document.hidden ? el._tl.pause() : el._tl.resume()));
    });
  }

  /* ---- lesk na kartách a magnetická tlačítka ---- */
  document.querySelectorAll("[data-glare]").forEach(k => {
    k.addEventListener("pointermove", e => {
      const r = k.getBoundingClientRect();
      k.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
      k.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
      k.style.setProperty("--go", ".65");
    });
    k.addEventListener("pointerleave", () => k.style.setProperty("--go", "0"));
  });

  if (!mene && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(b => {
      const x = gsap.quickTo(b, "x", { duration: .4, ease: "power3" });
      const y = gsap.quickTo(b, "y", { duration: .4, ease: "power3" });
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .22);
        y((e.clientY - r.top - r.height / 2) * .3);
      });
      b.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  /* ---- nálepky: plácnutí při příchodu ---- */
  if (!mene) gsap.utils.toArray(".sticker").forEach(n => {
    const rot = parseFloat(getComputedStyle(n).getPropertyValue("--rot")) || 0;
    gsap.from(n, {
      scale: .5, opacity: 0, rotate: rot - 14, duration: .6, ease: "back.out(2.4)", immediateRender: false,
      scrollTrigger: { trigger: n.parentElement, start: "top 88%", once: true },
    });
  });

  /* ---- VYBER SI PŘÍCHUŤ: barva se přelije celou sekcí ---- */
  // Bubliny vykresluje data.js, takže se výběr musí umět navázat znovu
  // (po načtení JSONů přijde událost "zd:data" a prvky jsou nové).
  function spustVyberPrichuti() {
  const sekce = document.getElementById("prichute");
  const bubliny = sekce && [...sekce.querySelectorAll(".bubliny li")];
  if (sekce && bubliny && bubliny.length) {
    const flood = document.getElementById("flood");
    const jmeno = document.getElementById("flavorName");
    const druh = document.getElementById("flavorKind");
    const popis = document.getElementById("flavorNote");
    const fotka = document.getElementById("flavorImg");
    const kruh = sekce.querySelector(".bubliny");

    // bubliny rozsadíme po celém kruhu — kolik jich je, tolik dílků
    const rozmisti = () => {
      const n = bubliny.length;
      const R = kruh.clientWidth / 2 - 4;
      // aby se nedotýkaly: průměr podle rozestupu na kružnici
      const velikost = Math.max(34, Math.min(84, 2 * R * Math.sin(Math.PI / n) - 3));
      kruh.style.setProperty("--bublina", velikost.toFixed(1) + "px");
      bubliny.forEach((li, i) => {
        const uhel = (-90 + i * (360 / n)) * Math.PI / 180;
        li.style.transform = `translate(${(Math.cos(uhel) * R).toFixed(1)}px, ${(Math.sin(uhel) * R).toFixed(1)}px)`;
      });
    };
    rozmisti();
    addEventListener("resize", rozmisti);

    // na světlé příchuti musí být tmavý text, jinak je nečitelný
    const svetla = hex => {
      const k = hex.replace("#", "").match(/\w\w/g).map(h => {
        const v = parseInt(h, 16) / 255;
        return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
      });
      return .2126 * k[0] + .7152 * k[1] + .0722 * k[2] > .32;
    };

    const zaklad = sekce.querySelector(".blok__in");
    let aktivni = null, umysl, vrstvaZiva = null;

    // velký obrázek vlevo: fotka, nebo kreslený kopeček v barvě příchuti
    const velkyKopecek = barva =>
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      `<path d="M22 74c0-23 17-42 38-42s38 19 38 42c0 5-3 8-8 8H30c-5 0-8-3-8-8z" fill="${barva}"/>` +
      '<path d="M38 60c4-10 12-17 22-18" stroke="rgba(255,255,255,.55)" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="60" cy="88" rx="40" ry="7" fill="rgba(0,0,0,.14)"/></svg>';

    const nastavObrazek = (koren, b) => {
      const img = koren.querySelector(".prichute__foto img");
      const kopecek = koren.querySelector(".prichute__kopecek");
      if (!img || !kopecek) return;
      if (b.dataset.img) {
        img.src = b.dataset.img;
        img.alt = b.dataset.name;
        img.hidden = false;
        kopecek.hidden = true;
      } else {
        img.hidden = true;
        kopecek.innerHTML = velkyKopecek(b.dataset.c);
        kopecek.hidden = false;
      }
    };
    const vyber = (li, hned) => {
      if (li === aktivni) return;
      const b = li.querySelector("button");
      const barva = b.dataset.c;
      const textBarva = svetla(barva) ? "#3A2A31" : "#ffffff";
      bubliny.forEach(x => x.classList.toggle("is-on", x === li));
      aktivni = li;

      const nastavZaklad = () => {
        sekce.style.setProperty("--barva", barva);
        sekce.style.setProperty("--text", textBarva);
        jmeno.textContent = b.dataset.name;
        druh.textContent = b.dataset.kind;
        popis.textContent = b.dataset.note;
        nastavObrazek(sekce, b);
      };

      if (mene || hned) { nastavZaklad(); return; }

      // Novou příchuť odkryje kruh, který roste přesně z bubliny — stará zůstane pod ním.
      // (Princip z bobaicecream.com: dvě vrstvy nad sebou a rostoucí kruhová maska.)
      const rs = sekce.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x = rb.left + rb.width / 2 - rs.left, y = rb.top + rb.height / 2 - rs.top;
      const dosah = Math.max(
        Math.hypot(x, y), Math.hypot(rs.width - x, y),
        Math.hypot(x, rs.height - y), Math.hypot(rs.width - x, rs.height - y)
      );

      if (vrstvaZiva) vrstvaZiva.remove();
      const vrstva = document.createElement("div");
      vrstva.className = "vrstva";
      vrstva.setAttribute("aria-hidden", "true");
      vrstva.style.setProperty("--barva-nova", barva);
      vrstva.style.setProperty("--text-nova", textBarva);

      const klon = zaklad.cloneNode(true);
      klon.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
      klon.querySelector(".prichute__nazev").textContent = b.dataset.name;
      klon.querySelector(".prichute__druh").textContent = b.dataset.kind;
      klon.querySelector(".prichute__popis").textContent = b.dataset.note;
      nastavObrazek(klon, b);
      const poradi = bubliny.indexOf(li);
      [...klon.querySelectorAll(".bubliny li")].forEach((el, i) => el.classList.toggle("is-on", i === poradi));
      vrstva.appendChild(klon);
      sekce.appendChild(vrstva);
      vrstvaZiva = vrstva;

      gsap.fromTo(vrstva,
        { clipPath: "circle(0px at " + x + "px " + y + "px)" },
        {
          clipPath: "circle(" + Math.round(dosah) + "px at " + x + "px " + y + "px)",
          duration: .85, ease: "power3.inOut",
          onComplete: () => {
            nastavZaklad();
            vrstva.remove();
            if (vrstvaZiva === vrstva) vrstvaZiva = null;
          },
        });
      gsap.from(klon.querySelector(".prichute__foto"), { scale: .82, rotate: -8, duration: .7, ease: "back.out(1.6)" });
      gsap.from(klon.querySelectorAll(".prichute__nazev, .prichute__popis, .prichute__druh"),
        { y: 16, opacity: 0, duration: .45, stagger: .05, ease: "power2.out" });
    };

    bubliny.forEach(li => {
      const b = li.querySelector("button");
      b.addEventListener("click", () => { clearTimeout(umysl); vyber(li); });
      if (matchMedia("(hover: hover)").matches) {
        // hover vybírá se zpožděním, aby přejetí přes oblouk sekci nerozblikalo
        b.addEventListener("pointerenter", () => { clearTimeout(umysl); umysl = setTimeout(() => vyber(li), 170); });
        b.addEventListener("pointerleave", () => clearTimeout(umysl));
      }
      b.addEventListener("focus", () => vyber(li));
      if (b.dataset.img) { const p = new Image(); p.src = b.dataset.img; }
    });
    vyber(bubliny[0], true);

    if (!mene) gsap.fromTo(bubliny.map(li => li.querySelector("button")),
      { "--in": 0, opacity: 0 },
      { "--in": 1, opacity: 1, duration: .55, ease: "back.out(2)", stagger: .06, immediateRender: false,
        scrollTrigger: { trigger: sekce, start: "top 78%", once: true } });
  }

  }
  spustVyberPrichuti();
  document.addEventListener("zd:data", () => spustVyberPrichuti());

  /* ---- CESTA: kornout jede po trase ---- */
  const scena = document.getElementById("journeyStage");
  const draha = document.getElementById("routePath");
  const kornout = document.getElementById("travelCone");
  const zastavky = gsap.utils.toArray(".zastavka");

  if (scena && draha && kornout) {
    const delka = draha.getTotalLength();
    const nakreslena = document.getElementById("routeDrawn");
    gsap.set(nakreslena, { strokeDasharray: delka, strokeDashoffset: delka });

    const posadit = () => {
      const mapa = scena.querySelector(".mapa__svg").getBoundingClientRect();
      const mer = Math.min(mapa.width / 1200, mapa.height / 640);
      const px = (mapa.width - 1200 * mer) / 2, py = (mapa.height - 640 * mer) / 2;
      zastavky.forEach(z => {
        const bod = draha.getPointAtLength(delka * parseFloat(z.dataset.t));
        z.style.left = (px + bod.x * mer) + "px";
        z.style.top = (py + bod.y * mer) + "px";
      });
    };

    const mm = gsap.matchMedia();

    mm.add("(min-width: 981px)", () => {
      scena.classList.add("is-map");
      posadit();
      addEventListener("resize", posadit);

      // Bez připínání sekce — pin se spolu s plynulým scrollem trhal.
      // Trasa se kreslí prostě podle toho, jak sekce projíždí obrazovkou.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scena, start: "top 72%", end: "bottom 40%",
          scrub: 1,
          onUpdate: self => {
            // zastávka se rozsvítí, až k ní kornout opravdu dojede
            zastavky.forEach(z => z.classList.toggle("is-on", self.progress >= parseFloat(z.dataset.t)));
          },
        },
      });
      tl.to(nakreslena, { strokeDashoffset: 0, ease: "none" }, 0)
        .to(kornout, { motionPath: { path: draha, align: draha, alignOrigin: [.5, .9], autoRotate: false }, ease: "none" }, 0);

      return () => {
        removeEventListener("resize", posadit);
        scena.classList.remove("is-map");
        zastavky.forEach(z => { z.style.left = z.style.top = ""; z.classList.remove("is-on"); });
      };
    });

    mm.add("(max-width: 980px)", () => {
      zastavky.forEach(z => ST.create({ trigger: z, start: "top 88%", once: true, onEnter: () => z.classList.add("is-on") }));
    });
  }

  /* ---- galerie k tažení ---- */
  const pasFotek = document.getElementById("galleryTrack");
  if (pasFotek && window.Draggable && innerWidth > 980) {
    gsap.utils.toArray(".polaroidy figure").forEach(f => {
      f.dataset.r = (getComputedStyle(f).getPropertyValue("--r").trim() || "0deg").replace("deg", "");
    });
    window.Draggable.create(pasFotek, {
      type: "x",
      bounds: { minX: Math.min(0, pasFotek.parentElement.clientWidth - pasFotek.scrollWidth - 40), maxX: 0 },
      edgeResistance: .9, cursor: "grab", activeCursor: "grabbing",
      onDrag() { gsap.to(this.target.children, { rotate: gsap.utils.clamp(-7, 7, -this.deltaX * .35), duration: .4, overwrite: true }); },
      onRelease() { gsap.to(this.target.children, { rotate: (i, el) => el.dataset.r || 0, duration: .7, ease: "elastic.out(1,.6)" }); },
    });
  }

  /* ---- skákající ovoce nad patičkou ---- */
  const sad = document.getElementById("fruitfield");
  if (sad && !mene) {
    const OVOCE = {
      malina: '<svg viewBox="0 0 48 48"><g fill="#D6336C"><circle cx="24" cy="20" r="6"/><circle cx="17" cy="26" r="6"/><circle cx="31" cy="26" r="6"/><circle cx="24" cy="32" r="6"/></g><path d="M24 14c-3-4-8-4-10-2 3 1 5 3 6 6z" fill="#5C9E4A"/></svg>',
      jahoda: '<svg viewBox="0 0 48 48"><path d="M24 12c9 0 14 6 14 13s-7 13-14 13-14-6-14-13 5-13 14-13z" fill="#E63946"/><g fill="#fff"><circle cx="19" cy="22" r="1.4"/><circle cx="28" cy="21" r="1.4"/><circle cx="24" cy="28" r="1.4"/><circle cx="31" cy="28" r="1.4"/><circle cx="17" cy="30" r="1.4"/></g><path d="M24 12c-4-3-9-3-11 0 3 0 6 1 8 3 2-2 5-3 8-3-2-2-4-2-5 0z" fill="#5C9E4A"/></svg>',
      mango: '<svg viewBox="0 0 48 48"><path d="M32 12c7 2 9 12 4 20s-16 10-20 4 0-18 8-22c3-1.5 6-2.5 8-2z" fill="#F2A03D"/><path d="M33 14c4 4 4 13-1 19" stroke="#E2732C" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
      citron: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="15" ry="11" fill="#F6D33C" transform="rotate(-18 24 24)"/></svg>',
      boruvka: '<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="12" fill="#4C5BAF"/><path d="M24 14l4 4-4 3-4-3z" fill="#2F3C86"/></svg>',
      visne: '<svg viewBox="0 0 48 48"><path d="M24 8c-4 6-10 8-12 12" stroke="#5C9E4A" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M24 8c3 7 8 9 11 12" stroke="#5C9E4A" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="12" cy="32" r="8" fill="#B8263C"/><circle cx="35" cy="32" r="8" fill="#D6334F"/></svg>',
      skorice: '<svg viewBox="0 0 48 48"><rect x="8" y="18" width="32" height="12" rx="6" fill="#A2652F"/><path d="M14 18v12M20 18v12M26 18v12M32 18v12" stroke="#7E4A1E" stroke-width="1.4" opacity=".7"/></svg>',
      pistacie: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="12" ry="9" fill="#C9AE7B" transform="rotate(-14 24 24)"/><ellipse cx="24" cy="25" rx="6" ry="4" fill="#8FBF58" transform="rotate(-14 24 25)"/></svg>',
    };
    const kusy = [];
    Object.values(OVOCE).forEach(svg => {
      const el = document.createElement("span");
      el.className = "fruit";
      el.innerHTML = svg;
      sad.appendChild(el);
      kusy.push(el);
    });
    const mezi = (a, b) => a + Math.random() * (b - a);
    const skok = el => {
      const doba = mezi(.55, .85);
      gsap.set(el, { left: mezi(2, 92) + "%", x: 0, y: 0, rotate: mezi(-25, 25), scale: 1, opacity: 1, transformOrigin: "50% 100%" });
      const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(mezi(.1, 1.4), () => skok(el)) });
      let h = mezi(50, 120);
      for (let i = 0; i < 3; i++) {
        tl.to(el, { y: -h, duration: doba * .5, ease: "power2.out" })
          .to(el, { y: 0, duration: doba * .5, ease: "power2.in" })
          .to(el, { scaleY: .78, scaleX: 1.2, duration: .08, ease: "power2.out" })
          .to(el, { scaleY: 1, scaleX: 1, duration: .22, ease: "elastic.out(1,.45)" });
        h *= .55;
      }
      tl.to(el, { x: mezi(-60, 60), rotate: `+=${mezi(-160, 160)}`, duration: tl.duration(), ease: "none" }, 0)
        .to(el, { opacity: 0, duration: .35, ease: "power2.in" }, tl.duration() - .35);
      el._tl = tl;
    };
    kusy.forEach((el, i) => gsap.delayedCall(i * .45, () => skok(el)));
    document.addEventListener("visibilitychange", () => {
      kusy.forEach(el => el._tl && (document.hidden ? el._tl.pause() : el._tl.resume()));
    });
  }

  let prepocet;
  ["resize", "orientationchange"].forEach(ev => addEventListener(ev, () => {
    clearTimeout(prepocet);
    prepocet = setTimeout(() => ST.refresh(), 200);
  }));

  ST.refresh();
})();
