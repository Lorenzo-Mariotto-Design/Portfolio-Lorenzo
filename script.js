(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* Footer year */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* London clock */
  const clock = $("#london-time");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
    });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
  }

  /* Header border on scroll */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile menu */
  const toggle = $(".menu-toggle");
  const links = $("#nav-links");
  if (toggle && links) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      links.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* Scroll reveal */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* Client logo marquee: duplicate the row so the loop is seamless.
     Shows the brand name as text until a logo file exists in images/clients/ */
  const marquee = $(".marquee");
  const logoGroup = marquee && $(".logo-group", marquee);
  if (logoGroup) {
    const copy = logoGroup.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    $$("img", copy).forEach((img) => { img.alt = ""; });
    marquee.appendChild(copy);
  }
  $$(".logo img").forEach((img) => {
    const li = img.closest(".logo");
    const markLoaded = () => li?.classList.add("has-img");
    if (img.complete && img.naturalWidth > 0) markLoaded();
    img.addEventListener("load", markLoaded);
  });

  /* Missing images -> styled placeholder */
  $$(".media img").forEach((img) => {
    const markEmpty = () => img.closest(".media")?.classList.add("is-empty");
    if (img.complete && img.naturalWidth === 0) markEmpty();
    img.addEventListener("error", markEmpty);
  });

  /* Lightbox */
  const lightbox = $("#lightbox");
  if (lightbox) {
    const lbImg = $("img", lightbox);
    const closeBtn = $(".lightbox-close", lightbox);
    let lastFocus = null;

    const open = (src, alt) => {
      lastFocus = document.activeElement;
      lbImg.src = src;
      lbImg.alt = alt || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    const close = () => {
      lightbox.hidden = true;
      lbImg.removeAttribute("src");
      document.body.style.overflow = "";
      lastFocus?.focus();
    };

    $$(".gallery-item").forEach((item) => {
      const img = $("img", item);
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "View larger: " + (img?.alt || "image"));
      const trigger = () => {
        if (!item.classList.contains("is-empty") && img) open(img.currentSrc || img.src, img.alt);
      };
      item.addEventListener("click", trigger);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); }
      });
    });

    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) close();
    });
  }

  /* Copy email */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Email copied");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); showToast("Email copied"); }
        catch { showToast("Press Ctrl+C to copy"); }
        ta.remove();
      }
    });
  });
})();
