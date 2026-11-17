(() => {
  const churchName = "Christ Ambassadors Fellowship International";
  const facebookUrl = "https://www.facebook.com/profile.php?id=61567079602481";
  const whatsappUrl = "https://wa.me/2348164466980";
  const phoneUrl = "tel:+2348164466980";
  const address =
    "No 1, Christ Ambassadors, Atoyo Egbe, Sabo, Sagamu, Ogun State, Nigeria.";
  const directionsUrl =
    "https://www.google.com/maps/search/?api=1&query=No+1%2C+Christ+Ambassadors%2C+Atoyo+Egbe%2C+Sabo%2C+Sagamu%2C+Ogun+State%2C+Nigeria";
  const year = new Date().getFullYear();

  function ensureMetaTag(attributes) {
    const selector = attributes.name
      ? `meta[name="${attributes.name}"]`
      : `meta[property="${attributes.property}"]`;
    const existing = document.head.querySelector(selector);
    if (existing) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === "name" || key === "property") return;
        existing.setAttribute(key, value);
      });
      return existing;
    }

    const element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    document.head.appendChild(element);
    return element;
  }

  function ensureLinkTag(attributes) {
    const selector = `link[rel="${attributes.rel}"]`;
    const existing = document.head.querySelector(selector);
    if (existing) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === "rel") return;
        existing.setAttribute(key, String(value));
      });
      return existing;
    }

    const element = document.createElement("link");
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    document.head.appendChild(element);
    return element;
  }

  function ensureSiteMetadata() {
    ensureMetaTag({ name: "description", content: "Christ Ambassadors Fellowship International in Sagamu, Ogun State, sharing worship, sermons, events, and community updates." });
    ensureMetaTag({ name: "theme-color", content: "#1D3F91" });
    ensureMetaTag({ name: "msapplication-TileColor", content: "#1D3F91" });
    ensureMetaTag({ name: "apple-mobile-web-app-capable", content: "yes" });
    ensureMetaTag({ name: "apple-mobile-web-app-status-bar-style", content: "black" });
    ensureMetaTag({ name: "apple-mobile-web-app-title", content: churchName });
    ensureMetaTag({ property: "og:title", content: `${churchName}` });
    ensureMetaTag({ property: "og:description", content: "Total Liberty & Transformation of lives through the Reconciliation Message." });
    ensureMetaTag({ property: "og:type", content: "website" });
    ensureMetaTag({ property: "og:image", content: "/images/logo.png" });
    ensureMetaTag({ property: "og:site_name", content: churchName });
    ensureLinkTag({ rel: "icon", href: "/favicon.png" });
    ensureLinkTag({ rel: "manifest", href: "/manifest.json" });
    ensureLinkTag({ rel: "apple-touch-icon", href: "/images/icons/icon-192.png" });
  }

  function renderHeaderFooter() {
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <header class="site-header">
          <div class="site-header-inner">
            <a class="brand" href="index.html" aria-label="${churchName} home">
              <img class="brand-logo" src="/images/logo.png" width="48" height="48" alt="" loading="eager" decoding="async">
              <span class="brand-name">${churchName}</span>
            </a>
            <div class="header-actions">
              <button class="header-install-button" id="site-install-button" type="button" hidden>Install app</button>
              <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="primary-navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
            <nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
              <a href="index.html">Home</a>
              <a href="sermons.html">Sermons</a>
              <a href="videos.html">Videos</a>
              <a href="events.html">Events</a>
              <a href="blog.html">Blog</a>
              <a href="gallery.html">Gallery</a>
              <a href="about.html">About</a>
              <a href="contact.html#connect-options">Connect</a>
            </nav>
          </div>
        </header>
      `;
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML = `
        <footer class="site-footer">
          <div class="footer-inner">
            <section aria-label="Church mission">
              <a class="footer-brand" href="index.html">
                <img class="footer-logo" src="/images/logo.png" width="48" height="48" alt="" loading="lazy" decoding="async">
                <span>${churchName}</span>
              </a>
              <p class="footer-mission">Total Liberty &amp; Transformation of lives through the Reconciliation Message.</p>
            </section>
            <section>
              <h2 class="footer-heading">Visit us</h2>
              <p class="footer-address">${address}</p>
              <p><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Get Directions</a></p>
            </section>
            <section>
              <h2 class="footer-heading">Service times</h2>
              <ul class="footer-service-list">
                <li>Bible Study — Tuesday, 5:30pm–7:00pm</li>
                <li>Prayer Meeting — Thursday, 5:30pm–7:00pm</li>
                <li>Sunday School — Sunday, 9:00am–10:00am</li>
                <li>Sunday Service — Sunday, 10:00am–12:00pm</li>
              </ul>
            </section>
            <section>
              <h2 class="footer-heading">Connect with us</h2>
              <p class="footer-connect-link"><a href="contact.html#connect-options">Prayer, testimony, or a message? Connect with us.</a></p>
              <div class="footer-social-links">
                <a class="footer-social-link" href="${facebookUrl}" target="_blank" rel="noopener noreferrer" aria-label="Visit us on Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z"></path></svg>
                  <span>Facebook</span>
                </a>
                <a class="footer-social-link" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Message us on WhatsApp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.5-4.9a8.4 8.4 0 1 1 16-3.9Z"></path><path d="M8.2 7.9c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .5l-.5.7c-.2.2-.2.4 0 .6.6 1 1.5 1.8 2.6 2.3.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .3-.2 1.2-.8 1.7-.5.5-1.2.7-2 .5-1.1-.2-2.4-.9-3.7-2-1.6-1.4-2.6-3.1-2.8-4.2-.2-.9.2-1.5.8-1.8Z"></path></svg>
                  <span>WhatsApp</span>
                </a>
                <a class="footer-social-link" data-whatsapp-group="main" href="#" aria-label="Join our WhatsApp group" hidden>
                  <span>Join our WhatsApp group</span>
                </a>
                <a class="footer-social-link" data-whatsapp-group="youth" href="#" aria-label="Join the Youth WhatsApp group" hidden>
                  <span>Join the Youth WhatsApp group</span>
                </a>
                <a class="footer-social-link" href="${phoneUrl}" aria-label="Call the church">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3H4.8A1.8 1.8 0 0 0 3 4.8C3 13.7 10.3 21 19.2 21a1.8 1.8 0 0 0 1.8-1.8V17l-5-1.5-1.4 2.1a15.4 15.4 0 0 1-6.2-6.2L10.5 10 9 5H7Z"></path></svg>
                  <span>Call</span>
                </a>
              </div>
            </section>
          </div>
          <div class="footer-bottom"><p>&copy; ${year} ${churchName}. All rights reserved.</p></div>
        </footer>
      `;
    }
  }

  function showRefreshPrompt() {
    const existing = document.getElementById("sw-refresh-prompt");
    if (existing) return;

    const notice = document.createElement("div");
    notice.id = "sw-refresh-prompt";
    notice.innerHTML = `
      <div class="sw-refresh-inner">
        <span>New version available, tap to refresh</span>
        <button type="button" aria-label="Refresh the page">Refresh</button>
      </div>
    `;
    notice.querySelector("button")?.addEventListener("click", () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    });
    document.body.appendChild(notice);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => {
          const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
          return scriptUrl.includes("/service-worker.js");
        })
        .forEach((registration) => registration.unregister());

      return navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }).then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showRefreshPrompt();
          }
        });
      });
    }).catch(() => {});

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_UPDATE") {
        showRefreshPrompt();
      }
    });
  }

  function configureInstallPrompt() {
    const installButton = document.getElementById("site-install-button");
    if (!installButton) return;

    let deferredPrompt = null;

    const showButton = () => {
      installButton.hidden = false;
      installButton.setAttribute("aria-label", "Install this app");
    };

    const hideButton = () => {
      installButton.hidden = true;
      deferredPrompt = null;
    };

    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      hideButton();
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      showButton();
    });

    window.addEventListener("appinstalled", hideButton);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      hideButton();
    }
  }

  function configureAnnouncements() {
    document.querySelectorAll("[data-dismiss-announcement]").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest(".announcement-banner")?.remove();
      });
    });
  }

  function configureNavigation() {
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.getElementById("primary-navigation");
    if (menuButton && navigation) {
      const closeMenu = () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation menu");
        navigation.classList.remove("is-open");
      };

      menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
        navigation.classList.toggle("is-open", !isOpen);
      });

      navigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });

      const currentPage = window.location.pathname.split("/").pop() || "index.html";
      navigation.querySelectorAll("a").forEach((link) => {
        if (link.getAttribute("href") === currentPage) {
          link.setAttribute("aria-current", "page");
        }
      });
    }
  }

  function configureScrollReveal() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const revealSelector =
      ".filters, .service, .about-us, #media, .sermon-card, .video-card, .event-card, .post-card, .gallery-item, .service-row, .home-section, .announcement-banner, .page-intro, .about-mission-card, .content-card, .contact-details-card, .connect-option-card";
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    const observeRevealElements = (root) => {
      if (root instanceof Element && root.matches(revealSelector)) {
        root.classList.add("reveal-on-scroll");
        observer.observe(root);
      }

      if (root.querySelectorAll) {
        root.querySelectorAll(revealSelector).forEach((element) => {
          element.classList.add("reveal-on-scroll");
          observer.observe(element);
        });
      }
    };

    observeRevealElements(document);
    const contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(observeRevealElements);
      });
    });
    contentObserver.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    ensureSiteMetadata();
    renderHeaderFooter();
    configureAnnouncements();
    configureNavigation();
    configureInstallPrompt();
    registerServiceWorker();
    configureScrollReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
