const PHASE4_PAGE_SIZE = 12;
const DEFAULT_DAILY_VERSE = {
  reference: "Psalm 23:1",
  text: "The Lord is my shepherd; I shall not want.",
};

document.addEventListener("DOMContentLoaded", () => {
  if (!window.supabaseClient) {
    showPhase4Fallbacks();
    return;
  }

  loadDailyVerse();
  loadPinnedAnnouncement();
  loadHomeEvents();
  loadEventsPage();
  loadBlogPage();
  loadPostPage();
  loadGalleryPage();
});

function showPhase4Fallbacks() {
  replaceWithMessage(
    document.getElementById("home-upcoming-events"),
    "No upcoming events yet.",
  );
  replaceWithMessage(
    document.getElementById("events-list"),
    "Events are temporarily unavailable. Please try again later.",
  );
  replaceWithMessage(
    document.getElementById("weekly-services-list"),
    "Service times are temporarily unavailable. Please try again later.",
  );
  replaceWithMessage(
    document.getElementById("blog-list"),
    "Articles are temporarily unavailable. Please try again later.",
  );
  replaceWithMessage(
    document.getElementById("post-content"),
    "This article is temporarily unavailable. Please try again later.",
  );
  replaceWithMessage(
    document.getElementById("gallery-list"),
    "The gallery is temporarily unavailable. Please try again later.",
  );
  renderDailyVerse(DEFAULT_DAILY_VERSE);
}

async function loadDailyVerse() {
  const verseText = document.querySelector(".verse-text");
  const verseReference = document.querySelector(".verse-reference");
  if (!verseText || !verseReference) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("verses")
      .select("reference, text")
      .order("reference", { ascending: true })
      .limit(365);
    if (error) throw error;

    if (!data?.length) {
      renderDailyVerse(DEFAULT_DAILY_VERSE);
      return;
    }

    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDayUtc = Date.UTC(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((todayUtc - firstDayUtc) / 86400000);
    renderDailyVerse(data[dayOfYear % data.length]);
  } catch (error) {
    console.error("Could not load the daily Bible verse:", error);
    renderDailyVerse(DEFAULT_DAILY_VERSE);
  }
}

function renderDailyVerse(verse) {
  const verseText = document.querySelector(".verse-text");
  const verseReference = document.querySelector(".verse-reference");
  if (verseText) verseText.textContent = verse.text || DEFAULT_DAILY_VERSE.text;
  if (verseReference) {
    verseReference.textContent = verse.reference || DEFAULT_DAILY_VERSE.reference;
  }
}

async function loadPinnedAnnouncement() {
  const banner = document.getElementById("home-announcement");
  if (!banner) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("announcements")
      .select("id, title, body, is_pinned, expires_at, created_at")
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    const now = Date.now();
    const announcement = (data || []).find((item) => {
      if (!item.is_pinned || !item.id) return false;
      if (item.expires_at) {
        const expiration = new Date(item.expires_at).getTime();
        if (Number.isNaN(expiration) || expiration <= now) return false;
      }
      return !wasAnnouncementDismissed(item.id);
    });
    if (!announcement) {
      banner.hidden = true;
      return;
    }

    const content = document.createElement("div");
    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = announcement.title || "Church notice";
    const body = document.createElement("p");
    body.className = "announcement-text";
    body.textContent = announcement.body || "";
    content.append(label, body);

    const dismiss = document.createElement("button");
    dismiss.className = "announcement-dismiss";
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Dismiss announcement");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => {
      rememberAnnouncementDismissed(announcement.id);
      banner.hidden = true;
    });

    banner.replaceChildren(content, dismiss);
    banner.hidden = false;
  } catch (error) {
    console.error("Could not load pinned announcements:", error);
    banner.hidden = true;
  }
}

function wasAnnouncementDismissed(id) {
  try {
    return window.sessionStorage.getItem(`dismissed-announcement-${id}`) === "true";
  } catch (error) {
    console.warn("Announcement dismissal could not be saved for this session.", error);
    return false;
  }
}

