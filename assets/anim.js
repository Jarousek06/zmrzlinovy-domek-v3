/* Pohyb: GSAP + ScrollTrigger + MotionPath + Draggable, plynulý scroll Lenis.
   Dobrovolná vrstva — bez knihoven (nebo s vypnutými animacemi) zůstane web statický. */
(function () {
  const gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(window.ScrollTrigger, window.MotionPathPlugin, window.Draggable);
  const ST = window.ScrollTrigger;
  const lessMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-anim");

  /* ---- plynulý scroll ---- */
  if (window.Lenis && !lessMotion) {
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
      lenis.scrollTo(cil, { offset: cil === 0 ? 0 : -86 });
    }));
  }

  /* ---- nadpisy: skládání po slovech / písmenech ---- */
  function rozlozit(el, po) {
    const kusy = [];
    const maskaZ = znak => {
      const maska = document.createElement("span");
      maska.className = "sp";
      const vnitrek = document.createElement("span");
      vnitrek.className = "sp__i";
      vnitrek.textContent = znak;
      maska.appendChild(vnitrek);
      kusy.push(vnitrek);
      return maska;
    };
    const obal = uzel => {
      const frag = document.createDocumentFragment();
      // slova držíme pohromadě, ať se nadpis nezlomí uprostřed slova
      for (const slovo of uzel.textContent.split(/(\s+)/)) {
        if (!slovo.trim()) { frag.appendChild(document.createTextNode(slovo)); continue; }
        if (po === "chars") {
          const obalSlova = document.createElement("span");
          obalSlova.className = "spw";
          [...slovo].forEach(z => obalSlova.appendChild(maskaZ(z)));
          frag.appendChild(obalSlova);
        } else {
          frag.appendChild(maskaZ(slovo));
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
    if (!kusy.length || lessMotion) return;
    gsap.from(kusy, {
      yPercent: 120, rotate: 5, opacity: 0, duration: .85, ease: "back.out(1.6)",
      stagger: el.dataset.reveal === "chars" ? .03 : .055,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  /* ---- vynoření bloků ---- */
  if (!lessMotion) [".card", ".ticket", ".quotes blockquote", ".pricelist li", ".ticks li", ".gallery figure"].forEach(sel => {
    const prvky = gsap.utils.toArray(sel);
    if (!prvky.length) return;
    gsap.from(prvky, {
      y: 46, opacity: 0, duration: .7, ease: "power3.out", stagger: .08,
      scrollTrigger: { trigger: prvky[0].parentElement, start: "top 85%", once: true },
    });
  });

  /* ---- parallax ---- */
  if (!lessMotion) {
    gsap.to(".hero__art", { y: -60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 } });
    gsap.utils.toArray(".card__img img").forEach(img => {
      gsap.fromTo(img, { y: -12 }, { y: 12, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: .8 } });
    });
  }

  /* ---- pás příchutí: rychlost podle scrollu ---- */
  const pas = document.getElementById("bandTrack");
  if (pas && !lessMotion) {
    pas.parentElement.classList.add("is-js");
    const sirka = pas.scrollWidth / 2;
    const jizda = gsap.to(pas, { x: -sirka, duration: sirka / 65, ease: "none", repeat: -1 });
    let zpomal;
    ST.create({
      onUpdate: self => {
        gsap.to(jizda, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3), duration: .3, overwrite: true });
        clearTimeout(zpomal);
        zpomal = setTimeout(() => gsap.to(jizda, { timeScale: 1, duration: 1.2, overwrite: true }), 260);
      },
    });
  }

  /* ---- plovoucí posyp v hlavičce ---- */
  const hriste = document.getElementById("floaties");
  if (hriste && !lessMotion) {
    const tvary = [
      '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="20" rx="3" fill="%C" stroke="%232B1620" stroke-width="2"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="%C" stroke="%232B1620" stroke-width="2"/></svg>',
      '<svg viewBox="0 0 24 24"><path d="M12 3c4 6 7 9 7 12.5a7 7 0 0 1-14 0C5 12 8 9 12 3z" fill="%C" stroke="%232B1620" stroke-width="2"/></svg>',
    ];
    const barvy = ["#F4A3B4", "#A8C66C", "#F2D45C", "#E85C86", "#8FD3E8", "#C98F4E"];
    const prvky = [];
    for (let i = 0; i < 13; i++) {
      const s = document.createElement("span");
      s.className = "floatie";
      s.innerHTML = tvary[i % tvary.length].replace("%C", encodeURIComponent(barvy[i % barvy.length]));
      s.style.left = (4 + Math.random() * 92) + "%";
      s.style.top = (12 + Math.random() * 76) + "%";
      s.style.width = (12 + Math.random() * 16) + "px";
      hriste.appendChild(s);
      prvky.push(s);
    }
    const mezi = (a, b) => a + Math.random() * (b - a);
    const letet = el => {
      gsap.set(el, { opacity: 0, scale: .4, rotate: mezi(-40, 40) });
      const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(mezi(.4, 3), () => letet(el)) });
      const doba = mezi(3.2, 5.2);
      tl.to(el, { opacity: .9, scale: 1, duration: .5, ease: "power2.out" })
        .to(el, { y: -mezi(70, 180), duration: doba * .45, ease: "power2.out" }, 0)
        .to(el, { y: 0, duration: doba * .55, ease: "power2.in" }, doba * .45)
        .to(el, { x: mezi(-80, 80), duration: doba, ease: "sine.inOut" }, 0)
        .to(el, { rotate: `+=${mezi(-200, 200)}`, duration: doba, ease: "none" }, 0)
        .to(el, { opacity: 0, scale: .5, duration: .6, ease: "power2.in" }, doba - .6);
      el._tl = tl;
    };
    prvky.forEach((el, i) => gsap.delayedCall(i * .28, () => letet(el)));
    document.addEventListener("visibilitychange", () => {
      prvky.forEach(el => el._tl && (document.hidden ? el._tl.pause() : el._tl.resume()));
    });
  }

  /* ---- lesk na kartách podle myši ---- */
  document.querySelectorAll("[data-glare]").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
      card.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
      card.style.setProperty("--go", ".7");
    });
    card.addEventListener("pointerleave", () => card.style.setProperty("--go", "0"));
  });

  /* ---- magnetická tlačítka ---- */
  if (!lessMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(btn => {
      const posun = gsap.quickTo(btn, "x", { duration: .4, ease: "power3" });
      const posunY = gsap.quickTo(btn, "y", { duration: .4, ease: "power3" });
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        posun((e.clientX - r.left - r.width / 2) * .25);
        posunY((e.clientY - r.top - r.height / 2) * .35);
      });
      btn.addEventListener("pointerleave", () => { posun(0); posunY(0); });
    });
  }

  /* ---- cesta k domku ---- */
  const stage = document.getElementById("journeyStage");
  const draha = document.getElementById("routePath");
  const kornout = document.getElementById("travelCone");
  const zastavky = gsap.utils.toArray(".stop");

  if (stage && draha && kornout) {
    const delka = draha.getTotalLength();
    const nakreslena = document.getElementById("routeDrawn");
    gsap.set(nakreslena, { strokeDasharray: delka, strokeDashoffset: delka });

    const posadit = () => {
      const mapa = stage.querySelector(".journey__map").getBoundingClientRect();
      const mer = Math.min(mapa.width / 1200, mapa.height / 640);
      const posunX = (mapa.width - 1200 * mer) / 2, posunY = (mapa.height - 640 * mer) / 2;
      zastavky.forEach(z => {
        const bod = draha.getPointAtLength(delka * parseFloat(z.dataset.t));
        z.style.left = (posunX + bod.x * mer) + "px";
        z.style.top = (posunY + bod.y * mer) + "px";
      });
    };

    const mm = gsap.matchMedia();

    mm.add("(min-width: 981px)", () => {
      stage.classList.add("is-map");
      posadit();
      addEventListener("resize", posadit);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage, start: "center center", end: "+=" + Math.round(innerHeight * 1.5),
          scrub: .8, pin: !lessMotion, anticipatePin: 1,
          onUpdate: self => zastavky.forEach(z => z.classList.toggle("is-on", self.progress >= parseFloat(z.dataset.t) - .04)),
        },
      });
      tl.to(nakreslena, { strokeDashoffset: 0, ease: "none" }, 0)
        .to(kornout, { motionPath: { path: draha, align: draha, alignOrigin: [.5, .9], autoRotate: false }, ease: "none" }, 0);

      return () => {
        removeEventListener("resize", posadit);
        stage.classList.remove("is-map");
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
    gsap.utils.toArray(".gallery figure").forEach(f => {
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

  /* ---- nálepky: plácnutí při příchodu + odlepování rohu se scrollem ---- */
  const nalepky = gsap.utils.toArray(".sticker");
  if (nalepky.length && !lessMotion) {
    nalepky.forEach(n => {
      const rot = getComputedStyle(n).getPropertyValue("--rot").trim() || "0deg";
      gsap.from(n, {
        scale: .5, opacity: 0, rotate: parseFloat(rot) - 14, duration: .6, ease: "back.out(2.4)",
        scrollTrigger: { trigger: n.parentElement, start: "top 88%", once: true },
      });
      ST.create({
        trigger: n.parentElement, start: "top 85%", end: "bottom 35%", scrub: .6,
        onUpdate: self => n.style.setProperty("--peel", (Math.sin(self.progress * Math.PI) * .9).toFixed(3)),
      });
    });
  }

  /* ---- skákající ovoce nad patičkou ---- */
  const sad = document.getElementById("fruitfield");
  if (sad && !lessMotion) {
    const OVOCE = {
      malina: '<svg viewBox="0 0 48 48"><g fill="#D6336C"><circle cx="24" cy="20" r="6"/><circle cx="17" cy="26" r="6"/><circle cx="31" cy="26" r="6"/><circle cx="24" cy="32" r="6"/></g><path d="M24 14c-3-4-8-4-10-2 3 1 5 3 6 6z" fill="#5C9E4A"/></svg>',
      jahoda: '<svg viewBox="0 0 48 48"><path d="M24 12c9 0 14 6 14 13s-7 13-14 13-14-6-14-13 5-13 14-13z" fill="#E63946"/><g fill="#fff"><circle cx="19" cy="22" r="1.4"/><circle cx="28" cy="21" r="1.4"/><circle cx="24" cy="28" r="1.4"/><circle cx="31" cy="28" r="1.4"/><circle cx="17" cy="30" r="1.4"/></g><path d="M24 12c-4-3-9-3-11 0 3 0 6 1 8 3 2-2 5-3 8-3-2-2-4-2-5 0z" fill="#5C9E4A"/></svg>',
      mango: '<svg viewBox="0 0 48 48"><path d="M32 12c7 2 9 12 4 20s-16 10-20 4 0-18 8-22c3-1.5 6-2.5 8-2z" fill="#F2A03D"/><path d="M33 14c4 4 4 13-1 19" stroke="#E2732C" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M31 11c1-3 4-4 6-3-1 2-2 3-4 4z" fill="#5C9E4A"/></svg>',
      citron: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="15" ry="11" fill="#F6D33C" transform="rotate(-18 24 24)"/><path d="M38 17c2-1 3 0 3 1s-2 2-3 1z" fill="#E9B824"/><path d="M10 31c-2 1-3 0-3-1s2-2 3-1z" fill="#E9B824"/></svg>',
      boruvka: '<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="12" fill="#4C5BAF"/><path d="M24 14l4 4-4 3-4-3z" fill="#2F3C86"/><circle cx="20" cy="22" r="2.4" fill="#7B87CC" opacity=".8"/></svg>',
      visne: '<svg viewBox="0 0 48 48"><path d="M24 8c-4 6-10 8-12 12" stroke="#5C9E4A" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M24 8c3 7 8 9 11 12" stroke="#5C9E4A" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="12" cy="32" r="8" fill="#B8263C"/><circle cx="35" cy="32" r="8" fill="#D6334F"/></svg>',
      skorice: '<svg viewBox="0 0 48 48"><rect x="8" y="18" width="32" height="12" rx="6" fill="#A2652F"/><rect x="8" y="18" width="32" height="12" rx="6" fill="none" stroke="#7E4A1E" stroke-width="2"/><path d="M14 18v12M20 18v12M26 18v12M32 18v12" stroke="#7E4A1E" stroke-width="1.4" opacity=".7"/></svg>',
      pistacie: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="12" ry="9" fill="#C9AE7B" transform="rotate(-14 24 24)"/><path d="M14 22c6-3 14-3 20 0" stroke="#A88D5C" stroke-width="2" fill="none"/><ellipse cx="24" cy="25" rx="6" ry="4" fill="#8FBF58" transform="rotate(-14 24 25)"/></svg>',
    };
    const jmena = Object.keys(OVOCE);
    const kusy = [];
    const sirka = () => sad.clientWidth;

    jmena.forEach((jm, i) => {
      const el = document.createElement("span");
      el.className = "fruit";
      el.innerHTML = OVOCE[jm];
      sad.appendChild(el);
      kusy.push(el);
    });

    const mezi = (a, b) => a + Math.random() * (b - a);

    const skok = el => {
      const x = mezi(2, 92);
      const vyska = mezi(50, 130);
      const doba = mezi(.55, .85);
      gsap.set(el, { left: x + "%", x: 0, y: 0, rotate: mezi(-25, 25), scale: 1, opacity: 1, transformOrigin: "50% 100%" });
      const tl = gsap.timeline({
        onComplete: () => gsap.delayedCall(mezi(.1, 1.4), () => skok(el)),
      });
      // tři odrazy s postupně nižším skokem, mezi nimi žuchnutí (squash)
      let h = vyska;
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
    void sirka;
  }


  /* ---- Vyber si příchuť: bubliny v oblouku + rozlití barvy ---- */
  const sekceP = document.getElementById("prichute");
  const bubliny = sekceP && [...sekceP.querySelectorAll(".bubbles li")];
  if (sekceP && bubliny && bubliny.length) {
    const flood = document.getElementById("flood");
    const jmeno = document.getElementById("flavorName");
    const druh = document.getElementById("flavorKind");
    const popis = document.getElementById("flavorNote");
    const fotka = document.getElementById("flavorImg");
    const kruh = sekceP.querySelector(".bubbles");

    // rozmístění po oblouku (vlevo nahoru → dolů, jako ve figmě)
    const rozmisti = () => {
      const R = kruh.clientWidth / 2 - 6;
      bubliny.forEach((li, i) => {
        const uhel = (-108 + i * 43) * Math.PI / 180;   // oblouk na pravé straně kruhu
        li.style.transform = `translate(${(Math.cos(uhel) * R).toFixed(1)}px, ${(Math.sin(uhel) * R).toFixed(1)}px)`;
      });
    };
    rozmisti();
    addEventListener("resize", rozmisti);

    let aktivni = null;
    const vyber = (li, hned) => {
      if (li === aktivni) return;
      const b = li.querySelector("button");
      const barva = b.dataset.c;
      bubliny.forEach(x => x.classList.toggle("is-on", x === li));
      aktivni = li;

      jmeno.textContent = b.dataset.name;
      druh.textContent = b.dataset.kind;
      popis.textContent = b.dataset.note;

      // velká fotka příchuti se prohodí s malým přetočením
      if (fotka && b.dataset.img) {
        if (lessMotion || hned) {
          fotka.src = b.dataset.img;
          fotka.alt = b.dataset.name;
        } else {
          gsap.to(fotka, {
            scale: .82, opacity: 0, rotate: -8, duration: .22, ease: "power2.in",
            onComplete: () => {
              fotka.src = b.dataset.img;
              fotka.alt = b.dataset.name;
              gsap.fromTo(fotka, { scale: .82, opacity: 0, rotate: 10 },
                { scale: 1, opacity: 1, rotate: 0, duration: .5, ease: "back.out(1.7)" });
            },
          });
        }
      }

      if (lessMotion || hned) {
        sekceP.style.setProperty("--flavor", barva);
        return;
      }
      // kruh vyjede z bubliny a přelije celou sekci
      const rs = sekceP.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x = rb.left + rb.width / 2 - rs.left, y = rb.top + rb.height / 2 - rs.top;
      const dosah = Math.max(
        Math.hypot(x, y), Math.hypot(rs.width - x, y),
        Math.hypot(x, rs.height - y), Math.hypot(rs.width - x, rs.height - y)
      );
      gsap.set(flood, { backgroundColor: barva, left: x - 5, top: y - 5, scale: 0, opacity: 1 });
      gsap.to(flood, {
        scale: dosah / 5 + 2, duration: .85, ease: "power3.inOut",
        onComplete: () => { sekceP.style.setProperty("--flavor", barva); gsap.set(flood, { scale: 0, opacity: 0 }); },
      });
      gsap.fromTo([jmeno, popis, druh], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .05, ease: "power2.out", overwrite: true });
    };

    bubliny.forEach(li => {
      const b = li.querySelector("button");
      b.addEventListener("click", () => vyber(li));
      if (matchMedia("(hover: hover)").matches) b.addEventListener("pointerenter", () => vyber(li));
      b.addEventListener("focus", () => vyber(li));
    });
    vyber(bubliny[0], true);

    // bubliny se při příjezdu sekce vysypou po oblouku
    // (měřítko jede přes proměnnou --in, aby zůstal funkční hover i zvýraznění výběru;
    //  immediateRender: false = když se animace nespustí, bubliny prostě zůstanou vidět)
    if (!lessMotion) gsap.fromTo(bubliny.map(li => li.querySelector("button")),
      { "--in": 0, opacity: 0 },
      {
        "--in": 1, opacity: 1, duration: .6, ease: "back.out(2)", stagger: .07, immediateRender: false,
        scrollTrigger: { trigger: sekceP, start: "top 78%", once: true },
      });
  }

  // pojistka po otočení telefonu / změně velikosti okna
  let prepocet;
  ["resize", "orientationchange"].forEach(ev => addEventListener(ev, () => {
    clearTimeout(prepocet);
    prepocet = setTimeout(() => ST.refresh(), 200);
  }));

  ST.refresh();
})();
