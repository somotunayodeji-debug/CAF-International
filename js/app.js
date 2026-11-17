const SERMON_PAGE_SIZE = 12;
const DEFAULT_THUMBNAIL = "/images/logo.png";

let sermonPage = 0;
let sermonTotal = 0;
let sermonRequestId = 0;
let sermonSearchTimer;
let audio;
let playPauseButton;
let progressBar;
let currentTimeElement;
let durationElement;
let currentSermon = null;
let resumePosition = 0;
let lastPositionSaveAt = 0;

document.addEventListener("DOMContentLoaded", () => {
  const sermonGrid = document.getElementById("sermonGrid");
  if (!sermonGrid) return;

  audio = document.getElementById("audio");
  playPauseButton = document.getElementById("playPauseBtn");
  progressBar = document.getElementById("progressBar");
  currentTimeElement = document.getElementById("currentTime");
  durationElement = document.getElementById("duration");

  if (!window.supabaseClient) {
    showSermonStatus(
      "Sermons are not connected yet. Add the Supabase anon key in js/supabase.js and run supabase/schema.sql in the Supabase SQL editor.",
      true,
    );
    sermonGrid.replaceChildren();
    return;
  }

  setupSermonFilters();
  setupAudioPlayer();
  restoreSavedListening();
  loadSermonFilterOptions();
  loadSermons();

  const sharedSermonId = new URLSearchParams(window.location.search).get("play");
  if (sharedSermonId) loadSharedSermon(sharedSermonId);
});

function setupSermonFilters() {
  const searchInput = document.getElementById("searchInput");
  const dateFilter = document.getElementById("dateFilter");
  const preacherFilter = document.getElementById("preacherFilter");
  const seriesFilter = document.getElementById("seriesFilter");
  const clearButton = document.getElementById("clearSearch");
  const loadMoreButton = document.getElementById("loadMoreSermons");

  const resetAndReload = () => {
    window.clearTimeout(sermonSearchTimer);
    sermonSearchTimer = window.setTimeout(() => {
      sermonPage = 0;
      loadSermons();
    }, 250);
  };

  searchInput?.addEventListener("input", resetAndReload);
  dateFilter?.addEventListener("change", resetAndReload);
  preacherFilter?.addEventListener("change", resetAndReload);
  seriesFilter?.addEventListener("change", resetAndReload);

  clearButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (dateFilter) dateFilter.value = "";
    if (preacherFilter) preacherFilter.value = "";
    if (seriesFilter) seriesFilter.value = "";
    sermonPage = 0;
    loadSermons();
  });

  loadMoreButton?.addEventListener("click", () => {
    sermonPage += 1;
    loadSermons({ append: true });
  });
}

function setupAudioPlayer() {
  if (!audio) return;

  playPauseButton?.addEventListener("click", toggleAudioPlayback);
  progressBar?.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Number(progressBar.value);
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio.duration)) {
      if (durationElement) durationElement.textContent = formatTime(audio.duration);
      if (progressBar) progressBar.max = String(audio.duration);
      if (resumePosition > 0) {
        audio.currentTime = Math.min(resumePosition, audio.duration || resumePosition);
        resumePosition = 0;
      }
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (progressBar) progressBar.value = String(audio.currentTime);
    if (currentTimeElement) {
      currentTimeElement.textContent = formatTime(audio.currentTime);
    }
    saveCurrentListeningPosition();
  });

  audio.addEventListener("play", () => updatePlayButton(true));
  audio.addEventListener("pause", () => {
    updatePlayButton(false);
    saveCurrentListeningPosition(true);
  });

  audio.addEventListener("ended", () => {
    updatePlayButton(false);
    localStorage.removeItem("lastPlayed");
    resumePosition = 0;
    setContinueListeningVisible(false);
  });

  const closeButton = document.getElementById("closePlayer");
  closeButton?.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    currentSermon = null;
    resumePosition = 0;
    document.getElementById("audioPlayer")?.classList.remove("active");
    localStorage.removeItem("lastPlayed");
    setContinueListeningVisible(false);
  });

  const continueButton = document.getElementById("continueListening");
  continueButton?.addEventListener("click", () => {
    if (currentSermon) startCurrentSermon(resumePosition);
  });
}