function rememberAnnouncementDismissed(id) {
  try {
    window.sessionStorage.setItem(`dismissed-announcement-${id}`, "true");
  } catch (error) {
    console.warn("Announcement dismissal could not be saved for this session.", error);
  }
}

async function loadHomeEvents() {
  const list = document.getElementById("home-upcoming-events");
  if (!list) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("events")
      .select("id, title, description, event_date, end_at, location, is_recurring, recurrence_note")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(3);
    if (error) throw error;

    list.replaceChildren();
    if (!data?.length) {
      replaceWithMessage(list, "No upcoming events yet.");
      return;
    }
    data.forEach((event) => list.append(createEventCard(event, true)));
  } catch (error) {
    console.error("Could not load upcoming events for the home page:", error);
    replaceWithMessage(list, "Upcoming events are temporarily unavailable.");
  }
}

async function loadEventsPage() {
  const list = document.getElementById("events-list");
  const services = document.getElementById("weekly-services-list");
  if (!list && !services) return;

  if (list) {
    let page = 0;
    let loading = false;
    let total = 0;
    const loadMore = document.getElementById("load-more-events");
    const loadEvents = async (append = false) => {
      if (loading) return;
      loading = true;
      const from = page * PHASE4_PAGE_SIZE;
      try {
        const { data, error, count } = await window.supabaseClient
          .from("events")
          .select("id, title, description, event_date, end_at, location, is_recurring, recurrence_note, image_url", { count: "exact" })
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .range(from, from + PHASE4_PAGE_SIZE - 1);
        if (error) throw error;

        total = count ?? from + (data?.length || 0);
        if (!append) list.replaceChildren();
        (data || []).forEach((event) => list.append(createEventCard(event)));
        if (!data?.length && page === 0) {
          replaceWithMessage(list, "No upcoming events yet.");
        }
        if (loadMore) {
          loadMore.classList.toggle(
            "hidden",
            !data?.length || from + data.length >= total,
          );
        }
      } catch (error) {
        console.error("Could not load events:", error);
        if (append) page = Math.max(0, page - 1);
        else replaceWithMessage(list, "Events are temporarily unavailable. Please try again later.");
      } finally {
        loading = false;
      }
    };

    loadMore?.addEventListener("click", () => {
      if (loading) return;
      page += 1;
      loadEvents(true);
    });
    await loadEvents();
  }

  if (services) {
    try {
      const { data, error } = await window.supabaseClient
        .from("services")
        .select("name, weekday, start_time, end_time, sort_order")
        .order("sort_order", { ascending: true })
        .order("weekday", { ascending: true });
      if (error) throw error;

      services.replaceChildren();
      if (!data?.length) {
        replaceWithMessage(services, "Regular weekly service times are not available yet.");
      } else {
        data.forEach((service) => services.append(createServiceRow(service)));
      }
    } catch (error) {
      console.error("Could not load weekly service times:", error);
      replaceWithMessage(
        services,
        "Service times are temporarily unavailable. Please try again later.",
      );
    }
  }
}

