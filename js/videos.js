const VIDEO_PAGE_SIZE = 12;

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("videoGrid");
  if (!grid) return;

  if (!window.supabaseClient) {
    showVideoStatus(
      "Videos are not connected yet. Add the Supabase anon key in js/supabase.js and run supabase/schema.sql in the Supabase SQL editor.",
      true,
    );
    grid.replaceChildren();
    return;
  }

  let page = 0;
  let total = 0;
  let loading = false;
  const loadMore = document.getElementById("loadMoreVideos");

  const loadVideos = async (append = false) => {
    if (loading) return;
    loading = true;
    const from = page * VIDEO_PAGE_SIZE;
    showVideoStatus(append ? "Loading more videos…" : "Loading videos…");

    const { data, error, count } = await window.supabaseClient
      .from("videos")
      .select("id, title, video_date, facebook_url, thumbnail_url, is_live_link", {
        count: "exact",
      })
      .order("video_date", { ascending: false, nullsFirst: false })
      .range(from, from + VIDEO_PAGE_SIZE - 1);

    loading = false;

    if (error) {
      console.error("Could not load videos:", error.message);
      showVideoStatus("We could not load videos right now. Please try again later.", true);
      if (!append) grid.replaceChildren();
      else page = Math.max(0, page - 1);
      return;
    }

    total = count ?? from + (data?.length || 0);
    if (!append) grid.replaceChildren();
    (data || []).forEach((video) => grid.append(createVideoCard(video)));

    if (!data?.length && page === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "There are no videos available yet.";
      grid.append(empty);
    }

    if (loadMore) {
      loadMore.classList.toggle(
        "hidden",
        !data?.length || from + data.length >= total,
      );
    }
    showVideoStatus(
      total ? `${total} video${total === 1 ? "" : "s"} available.` : "No videos are available yet.",
    );
  };

  loadMore?.addEventListener("click", () => {
    if (loading) return;
    page += 1;
    loadVideos(true);
  });

  loadVideos();
});

function createVideoCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";

  const image = document.createElement("img");
  image.src = safeVideoImage(video.thumbnail_url);
  image.alt = video.title ? `Thumbnail for ${video.title}` : "Church video thumbnail";
  image.width = 640;
  image.height = 360;
  image.loading = "lazy";
  image.decoding = "async";
  card.append(image);

  const content = document.createElement("div");
  content.className = "video-card-content";

  if (video.is_live_link) {
    const liveBadge = document.createElement("span");
    liveBadge.className = "video-live-badge";
    liveBadge.textContent = "Live stream";
    content.append(liveBadge);
  }

  const title = document.createElement("h2");
  title.textContent = video.title || "Church video";
  content.append(title);

  const date = document.createElement("p");
  date.className = "video-date";
  date.textContent = formatVideoDate(video.video_date);
  content.append(date);

  const facebookUrl = safeFacebookUrl(video.facebook_url);
  if (facebookUrl) {
    const link = document.createElement("a");
    link.className = "button button-primary";
    link.href = facebookUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Watch on Facebook";
    content.append(link);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "data-error";
    unavailable.textContent = "Facebook video link is not available.";
    content.append(unavailable);
  }

  card.append(content);
  return card;
}

function safeFacebookUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch (error) {
    console.warn("Ignored an invalid video link.", error);
    return "";
  }
}

function safeVideoImage(value) {
  if (typeof value !== "string" || !value.trim()) return "/images/logo.png";
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === "https:" || url.origin === window.location.origin) {
      return url.href;
    }
  } catch (error) {
    console.warn("Ignored an invalid video thumbnail URL.", error);
  }
  return "/images/logo.png";
}

function formatVideoDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not provided"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function showVideoStatus(message, isError = false) {
  const status = document.getElementById("videoStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("data-error", isError);
}