async function loadSermonFilterOptions() {
  const preacherFilter = document.getElementById("preacherFilter");
  const seriesFilter = document.getElementById("seriesFilter");
  if (!preacherFilter && !seriesFilter) return;

  const { data, error } = await window.supabaseClient
    .from("sermons")
    .select("preacher, series")
    .order("sermon_date", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Could not load sermon filter options:", error.message);
    showSermonStatus("Sermons loaded, but filter options could not be loaded.", true);
    return;
  }

  const preachers = new Set();
  const seriesNames = new Set();
  (data || []).forEach((sermon) => {
    if (sermon.preacher?.trim()) preachers.add(sermon.preacher.trim());
    if (sermon.series?.trim()) seriesNames.add(sermon.series.trim());
  });

  addFilterOptions(preacherFilter, preachers, "All Preachers");
  addFilterOptions(seriesFilter, seriesNames, "All Series");
}

function addFilterOptions(select, values, placeholder) {
  if (!select) return;
  const currentValue = select.value;
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = placeholder;
  select.replaceChildren(defaultOption);

  [...values]
    .sort((left, right) => left.localeCompare(right))
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });

  if (values.has(currentValue)) select.value = currentValue;
}

async function loadSermons({ append = false } = {}) {
  const grid = document.getElementById("sermonGrid");
  if (!grid) return;

  const requestId = ++sermonRequestId;
  const pageSize = Number(grid.dataset.pageSize) || SERMON_PAGE_SIZE;
  const from = sermonPage * pageSize;
  const to = from + pageSize - 1;
  const search = document.getElementById("searchInput")?.value.trim();
  const date = document.getElementById("dateFilter")?.value;
  const preacher = document.getElementById("preacherFilter")?.value;
  const series = document.getElementById("seriesFilter")?.value;

  let query = window.supabaseClient
    .from("sermons")
    .select(
      "id, title, preacher, sermon_date, audio_url, thumbnail_url, duration_seconds, series, scripture_ref, notes, downloads",
      { count: "exact" },
    )
    .order("sermon_date", { ascending: false })
    .range(from, to);

  if (date) query = query.eq("sermon_date", date);
  if (preacher) query = query.eq("preacher", preacher);
  if (series) query = query.eq("series", series);

  if (search) {
    const safeSearch = search.replace(/[%_,.()*"\\]/g, " ").trim();
    if (safeSearch) {
      query = query.or(
        `title.ilike.%${safeSearch}%,preacher.ilike.%${safeSearch}%,series.ilike.%${safeSearch}%`,
      );
    }
  }

  if (!append) showSermonStatus("Loading sermons…");

  const { data, error, count } = await query;
  if (requestId !== sermonRequestId) return;

  if (error) {
    console.error("Could not load sermons:", error.message);
    showSermonStatus("We could not load sermons right now. Please try again later.", true);
    if (!append) grid.replaceChildren();
    else sermonPage = Math.max(0, sermonPage - 1);
    return;
  }

  sermonTotal = count ?? from + (data?.length || 0);
  if (!append) grid.replaceChildren();
  renderSermonCards(data || [], grid);

  if (!data?.length && sermonPage === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "No sermons match those filters.";
    grid.append(emptyMessage);
  }

  const loadMoreButton = document.getElementById("loadMoreSermons");
  if (loadMoreButton) {
    loadMoreButton.classList.toggle(
      "hidden",
      !data?.length || from + data.length >= sermonTotal,
    );
  }

  showSermonStatus(
    sermonTotal
      ? `${sermonTotal} sermon${sermonTotal === 1 ? "" : "s"} found.`
      : "No sermons are available yet.",
  );
}

function renderSermonCards(sermons, grid) {
  sermons.forEach((sermon) => {
    const card = document.createElement("article");
    card.className = "sermon-card";

    const image = document.createElement("img");
    image.src = safeMediaUrl(sermon.thumbnail_url) || DEFAULT_THUMBNAIL;
    image.alt = sermon.title ? `Artwork for ${sermon.title}` : "Sermon artwork";
    image.width = 640;
    image.height = 360;
    image.loading = "lazy";
    image.decoding = "async";
    card.append(image);

    const title = document.createElement("h2");
    title.textContent = sermon.title || "Sermon";
    card.append(title);

    if (sermon.preacher) {
      const preacher = document.createElement("p");
      preacher.className = "preacher";
      preacher.textContent = sermon.preacher;
      card.append(preacher);
    }

    const date = document.createElement("p");
    date.className = "date";
    date.textContent = formatSermonDate(sermon.sermon_date);
    card.append(date);

    if (sermon.series) {
      const series = document.createElement("p");
      series.className = "series";
      series.textContent = `Series: ${sermon.series}`;
      card.append(series);
    }

    if (sermon.scripture_ref) {
      const scripture = document.createElement("p");
      scripture.className = "scripture";
      scripture.textContent = sermon.scripture_ref;
      card.append(scripture);
    }

    const downloads = document.createElement("p");
    downloads.className = "downloads";
    downloads.textContent = `Downloads: ${Number(sermon.downloads) || 0}`;
    card.append(downloads);

    if (sermon.duration_seconds) {
      const duration = document.createElement("p");
      duration.className = "duration";
      duration.textContent = `${Math.floor(sermon.duration_seconds / 60)} mins`;
      card.append(duration);
    }

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";
    buttons.append(
      createSermonAction("▶ Play", () => playSermon(sermon), "play-btn"),
      createSermonAction("↗ Share", () => shareSermon(sermon.id), "share-btn"),
      createSermonAction(
        "↓ Download",
        (event) => downloadSermon(sermon, card, event.currentTarget),
        "download-btn",
      ),
    );
    card.append(buttons);
    grid.append(card);
  });
}

function createSermonAction(label, action, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

async function shareSermon(sermonId) {
  const url = new URL("sermons.html", window.location.href);
  url.searchParams.set("play", String(sermonId));

  try {
    await navigator.clipboard.writeText(url.href);
    showSermonStatus("Sermon link copied. Share it with someone.");
  } catch (error) {
    console.warn("Clipboard access was unavailable:", error);
    window.prompt("Copy this sermon link:", url.href);
  }
}

function playSermon(sermon, { resumeAt = 0, autoplay = true } = {}) {
  if (!audio) return;
  const audioUrl = safeMediaUrl(sermon.audio_url);
  if (!audioUrl) {
    showSermonStatus("This sermon does not have a valid audio file yet.", true);
    return;
  }

  audio.pause();
  localStorage.removeItem("lastPlayed");
  lastPositionSaveAt = 0;
  currentSermon = sermon;
  resumePosition = Math.max(0, Number(resumeAt) || 0);
  document.getElementById("nowPlaying").textContent = sermon.title || "Sermon";
  document.getElementById("nowPreacher").textContent = sermon.preacher || "";
  const thumbnail = document.getElementById("playerThumb");
  if (thumbnail) {
    thumbnail.src = safeMediaUrl(sermon.thumbnail_url) || DEFAULT_THUMBNAIL;
    thumbnail.alt = sermon.title ? `Artwork for ${sermon.title}` : "Sermon artwork";
  }

  audio.src = audioUrl;
  audio.load();
  document.getElementById("audioPlayer")?.classList.add("active");
  setContinueListeningVisible(false);

  if (autoplay) startCurrentSermon(resumePosition);
}

function startCurrentSermon(startAt = 0) {
  if (!audio || !currentSermon) return;
  resumePosition = Math.max(0, Number(startAt) || 0);
  if (audio.readyState >= 1 && resumePosition > 0) {
    audio.currentTime = Math.min(resumePosition, audio.duration || resumePosition);
    resumePosition = 0;
  }
  audio
    .play()
    .then(() => setContinueListeningVisible(false))
    .catch((error) => {
      console.error("Audio playback failed:", error.message);
      showSermonStatus(
        "Playback could not start. Check your connection, then press Play to try again.",
        true,
      );
    });
}

function toggleAudioPlayback() {
  if (!audio || !currentSermon) return;
  if (audio.paused) {
    startCurrentSermon(resumePosition);
  } else {
    audio.pause();
  }
}

async function loadSharedSermon(sermonId) {
  const { data, error } = await window.supabaseClient
    .from("sermons")
    .select(
      "id, title, preacher, sermon_date, audio_url, thumbnail_url, duration_seconds, series, scripture_ref, notes, downloads",
    )
    .eq("id", sermonId)
    .maybeSingle();

  if (error) {
    console.error("Could not load shared sermon:", error.message);
    showSermonStatus("The shared sermon could not be loaded.", true);
    return;
  }

  if (data) playSermon(data, { autoplay: false });
  else showSermonStatus("That sermon could not be found.", true);
}

function restoreSavedListening() {
  const saved = readSavedListening();
  if (!saved || !saved.src || !saved.title) return;

  const src = safeMediaUrl(saved.src);
  if (!src) {
    localStorage.removeItem("lastPlayed");
    return;
  }

  currentSermon = {
    id: saved.id,
    title: saved.title,
    preacher: saved.preacher,
    audio_url: src,
    thumbnail_url: safeMediaUrl(saved.thumb),
  };
  resumePosition = Math.max(0, Number(saved.time) || 0);
  document.getElementById("nowPlaying").textContent = saved.title;
  document.getElementById("nowPreacher").textContent = saved.preacher || "";
  const thumbnail = document.getElementById("playerThumb");
  if (thumbnail) {
    thumbnail.src = currentSermon.thumbnail_url || DEFAULT_THUMBNAIL;
    thumbnail.alt = `Artwork for ${saved.title}`;
  }
  audio.src = src;
  document.getElementById("audioPlayer")?.classList.add("active");
  setContinueListeningVisible(true);
}

function readSavedListening() {
  const savedValue = localStorage.getItem("lastPlayed");
  if (!savedValue) return null;
  try {
    return JSON.parse(savedValue);
  } catch (error) {
    console.warn("Saved listening position was invalid and has been cleared.", error);
    localStorage.removeItem("lastPlayed");
    return null;
  }
}

function saveCurrentListeningPosition(force = false) {
  if (!audio || !currentSermon || !audio.src || audio.ended) return;
  if (audio.currentTime < 5) return;
  const now = Date.now();
  if (!force && now - lastPositionSaveAt < 5000) return;

  const thumbnail = document.getElementById("playerThumb");
  localStorage.setItem(
    "lastPlayed",
    JSON.stringify({
      id: currentSermon.id,
      src: audio.currentSrc || audio.src,
      time: audio.currentTime,
      title: currentSermon.title,
      preacher: currentSermon.preacher || "",
      thumb: thumbnail?.src || "",
    }),
  );
  lastPositionSaveAt = now;
  setContinueListeningVisible(audio.paused);
}

function setContinueListeningVisible(visible) {
  const wrap = document.getElementById("continueListeningWrap");
  if (wrap) wrap.classList.toggle("hidden", !visible);
  const button = document.getElementById("continueListening");
  if (button && currentSermon) {
    button.textContent = `Continue listening: ${currentSermon.title}`;
  }
}

function updatePlayButton(isPlaying) {
  if (!playPauseButton) return;
  playPauseButton.textContent = isPlaying ? "⏸" : "▶";
  playPauseButton.setAttribute("aria-label", isPlaying ? "Pause audio" : "Play audio");
  playPauseButton.setAttribute("title", isPlaying ? "Pause" : "Play");
}

async function downloadSermon(sermon, card, button) {
  const audioUrl = safeMediaUrl(sermon.audio_url);
  if (!audioUrl) {
    showSermonStatus("This sermon does not have a valid audio file to download.", true);
    return;
  }

  window.open(audioUrl, "_blank", "noopener,noreferrer");
  if (button instanceof HTMLButtonElement) button.disabled = true;
  try {
    const { error } = await window.supabaseClient.rpc("increment_downloads", {
      row_id: sermon.id,
    });
    if (error) {
      console.error("Could not increment sermon download count:", error.message);
      showSermonStatus(
        "The sermon opened, but its download count could not be updated.",
        true,
      );
      return;
    }

    const count = card.querySelector(".downloads");
    if (count) {
      const currentDownloads = Number(sermon.downloads) || 0;
      sermon.downloads = currentDownloads + 1;
      count.textContent = `Downloads: ${sermon.downloads}`;
    }
    showSermonStatus("The sermon audio opened in a new tab.");
  } catch (error) {
    console.error("Could not increment sermon download count:", error);
    showSermonStatus(
      "The sermon opened, but its download count could not be updated.",
      true,
    );
  } finally {
    if (button instanceof HTMLButtonElement) button.disabled = false;
  }
}

function safeMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === "https:" || url.origin === window.location.origin) {
      return url.href;
    }
  } catch (error) {
    console.warn("Ignored an invalid media URL.", error);
  }
  return "";
}

function formatSermonDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not provided"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function formatTime(seconds) {
  if (!Number.isFinite(Number(seconds))) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function showSermonStatus(message, isError = false) {
  const status = document.getElementById("sermonStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("data-error", isError);
}