function createEventCard(event, compact = false) {
  const card = document.createElement("article");
  card.className = compact ? "event-card event-card-compact" : "event-card";

  if (!compact && safePhase4Image(event.image_url)) {
    const image = document.createElement("img");
    image.src = safePhase4Image(event.image_url);
    image.alt = event.title ? `Photo for ${event.title}` : "Church event";
    image.width = 640;
    image.height = 360;
    image.loading = "lazy";
    image.decoding = "async";
    card.append(image);
  }

  const content = document.createElement("div");
  content.className = "event-card-content";
  const title = document.createElement("h3");
  title.textContent = event.title || "Church event";
  content.append(title);

  const date = document.createElement("p");
  date.className = "event-date";
  date.textContent = formatEventDate(event.event_date, event.end_at);
  content.append(date);

  if (event.location) {
    const location = document.createElement("p");
    location.className = "event-location";
    location.textContent = event.location;
    content.append(location);
  }
  if (event.description) {
    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.description;
    content.append(description);
  }
  if (event.is_recurring && event.recurrence_note) {
    const recurrence = document.createElement("p");
    recurrence.className = "event-recurrence";
    recurrence.textContent = event.recurrence_note;
    content.append(recurrence);
  }

  const actions = document.createElement("div");
  actions.className = "event-actions";
  const calendarData = getCalendarTimes(event);
  if (calendarData) {
    const icsButton = document.createElement("button");
    icsButton.className = "button button-secondary";
    icsButton.type = "button";
    icsButton.textContent = "Download .ics";
    icsButton.addEventListener("click", () => downloadIcs(event, calendarData));
    const googleLink = document.createElement("a");
    googleLink.className = "button button-secondary";
    googleLink.href = createGoogleCalendarUrl(event, calendarData);
    googleLink.target = "_blank";
    googleLink.rel = "noopener noreferrer";
    googleLink.textContent = "Google Calendar";
    actions.append(icsButton, googleLink);
  }
  content.append(actions);
  card.append(content);
  return card;
}

function getCalendarTimes(event) {
  const start = new Date(event.event_date);
  if (Number.isNaN(start.getTime())) return null;
  let end = event.end_at ? new Date(event.end_at) : null;
  if (!end || Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  return { start, end };
}

function downloadIcs(event, { start, end }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Christ Ambassadors Fellowship International//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.id || `${start.getTime()}@cafinternational`)}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title || "Church event")}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  const file = new Blob([lines.join("\r\n") + "\r\n"], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  const download = document.createElement("a");
  download.href = url;
  download.download = `${slugify(event.title || "church-event")}.ics`;
  document.body.append(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createGoogleCalendarUrl(event, { start, end }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Church event",
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "church-event";
}

function createServiceRow(service) {
  const row = document.createElement("article");
  row.className = "service-row";
  const name = document.createElement("h3");
  name.textContent = service.name || "Church service";
  const weekday = document.createElement("p");
  weekday.className = "service-row-weekday";
  weekday.textContent = service.weekday || "Day to be confirmed";
  const time = document.createElement("p");
  time.className = "service-row-time";
  time.textContent = `${formatServiceTime(service.start_time)}–${formatServiceTime(service.end_time)}`;
  row.append(name, weekday, time);
  return row;
}

function formatServiceTime(value) {
  if (!value) return "Time to be confirmed";
  const [hours, minutes = "00"] = value.split(":");
  const parsedHours = Number(hours);
  if (!Number.isInteger(parsedHours) || parsedHours < 0 || parsedHours > 23) {
    return value;
  }
  const suffix = parsedHours >= 12 ? "pm" : "am";
  const displayHour = parsedHours % 12 || 12;
  return `${displayHour}:${minutes.slice(0, 2)}${suffix}`;
}

async function loadBlogPage() {
  const list = document.getElementById("blog-list");
  if (!list) return;

  let page = 0;
  let total = 0;
  let loading = false;
  const loadMore = document.getElementById("load-more-posts");
  const loadPosts = async (append = false) => {
    if (loading) return;
    loading = true;
    const from = page * PHASE4_PAGE_SIZE;
    try {
      const { data, error, count } = await window.supabaseClient
        .from("posts")
        .select("id, title, slug, excerpt, cover_url, published_at", { count: "exact" })
        .eq("published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(from, from + PHASE4_PAGE_SIZE - 1);
      if (error) throw error;

      total = count ?? from + (data?.length || 0);
      if (!append) list.replaceChildren();
      (data || []).forEach((post) => list.append(createPostCard(post)));
      if (!data?.length && page === 0) {
        replaceWithMessage(list, "No articles have been published yet.");
      }
      if (loadMore) {
        loadMore.classList.toggle(
          "hidden",
          !data?.length || from + data.length >= total,
        );
      }
    } catch (error) {
      console.error("Could not load published articles:", error);
      if (append) page = Math.max(0, page - 1);
      if (!append) replaceWithMessage(list, "Articles are temporarily unavailable. Please try again later.");
    } finally {
      loading = false;
    }
  };

  loadMore?.addEventListener("click", () => {
    if (loading) return;
    page += 1;
    loadPosts(true);
  });
  await loadPosts();
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";
  const coverUrl = safePhase4Image(post.cover_url);
  if (coverUrl) {
    const image = document.createElement("img");
    image.src = coverUrl;
    image.alt = post.title ? `Cover image for ${post.title}` : "Church blog cover";
    image.width = 640;
    image.height = 360;
    image.loading = "lazy";
    image.decoding = "async";
    card.append(image);
  }

  const content = document.createElement("div");
  content.className = "post-card-content";
  const heading = document.createElement("h2");
  const link = document.createElement("a");
  link.href = `post.html?slug=${encodeURIComponent(post.slug || "")}`;
  link.textContent = post.title || "Church article";
  heading.append(link);
  content.append(heading);

  if (post.published_at) {
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = formatPhase4Date(post.published_at);
    content.append(date);
  }
  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.className = "post-excerpt";
    excerpt.textContent = post.excerpt;
    content.append(excerpt);
  }
  card.append(content);
  return card;
}

async function loadPostPage() {
  const article = document.getElementById("post-content");
  if (!article) return;
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    replaceWithMessage(article, "Choose an article from the blog to read it.");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("posts")
      .select("title, slug, body, cover_url, published_at")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      replaceWithMessage(article, "This article could not be found.");
      return;
    }

    article.replaceChildren();
    const backLink = document.createElement("a");
    backLink.className = "text-link post-back-link";
    backLink.href = "blog.html";
    backLink.textContent = "← Back to all articles";
    article.append(backLink);
    const heading = document.createElement("h1");
    heading.textContent = data.title || "Church article";
    article.append(heading);
    if (data.published_at) {
      const date = document.createElement("p");
      date.className = "post-date";
      date.textContent = formatPhase4Date(data.published_at);
      article.append(date);
    }
    const coverUrl = safePhase4Image(data.cover_url);
    if (coverUrl) {
      const image = document.createElement("img");
      image.className = "post-cover";
      image.src = coverUrl;
      image.alt = data.title ? `Cover image for ${data.title}` : "Church blog cover";
      image.width = 1200;
      image.height = 675;
      image.fetchPriority = "low";
      article.append(image);
    }
    const body = document.createElement("div");
    body.className = "post-body";
    String(data.body || "")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        body.append(paragraph);
      });
    article.append(body);
    document.title = `${data.title || "Church article"} | Christ Ambassadors Fellowship International`;
  } catch (error) {
    console.error("Could not load published article:", error);
    replaceWithMessage(article, "This article is temporarily unavailable. Please try again later.");
  }
}

async function loadGalleryPage() {
  const list = document.getElementById("gallery-list");
  if (!list) return;

  let page = 0;
  let total = 0;
  let loading = false;
  const albumFilter = document.getElementById("album-filter");
  const loadMore = document.getElementById("load-more-gallery");
  const loadAlbums = async () => {
    if (!albumFilter) return;
    try {
      const { data, error } = await window.supabaseClient
        .from("gallery")
        .select("album")
        .not("album", "is", null)
        .order("album", { ascending: true })
        .limit(1000);
      if (error) throw error;
      const albums = [...new Set((data || []).map((item) => item.album?.trim()).filter(Boolean))];
      albums.forEach((album) => {
        const option = document.createElement("option");
        option.value = album;
        option.textContent = album;
        albumFilter.append(option);
      });
    } catch (error) {
      console.error("Could not load gallery albums:", error);
    }
  };

  const loadPhotos = async (append = false) => {
    if (loading) return;
    loading = true;
    const from = page * PHASE4_PAGE_SIZE;
    try {
      let query = window.supabaseClient
        .from("gallery")
        .select("id, image_url, caption, album, taken_on", { count: "exact" })
        .order("taken_on", { ascending: false, nullsFirst: false })
        .range(from, from + PHASE4_PAGE_SIZE - 1);
      if (albumFilter?.value) query = query.eq("album", albumFilter.value);
      const { data, error, count } = await query;
      if (error) throw error;

      total = count ?? from + (data?.length || 0);
      if (!append) list.replaceChildren();
      (data || []).forEach((photo) => list.append(createGalleryItem(photo)));
      if (!data?.length && page === 0) {
        replaceWithMessage(
          list,
          albumFilter?.value ? "No photos are available in this album yet." : "No gallery photos have been added yet.",
        );
      }
      if (loadMore) {
        loadMore.classList.toggle(
          "hidden",
          !data?.length || from + data.length >= total,
        );
      }
    } catch (error) {
      console.error("Could not load gallery photos:", error);
      if (append) page = Math.max(0, page - 1);
      if (!append) replaceWithMessage(list, "The gallery is temporarily unavailable. Please try again later.");
    } finally {
      loading = false;
    }
  };

  albumFilter?.addEventListener("change", () => {
    page = 0;
    loadPhotos();
  });
  loadMore?.addEventListener("click", () => {
    if (loading) return;
    page += 1;
    loadPhotos(true);
  });
  setupGalleryLightbox();
  await Promise.all([loadAlbums(), loadPhotos()]);
}

function createGalleryItem(photo) {
  const item = document.createElement("article");
  item.className = "gallery-item";
  const button = document.createElement("button");
  button.className = "gallery-open";
  button.type = "button";
  button.setAttribute(
    "aria-label",
    photo.caption ? `View photo: ${photo.caption}` : "View gallery photo",
  );
  const image = document.createElement("img");
  image.src = safePhase4Image(photo.image_url);
  image.alt = "";
  image.width = 640;
  image.height = 480;
  image.loading = "lazy";
  image.decoding = "async";
  button.append(image);
  button.addEventListener("click", () => openGalleryLightbox(photo));
  item.append(button);

  const details = document.createElement("div");
  details.className = "gallery-item-details";
  if (photo.caption) {
    const caption = document.createElement("p");
    caption.textContent = photo.caption;
    details.append(caption);
  }
  if (photo.album || photo.taken_on) {
    const metadata = document.createElement("p");
    metadata.className = "gallery-item-meta";
    metadata.textContent = [photo.album, photo.taken_on ? formatPhase4Date(photo.taken_on) : ""]
      .filter(Boolean)
      .join(" · ");
    details.append(metadata);
  }
  item.append(details);
  return item;
}

function setupGalleryLightbox() {
  const dialog = document.getElementById("gallery-lightbox");
  const closeButton = document.getElementById("gallery-lightbox-close");
  closeButton?.addEventListener("click", () => closeGalleryLightbox(dialog));
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeGalleryLightbox(dialog);
  });
}

function closeGalleryLightbox(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function openGalleryLightbox(photo) {
  const dialog = document.getElementById("gallery-lightbox");
  const image = document.getElementById("gallery-lightbox-image");
  const caption = document.getElementById("gallery-lightbox-caption");
  const source = safePhase4Image(photo.image_url);
  if (!dialog || !image || !source) return;
  image.src = source;
  image.alt = photo.caption || "Church gallery photo";
  caption.textContent = photo.caption || "";
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function safePhase4Image(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === "https:" || url.origin === window.location.origin) {
      return url.href;
    }
  } catch (error) {
    console.warn("Ignored an invalid image URL.", error);
  }
  return "";
}

function formatEventDate(startValue, endValue) {
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return "Date to be confirmed";
  const dateFormat = new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const startText = dateFormat.format(start);
  const end = endValue ? new Date(endValue) : null;
  return end && !Number.isNaN(end.getTime())
    ? `${startText} – ${new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(end)}`
    : startText;
}

function formatPhase4Date(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function replaceWithMessage(element, message) {
  if (!element) return;
  const paragraph = document.createElement("p");
  paragraph.className = "empty-state";
  paragraph.textContent = message;
  element.replaceChildren(paragraph);
}
