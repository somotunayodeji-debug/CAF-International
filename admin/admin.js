const ADMIN_SECTIONS = [
  {
    key: "sermons",
    label: "Sermons",
    table: "sermons",
    title: "Sermons",
    columns: "id, title, preacher, sermon_date, description, audio_url, video_url, thumbnail_url, duration_seconds, series, scripture_ref, tags, downloads, notes, created_at",
    order: "sermon_date",
    fields: [
      { name: "title", label: "Sermon title", type: "text", required: true },
      { name: "preacher", label: "Preacher", type: "text" },
      { name: "sermon_date", label: "Sermon date", type: "date", required: true },
      { name: "description", label: "Short description", type: "textarea" },
      { name: "audio_file", label: "Audio file", type: "audio", bucket: "sermons-audio", property: "audio_url", required: true },
      { name: "thumbnail_file", label: "Sermon thumbnail", type: "image", bucket: "thumbnails", property: "thumbnail_url" },
      { name: "video_url", label: "Optional video link", type: "url" },
      { name: "duration_seconds", label: "Audio duration (seconds)", type: "number", min: 0 },
      { name: "series", label: "Series", type: "text" },
      { name: "scripture_ref", label: "Scripture reference", type: "text" },
      { name: "tags", label: "Tags (separate with commas)", type: "text" },
      { name: "notes", label: "Admin notes", type: "textarea" },
    ],
    summary: (row) => [
      row.preacher,
      row.sermon_date,
      row.series,
      `Downloads: ${Number(row.downloads) || 0}`,
    ].filter(Boolean).join(" · "),
  },
  {
    key: "videos",
    label: "Videos",
    table: "videos",
    title: "Videos",
    columns: "id, title, video_date, facebook_url, thumbnail_url, is_live_link, created_at",
    order: "video_date",
    fields: [
      { name: "title", label: "Video title", type: "text", required: true },
      { name: "video_date", label: "Video date", type: "date" },
      { name: "facebook_url", label: "Facebook video URL", type: "url", required: true },
      { name: "thumbnail_file", label: "Thumbnail image", type: "image", bucket: "images", property: "thumbnail_url" },
      { name: "is_live_link", label: "This is a live-stream link", type: "checkbox" },
    ],
    summary: (row) => [row.video_date, row.is_live_link ? "Live stream" : ""].filter(Boolean).join(" · "),
  },
  {
    key: "events",
    label: "Events",
    table: "events",
    title: "Events",
    columns: "id, title, description, event_date, end_at, location, is_recurring, recurrence_note, image_url, created_at",
    order: "event_date",
    fields: [
      { name: "title", label: "Event title", type: "text", required: true },
      { name: "event_date", label: "Start date and time", type: "datetime-local", required: true },
      { name: "end_at", label: "End date and time (optional)", type: "datetime-local" },
      { name: "location", label: "Location", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_recurring", label: "This is a recurring event", type: "checkbox" },
      { name: "recurrence_note", label: "Recurrence note", type: "text" },
      { name: "image_file", label: "Event image", type: "image", bucket: "images", property: "image_url" },
    ],
    summary: (row) => [row.event_date, row.location].filter(Boolean).join(" · "),
  },
  {
    key: "announcements",
    label: "Announcements",
    table: "announcements",
    title: "Announcements",
    columns: "id, title, body, is_pinned, expires_at, created_at",
    order: "created_at",
    fields: [
      { name: "title", label: "Announcement title", type: "text", required: true },
      { name: "body", label: "Announcement", type: "textarea", required: true },
      { name: "is_pinned", label: "Pin this announcement on the home page", type: "checkbox" },
      { name: "expires_at", label: "Expiry date and time (optional)", type: "datetime-local" },
    ],
    summary: (row) => row.is_pinned ? "Pinned on home page" : "Not pinned",
  },
  {
    key: "posts",
    label: "Blog posts",
    table: "posts",
    title: "Blog posts",
    columns: "id, title, slug, excerpt, body, cover_url, published, published_at, created_at",
    order: "created_at",
    fields: [
      { name: "title", label: "Post title", type: "text", required: true },
      { name: "slug", label: "Post link (generated from the title)", type: "text", required: true, readonly: true },
      { name: "excerpt", label: "Short summary", type: "textarea" },
      { name: "body", label: "Post text (plain text; blank lines create paragraphs)", type: "textarea", required: true },
      { name: "cover_file", label: "Cover image", type: "image", bucket: "images", property: "cover_url" },
      { name: "published", label: "Publish this post", type: "checkbox" },
    ],
    summary: (row) => row.published ? `Published ${formatAdminDate(row.published_at)}` : "Draft",
  },
  {
    key: "services",
    label: "Service times",
    table: "services",
    title: "Service times",
    columns: "id, name, weekday, start_time, end_time, sort_order, created_at",
    order: "sort_order",
    fields: [
      { name: "name", label: "Service name", type: "text", required: true },
      { name: "weekday", label: "Day of the week", type: "text", required: true },
      { name: "start_time", label: "Start time", type: "time", required: true },
      { name: "end_time", label: "End time", type: "time", required: true },
      { name: "sort_order", label: "Display order", type: "number", min: 0 },
    ],
    summary: (row) => `${row.weekday || ""} · ${row.start_time || ""}–${row.end_time || ""}`,
  },
];

const ADMIN_INBOXES = [
  {
    key: "prayer_requests",
    label: "Prayer requests",
    title: "Prayer requests",
    columns: "id, name, contact, request, is_private, created_at",
    heading: (row) => row.name || "Prayer request",
    body: (row) => row.request,
    summary: (row) => [row.contact, formatAdminDate(row.created_at)].filter(Boolean).join(" · "),
  },
  {
    key: "first_timers",
    label: "First-timers",
    title: "First-timers",
    columns: "id, name, phone, email, how_heard, wants_followup, created_at",
    heading: (row) => row.name || "New visitor",
    body: (row) => [
      row.phone && `Phone: ${row.phone}`,
      row.email && `Email: ${row.email}`,
      row.how_heard && `Heard about us: ${row.how_heard}`,
      row.wants_followup ? "Asked for follow-up" : "No follow-up requested",
    ].filter(Boolean).join("\n"),
    summary: (row) => formatAdminDate(row.created_at),
  },
  {
    key: "contact_messages",
    label: "Contact messages",
    title: "Contact messages",
    columns: "id, name, contact, message, created_at",
    heading: (row) => row.name || "Message",
    body: (row) => row.message,
    summary: (row) => [row.contact, formatAdminDate(row.created_at)].filter(Boolean).join(" · "),
  },
  {
    key: "testimonies",
    label: "Testimonies",
    title: "Testimonies",
    columns: "id, name, testimony, approved, created_at",
    heading: (row) => row.name || "Testimony",
    body: (row) => row.testimony,
    summary: (row) => `${row.approved ? "Approved for public display" : "Waiting for approval"} · ${formatAdminDate(row.created_at)}`,
  },
];

const ADMIN_SECTIONS_ALL = [
  ...ADMIN_SECTIONS,
  {
    key: "gallery",
    label: "Gallery",
    title: "Gallery",
    custom: true,
    table: "gallery",
    columns: "id, image_url, caption, album, taken_on, created_at",
    order: "created_at",
  },
  ...ADMIN_INBOXES.map((inbox) => ({
    key: inbox.key,
    label: inbox.label,
    title: inbox.title,
    inbox: true,
    columns: inbox.columns,
    table: inbox.key,
  })),
];

const RESUMABLE_AUDIO_THRESHOLD = 6 * 1024 * 1024;
const RESUMABLE_AUDIO_CHUNK_SIZE = 6 * 1024 * 1024;
const activeResumableUploads = new WeakMap();

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const dashboard = document.getElementById("admin-app");
  if (loginForm) initializeLoginPage();
  if (dashboard) initializeDashboard();
});

function initializeLoginPage() {
  const form = document.getElementById("login-form");
  const status = document.getElementById("login-status");
  const forgotButton = document.getElementById("forgot-password");
  const resetForm = document.getElementById("password-reset-form");
  const resetStatus = document.getElementById("reset-status");
  const backToLogin = document.getElementById("back-to-login");
  const resetParams = new URLSearchParams(window.location.search);
  const isPasswordResetReturn =
    resetParams.get("reset") === "1" || resetParams.get("type") === "recovery";
  if (!form || !status || !window.supabaseClient) {
    if (status) setAdminStatus(status, "Sign-in is temporarily unavailable. Please try again later.", true);
    return;
  }
  if (new URLSearchParams(window.location.search).get("access") === "denied") {
    setAdminStatus(status, "This account does not have admin access.", true);
  } else if (new URLSearchParams(window.location.search).get("access") === "unavailable") {
    setAdminStatus(status, "We could not verify admin access. Please sign in again.", true);
  }
  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!resetForm || !resetStatus) return;
    clearAdminStatus(resetStatus);
    const values = new FormData(resetForm);
    const password = String(values.get("new_password") || "");
    const confirmation = String(values.get("confirm_password") || "");
    if (password.length < 8) {
      setAdminStatus(resetStatus, "Choose a password with at least 8 characters.", true);
      return;
    }
    if (password !== confirmation) {
      setAdminStatus(resetStatus, "The passwords do not match. Please check and try again.", true);
      return;
    }
    const button = resetForm.querySelector('button[type="submit"]');
    await withButtonBusy(button, resetStatus, "Saving your new password…", async () => {
      const { data, error } = await window.supabaseClient.auth.updateUser({ password });
      if (error || !data?.user) {
        console.error("Admin password update failed:", error?.message || "No user returned.");
        setAdminStatus(resetStatus, "We could not update your password. Please request a new reset link.", true);
        return;
      }
      let isAdmin;
      try {
        isAdmin = await verifyAdminUser(data.user);
      } catch (error) {
        console.error("Could not verify administrator access after password reset:", error);
        await window.supabaseClient.auth.signOut();
        setAdminStatus(resetStatus, "Your password was updated, but we could not verify admin access. Please sign in again.", true);
        return;
      }
      if (!isAdmin) {
        await window.supabaseClient.auth.signOut();
        setAdminStatus(resetStatus, "This account does not have admin access.", true);
        return;
      }
      window.location.replace("index.html");
    });
  });
  backToLogin?.addEventListener("click", () => {
    if (resetForm) resetForm.hidden = true;
    form.hidden = false;
    clearAdminStatus(status);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAdminStatus(status);
    const email = String(new FormData(form).get("email") || "").trim();
    const password = String(new FormData(form).get("password") || "");
    if (!email || !password || email.length > 254) {
      setAdminStatus(status, "Enter your email address and password.", true);
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    await withButtonBusy(button, status, "Signing in…", async () => {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data?.user) {
        console.error("Admin sign-in failed:", error?.message || "No user returned.");
        setAdminStatus(status, "We could not sign you in. Check your details and try again.", true);
        return;
      }
      let isAdmin;
      try {
        isAdmin = await verifyAdminUser(data.user);
      } catch (error) {
        console.error("Could not verify administrator access after sign-in:", error);
        await window.supabaseClient.auth.signOut();
        setAdminStatus(status, "We could not verify admin access. Please try again later.", true);
        return;
      }
      if (!isAdmin) {
        await window.supabaseClient.auth.signOut();
        setAdminStatus(status, "This account does not have admin access.", true);
        return;
      }
      window.location.replace("index.html");
    });
  });

  forgotButton?.addEventListener("click", async () => {
    clearAdminStatus(status);
    const email = String(new FormData(form).get("email") || "").trim();
    if (!email || email.length > 254) {
      setAdminStatus(status, "Enter your email address first, then choose Forgot password.", true);
      form.elements.namedItem("email")?.focus();
      return;
    }

    await withButtonBusy(forgotButton, status, "Sending reset instructions…", async () => {
      const redirectTo = new URL("login.html?reset=1", window.location.href).href;
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        console.error("Admin password reset request failed:", error.message);
        setAdminStatus(status, "We could not send reset instructions. Check the email and try again.", true);
        return;
      }
      setAdminStatus(status, "If this email has an account, password reset instructions are on the way.", false);
    });
  });

  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" && resetForm) {
      form.hidden = true;
      resetForm.hidden = false;
      resetForm.elements.namedItem("new_password")?.focus();
    }
  });

  window.supabaseClient.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      console.error("Could not check the saved admin session:", error.message);
      setAdminStatus(status, "We could not check your saved session. Please try signing in again.", true);
      return;
    }
    if (!data.session?.user) return;
    if (await verifyAdminUser(data.session.user)) {
      if (isPasswordResetReturn && resetForm) {
        form.hidden = true;
        resetForm.hidden = false;
        resetForm.elements.namedItem("new_password")?.focus();
        return;
      }
      window.location.replace("index.html");
    } else {
      await window.supabaseClient.auth.signOut();
      setAdminStatus(status, "This account does not have admin access.", true);
    }
  }).catch((error) => {
    console.error("Could not check the saved admin session:", error);
    setAdminStatus(status, "We could not check your saved session. Please try signing in again.", true);
  });
}

async function initializeDashboard() {
  const app = document.getElementById("admin-app");
  const status = document.getElementById("dashboard-status");
  if (!app || !status || !window.supabaseClient) {
    window.location.replace("login.html");
    return;
  }

  document.getElementById("logout-button")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await withButtonBusy(button, status, "Signing out…", async () => {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {
        console.error("Admin sign-out failed:", error.message);
        setAdminStatus(status, "We could not sign you out. Please try again.", true);
        return;
      }
      window.location.replace("login.html");
    });
  });

  try {
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) {
      window.location.replace("login.html");
      return;
    }
    if (!(await verifyAdminUser(data.session.user))) {
      await window.supabaseClient.auth.signOut();
      window.location.replace("login.html?access=denied");
      return;
    }

    buildAdminDashboard(app);
    app.hidden = false;
    showAdminSection(ADMIN_SECTIONS_ALL[0].key);
  } catch (error) {
    console.error("Admin access check failed:", error);
    window.location.replace("login.html?access=unavailable");
  }
}

async function verifyAdminUser(user) {
  if (!user?.id || !window.supabaseClient) return false;
  try {
    const { data, error } = await window.supabaseClient
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data?.user_id === user.id;
  } catch (error) {
    console.error("Could not verify admin status:", error);
    throw new Error("Admin access could not be verified.");
  }
}

function buildAdminDashboard(app) {
  const tabs = document.getElementById("admin-tabs");
  const panels = document.getElementById("admin-panels");
  if (!tabs || !panels) return;
  tabs.replaceChildren();
  panels.replaceChildren();

  ADMIN_SECTIONS_ALL.forEach((section) => {
    const tab = document.createElement("button");
    tab.className = "admin-tab";
    tab.type = "button";
    tab.id = `tab-${section.key}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `panel-${section.key}`);
    tab.setAttribute("aria-selected", "false");
    tab.textContent = section.label;
    tab.addEventListener("click", () => showAdminSection(section.key));
    tabs.append(tab);

    const panel = document.createElement("section");
    panel.className = "admin-section-panel";
    panel.id = `panel-${section.key}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.hidden = true;
    const heading = document.createElement("h2");
    heading.className = "admin-section-heading";
    heading.textContent = section.title;
    const description = document.createElement("p");
    description.className = "admin-field-help";
    description.textContent = section.inbox
      ? "These messages are visible only to administrators. Remove a message after you have handled it."
      : section.custom
        ? "Add one or more gallery photos. Each photo is resized before it is uploaded."
        : "Add a new item or choose Edit beside an existing item.";
    panel.append(heading, description);
    const layout = document.createElement("div");
    layout.className = "admin-panel-layout";
    if (section.inbox) {
      const list = document.createElement("div");
      list.className = "admin-record-list";
      list.id = `records-${section.key}`;
      layout.classList.add("admin-panel-single");
      layout.append(list);
    } else {
      const editor = document.createElement("div");
      editor.className = "admin-form-card";
      editor.id = `editor-${section.key}`;
      const list = document.createElement("div");
      list.className = "admin-record-list";
      list.id = `records-${section.key}`;
      layout.append(editor, list);
    }
    panel.append(layout);
    panels.append(panel);

    if (!section.inbox) {
      if (section.custom) buildGalleryEditor(section);
      else buildEditor(section);
    }
  });
}

function showAdminSection(key) {
  ADMIN_SECTIONS_ALL.forEach((section) => {
    const panel = document.getElementById(`panel-${section.key}`);
    const tab = document.getElementById(`tab-${section.key}`);
    const active = section.key === key;
    if (panel) panel.hidden = !active;
    if (tab) tab.setAttribute("aria-selected", String(active));
  });
  loadAdminSection(key);
}

const loadedAdminSections = new Set();
async function loadAdminSection(key) {
  if (loadedAdminSections.has(key)) return;
  const section = ADMIN_SECTIONS_ALL.find((item) => item.key === key);
  if (!section) return;
  if (section.custom) {
    await loadAdminRecords(section);
    return;
  }
  await loadAdminRecords(section);
}

function buildEditor(section) {
  const host = document.getElementById(`editor-${section.key}`);
  if (!host) return;
  const form = document.createElement("form");
  form.className = "admin-form";
  form.id = `form-${section.key}`;
  form.noValidate = true;
  const heading = document.createElement("h3");
  heading.textContent = "Add new";
  form.append(heading);
  const id = createInput("input", "hidden");
  id.name = "record_id";
  form.append(id);

  section.fields.forEach((field) => {
    const control = createAdminField(field, section.key);
    form.append(control.wrapper);
  });
  if (section.key === "posts") {
    const titleInput = form.elements.namedItem("title");
    const slugInput = form.elements.namedItem("slug");
    titleInput?.addEventListener("input", () => {
      if (form.elements.namedItem("record_id").value) return;
      slugInput.value = slugifyAdmin(titleInput.value);
    });
  }
  const uploadStatus = document.createElement("p");
  uploadStatus.className = "admin-upload-status";
  uploadStatus.id = `upload-status-${section.key}`;
  uploadStatus.setAttribute("role", "status");
  uploadStatus.setAttribute("aria-live", "polite");
  form.append(uploadStatus);
  if (section.key === "sermons") {
    const cancelUpload = createAdminButton("Cancel upload", "admin-button admin-button-secondary", "button");
    cancelUpload.hidden = true;
    cancelUpload.addEventListener("click", () => {
      activeResumableUploads.get(form)?.cancel();
    });
    form.append(cancelUpload);
    form.dataset.cancelUploadButtonId = cancelUpload.id = "cancel-upload-sermons";
  }

  const actions = document.createElement("div");
  actions.className = "admin-record-actions";
  const save = createAdminButton("Save", "admin-button admin-button-primary", "submit");
  save.id = `save-${section.key}`;
  actions.append(save);
  const cancel = createAdminButton("Cancel edit", "admin-button admin-button-secondary", "button");
  cancel.hidden = true;
  cancel.addEventListener("click", () => resetEditor(section));
  actions.append(cancel);
  form.append(actions);
  form.addEventListener("submit", (event) => saveEditor(event, section));
  host.replaceChildren(form);
  form.dataset.cancelButtonId = cancel.id = `cancel-${section.key}`;
}

function createAdminField(field, sectionKey) {
  const wrapper = document.createElement("label");
  wrapper.className = field.type === "checkbox" ? "admin-check-label" : "";
  const input = field.type === "textarea"
    ? document.createElement("textarea")
    : createInput("input", field.type);
  input.name = field.name;
  input.id = `${sectionKey}-${field.name}`;
  if (field.required) input.required = true;
  if (field.readonly) input.readOnly = true;
  if (field.min !== undefined) input.min = String(field.min);
  if (field.type === "file") input.accept = field.accept;
  if (field.type === "image" || field.type === "audio") {
    input.type = "file";
    input.accept = field.type === "audio" ? "audio/*" : "image/*";
    input.required = false;
    input.addEventListener("change", () => {
      if (field.type === "audio") handleAudioFileChange(input, sectionKey);
      else validateImageFile(input);
    });
  }
  if (field.type === "checkbox") {
    input.type = "checkbox";
    wrapper.append(input, document.createTextNode(field.label));
  } else {
    const labelText = document.createElement("span");
    labelText.textContent = field.label;
    wrapper.append(labelText, input);
  }

  if (field.type === "audio" || field.type === "image") {
    const existing = document.createElement("span");
    existing.className = "admin-current-media";
    existing.id = `${sectionKey}-current-${field.name}`;
    existing.hidden = true;
    wrapper.append(existing);
  }
  return { wrapper, input };
}

function createInput(tagName, type) {
  const input = document.createElement(tagName);
  if (tagName === "input") input.type = type;
  return input;
}

function handleAudioFileChange(input, sectionKey) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("audio/")) {
    input.value = "";
    setGlobalStatus("Choose a valid audio file.", true);
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    if (!confirmLargeFile()) {
      input.value = "";
      return;
    }
  }
  const audio = new Audio();
  const objectUrl = URL.createObjectURL(file);
  audio.preload = "metadata";
  audio.addEventListener("loadedmetadata", () => {
    const durationField = document.getElementById(`${sectionKey}-duration_seconds`);
    if (durationField && Number.isFinite(audio.duration)) {
      durationField.value = String(Math.round(audio.duration));
    }
    URL.revokeObjectURL(objectUrl);
  }, { once: true });
  audio.addEventListener("error", () => URL.revokeObjectURL(objectUrl), { once: true });
  audio.src = objectUrl;
}

function validateImageFile(input) {
  const file = input.files?.[0];
  if (file && !file.type.startsWith("image/")) {
    input.value = "";
    setGlobalStatus("Choose a valid image file.", true);
    return;
  }
  if (file && file.size > 50 * 1024 * 1024 && !confirmLargeFile()) {
    input.value = "";
  }
}

function confirmLargeFile() {
  return window.confirm(
    "This file is over 50 MB. It may take a long time to upload on mobile data. Continue?",
  );
}

function buildGalleryEditor(section) {
  const host = document.getElementById(`editor-${section.key}`);
  const form = document.createElement("form");
  form.className = "admin-form";
  form.id = "form-gallery";
  form.noValidate = true;
  const heading = document.createElement("h3");
  heading.textContent = "Upload gallery photos";
  const album = createLabeledInput("Album name", "text", "album");
  const caption = createLabeledInput("Caption (used for all selected photos)", "text", "caption");
  const takenOn = createLabeledInput("Date taken (optional)", "date", "taken_on");
  const imageLabel = document.createElement("label");
  imageLabel.append(document.createTextNode("Choose image files"));
  const files = createInput("input", "file");
  files.type = "file";
  files.name = "images";
  files.accept = "image/*";
  files.multiple = true;
  files.required = true;
  files.addEventListener("change", () => {
    [...files.files].forEach((file) => {
      if (!file.type.startsWith("image/")) {
        files.value = "";
        setGlobalStatus("Choose image files only.", true);
      } else if (file.size > 50 * 1024 * 1024 && !confirmLargeFile()) {
        files.value = "";
      }
    });
  });
  imageLabel.append(files);
  const status = document.createElement("p");
  status.className = "admin-upload-status";
  status.id = "upload-status-gallery";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const save = createAdminButton("Upload photos", "admin-button admin-button-primary", "submit");
  form.append(
    heading,
    album,
    caption,
    takenOn,
    imageLabel,
    status,
    save,
  );
  form.addEventListener("submit", uploadGalleryImages);
  host.replaceChildren(form);
}

function createLabeledInput(labelText, type, name) {
  const label = document.createElement("label");
  label.append(document.createTextNode(labelText));
  const input = createInput("input", type);
  input.name = name;
  label.append(input);
  return label;
}

function createAdminButton(text, className, type) {
  const button = document.createElement("button");
  button.className = className;
  button.type = type;
  button.textContent = text;
  return button;
}

async function saveEditor(event, section) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById("dashboard-status");
  const uploadStatus = document.getElementById(`upload-status-${section.key}`);
  const button = document.getElementById(`save-${section.key}`);
  if (!form || !status || !button) return;
  clearAdminStatus(status);
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const recordId = form.elements.namedItem("record_id").value;
  const original = recordId ? adminRecordCache.get(`${section.key}:${recordId}`) : null;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    const payload = {};
    for (const field of section.fields) {
      if (field.type === "image" || field.type === "audio") continue;
      const input = form.elements.namedItem(field.name);
      if (field.type === "checkbox") payload[field.name] = input.checked;
      else if (field.type === "number") {
        payload[field.name] = input.value === "" ? 0 : Number(input.value);
      } else if (field.name === "tags") {
        payload.tags = input.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      } else if (field.type === "datetime-local") {
        payload[field.name] = input.value ? new Date(input.value).toISOString() : null;
      } else {
        payload[field.name] = input.value.trim() || null;
      }
    }

    if (section.key === "posts") {
      payload.slug = await makeUniquePostSlug(payload.title || "", recordId);
      const publishedInput = form.elements.namedItem("published");
      if (publishedInput.checked) {
        payload.published_at = original?.published_at || new Date().toISOString();
      } else {
        payload.published_at = null;
      }
    }

    for (const field of section.fields.filter((item) => item.type === "image" || item.type === "audio")) {
      const input = form.elements.namedItem(field.name);
      const file = input.files?.[0];
      if (!file) {
        if (field.required && !recordId) throw new Error("Choose an audio file for this sermon.");
        continue;
      }
      if (field.type === "audio" && !file.type.startsWith("audio/")) {
        throw new Error("Choose a valid audio file.");
      }
      if (field.type === "image") {
        if (!file.type.startsWith("image/")) throw new Error(`Choose a valid image for ${field.label.toLowerCase()}.`);
        const compressed = await resizeImage(file);
        payload[field.property] = await uploadFile(field.bucket, compressed, uploadStatus);
      } else if (file.size > RESUMABLE_AUDIO_THRESHOLD) {
        const cancelUpload = document.getElementById(form.dataset.cancelUploadButtonId);
        payload[field.property] = await uploadResumableAudio(
          field.bucket,
          file,
          uploadStatus,
          cancelUpload,
          form,
        );
      } else {
        payload[field.property] = await uploadFile(field.bucket, file, uploadStatus);
      }
    }

    if (recordId) {
      const { error } = await window.supabaseClient
        .from(section.table)
        .update(payload)
        .eq("id", recordId);
      if (error) throw error;
    } else {
      const { error } = await window.supabaseClient
        .from(section.table)
        .insert(payload);
      if (error) throw error;
    }

    resetEditor(section);
    setAdminStatus(status, recordId ? "Changes saved." : "New item added.", false);
    await loadAdminRecords(section, true);
  } catch (error) {
    console.error(`Could not save ${section.key}:`, error);
    setAdminStatus(status, getFriendlyAdminError(section, error), true);
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (uploadStatus) uploadStatus.textContent = "";
  }
}

async function makeUniquePostSlug(title, currentId) {
  const base = slugifyAdmin(title);
  if (!base) throw new Error("Add a post title so a link can be created.");
  let slug = base;
  let suffix = 2;
  while (true) {
    let query = window.supabaseClient.from("posts").select("id").eq("slug", slug);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data || data.id === currentId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function slugifyAdmin(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadResumableAudio(bucket, file, progressElement, cancelButton, form) {
  if (!window.tus?.Upload) {
    throw new Error("Resumable audio uploads are unavailable. Refresh the page and try again.");
  }

  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your session has expired. Sign in again to upload files.");
  }

  const safeName = file.name
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 100) || "upload";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const endpoint = "https://scrnhjrlzfaeihapxdsg.storage.supabase.co/storage/v1/upload/resumable";
  const upload = new window.tus.Upload(file, {
    endpoint,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    chunkSize: RESUMABLE_AUDIO_CHUNK_SIZE,
    uploadDataDuringCreation: true,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${data.session.access_token}`,
      "x-upsert": "false",
    },
    metadata: {
      bucketName: bucket,
      objectName: path,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    },
    onError(uploadError) {
      const state = activeResumableUploads.get(form);
      if (!state || state.settled) return;
      state.settled = true;
      activeResumableUploads.delete(form);
      if (cancelButton) cancelButton.hidden = true;
      console.error("Resumable audio upload failed:", uploadError);
      state.reject(new Error("The file upload could not be completed."));
    },
    onProgress(bytesUploaded, bytesTotal) {
      if (progressElement) {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        progressElement.textContent = `Uploading ${percentage}%…`;
      }
    },
    onSuccess() {
      const state = activeResumableUploads.get(form);
      if (!state || state.settled) return;
      state.settled = true;
      activeResumableUploads.delete(form);
      if (cancelButton) cancelButton.hidden = true;
      const { data: publicUrl } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(path);
      state.resolve(publicUrl.publicUrl);
    },
  });

  return new Promise((resolve, reject) => {
    const state = {
      settled: false,
      resolve,
      reject,
      cancel() {
        if (state.settled) return;
        state.settled = true;
        activeResumableUploads.delete(form);
        if (cancelButton) cancelButton.hidden = true;
        upload.abort(true).catch((abortError) => {
          console.warn("Could not terminate the cancelled resumable upload:", abortError);
        });
        reject(new Error("The file upload was cancelled."));
      },
    };
    activeResumableUploads.set(form, state);
    if (cancelButton) cancelButton.hidden = false;
    try {
      upload.start();
    } catch (uploadError) {
      state.settled = true;
      activeResumableUploads.delete(form);
      if (cancelButton) cancelButton.hidden = true;
      reject(uploadError);
    }
  });
}

async function uploadGalleryImages(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const files = form.elements.namedItem("images");
  const selectedFiles = [...(files?.files || [])];
  const status = document.getElementById("dashboard-status");
  const progress = document.getElementById("upload-status-gallery");
  const button = form.querySelector('button[type="submit"]');
  if (!selectedFiles.length || !status || !button) {
    setAdminStatus(status, "Choose at least one image.", true);
    return;
  }
  if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
    setAdminStatus(status, "Choose image files only.", true);
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  const album = String(form.elements.namedItem("album").value || "").trim();
  const caption = String(form.elements.namedItem("caption").value || "").trim();
  const takenOn = form.elements.namedItem("taken_on").value || null;
  let uploaded = 0;
  try {
    for (const file of selectedFiles) {
      if (progress) progress.textContent = `Preparing image ${uploaded + 1} of ${selectedFiles.length}…`;
      const resized = await resizeImage(file);
      const imageUrl = await uploadFile("images", resized, progress);
      const { error } = await window.supabaseClient.from("gallery").insert({
        image_url: imageUrl,
        caption: caption || null,
        album: album || null,
        taken_on: takenOn,
      });
      if (error) throw error;
      uploaded += 1;
    }
    form.reset();
    setAdminStatus(status, `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded.`, false);
    await loadAdminRecords(ADMIN_SECTIONS_ALL.find((item) => item.key === "gallery"), true);
  } catch (error) {
    console.error("Could not upload gallery photos:", error);
    setAdminStatus(
      status,
      uploaded
        ? `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded; the next photo could not be saved.`
        : "We could not upload those photos. Please try again.",
      true,
    );
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (progress) progress.textContent = "";
  }
}

async function resizeImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This image could not be prepared for upload.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const requestedType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("This image could not be compressed.")),
      requestedType,
      0.8,
    );
  });
  const outputType = blob.type === "image/webp" ? "image/webp" : "image/jpeg";
  const extension = outputType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${slugifyAdmin(file.name.replace(/\.[^.]+$/, "")) || "image"}.${extension}`, {
    type: outputType,
  });
}

async function uploadFile(bucket, file, progressElement) {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your session has expired. Sign in again to upload files.");
  }

  const safeName = file.name
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 100) || "upload";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    request.setRequestHeader("Authorization", `Bearer ${data.session.access_token}`);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (progressElement && event.lengthComputable) {
        progressElement.textContent = `Uploading ${Math.round((event.loaded / event.total) * 100)}%…`;
      }
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        console.error(`Storage upload failed (${request.status}):`, request.responseText);
        reject(new Error("The file upload was not accepted."));
        return;
      }
      const { data: publicUrl } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(path);
      resolve(publicUrl.publicUrl);
    });
    request.addEventListener("error", () => reject(new Error("The file upload could not connect.")));
    request.addEventListener("abort", () => reject(new Error("The file upload was cancelled.")));
    request.send(file);
  });
}

const adminRecordCache = new Map();
async function loadAdminRecords(section, force = false) {
  if (!section || !section.table) return;
  const host = document.getElementById(`records-${section.key}`);
  if (!host) return;
  host.replaceChildren(createAdminMessage("Loading…"));
  try {
    let query = window.supabaseClient
      .from(section.table)
      .select(section.columns)
      .limit(100);
    if (section.order === "sort_order") {
      query = query.order("sort_order", { ascending: true });
    } else {
      query = query.order(section.order || "created_at", { ascending: false, nullsFirst: false });
    }
    const { data, error } = await query;
    if (error) throw error;
    host.replaceChildren();
    (data || []).forEach((row) => {
      adminRecordCache.set(`${section.key}:${row.id}`, row);
      host.append(section.inbox ? createInboxCard(section, row) : createRecordCard(section, row));
    });
    if (!data?.length) host.append(createAdminMessage("Nothing here yet."));
    loadedAdminSections.add(section.key);
  } catch (error) {
    console.error(`Could not load ${section.key}:`, error);
    host.replaceChildren(createAdminMessage("We could not load this section. Please try again."));
    setGlobalStatus("Some information could not be loaded. Check your connection and try again.", true);
  }
}

function createRecordCard(section, row) {
  if (section.key === "gallery") return createGalleryAdminCard(section, row);
  const card = document.createElement("article");
  card.className = "admin-record";
  const heading = document.createElement("h3");
  heading.textContent = row.title || row.name || "Untitled item";
  const summary = document.createElement("p");
  summary.className = "admin-record-meta";
  summary.textContent = section.summary?.(row) || "";
  card.append(heading, summary);

  const fields = section.fields.filter((field) => !["image", "audio", "checkbox"].includes(field.type));
  fields.forEach((field) => {
    let value = row[field.name];
    if (field.name === "tags" && Array.isArray(value)) value = value.join(", ");
    if (value === null || value === undefined || value === "") return;
    const detail = document.createElement("p");
    detail.textContent = `${field.label}: ${String(value)}`;
    card.append(detail);
  });

  const actions = document.createElement("div");
  actions.className = "admin-record-actions";
  const edit = createAdminButton("Edit", "admin-button admin-button-secondary", "button");
  edit.addEventListener("click", () => populateEditor(section, row));
  const remove = createAdminButton("Delete", "admin-button admin-button-danger", "button");
  remove.addEventListener("click", () => deleteAdminRecord(section, row, remove));
  actions.append(edit, remove);
  card.append(actions);
  return card;
}

function createGalleryAdminCard(section, row) {
  const card = document.createElement("article");
  card.className = "admin-record";
  const image = document.createElement("img");
  image.src = safeAdminMediaUrl(row.image_url);
  image.alt = row.caption || "Gallery photo";
  image.loading = "lazy";
  image.width = 480;
  image.height = 320;
  image.style.width = "100%";
  image.style.maxHeight = "220px";
  image.style.objectFit = "cover";
  card.append(image);
  const heading = document.createElement("h3");
  heading.textContent = row.caption || row.album || "Gallery photo";
  const summary = document.createElement("p");
  summary.className = "admin-record-meta";
  summary.textContent = [row.album, row.taken_on, formatAdminDate(row.created_at)]
    .filter(Boolean)
    .join(" · ");
  card.append(heading, summary);
  const remove = createAdminButton("Delete", "admin-button admin-button-danger", "button");
  remove.addEventListener("click", () => deleteAdminRecord(section, row, remove));
  const actions = document.createElement("div");
  actions.className = "admin-record-actions";
  actions.append(remove);
  card.append(actions);
  return card;
}

function createInboxCard(section, row) {
  const inbox = ADMIN_INBOXES.find((item) => item.key === section.key);
  const card = document.createElement("article");
  card.className = "admin-record";
  const heading = document.createElement("h3");
  heading.textContent = inbox?.heading(row) || "Message";
  const summary = document.createElement("p");
  summary.className = "admin-record-meta";
  summary.textContent = inbox?.summary(row) || "";
  const body = document.createElement("p");
  body.textContent = inbox?.body(row) || "";
  card.append(heading, summary, body);
  const actions = document.createElement("div");
  actions.className = "admin-record-actions";
  if (section.key === "testimonies") {
    const approval = createAdminButton(
      row.approved ? "Unapprove" : "Approve",
      "admin-button admin-button-secondary",
      "button",
    );
    approval.addEventListener("click", () => setTestimonyApproval(row, !row.approved, approval));
    actions.append(approval);
  }
  const remove = createAdminButton("Delete", "admin-button admin-button-danger", "button");
  remove.addEventListener("click", () => deleteInboxRecord(section, row, remove));
  actions.append(remove);
  card.append(actions);
  return card;
}

function createAdminMessage(text) {
  const message = document.createElement("p");
  message.className = "admin-empty";
  message.textContent = text;
  return message;
}

function populateEditor(section, row) {
  const form = document.getElementById(`form-${section.key}`);
  if (!form) return;
  form.elements.namedItem("record_id").value = row.id;
  const heading = form.querySelector("h3");
  if (heading) heading.textContent = `Editing: ${row.title || row.name || "item"}`;
  section.fields.forEach((field) => {
    const input = form.elements.namedItem(field.name);
    if (!input) return;
    if (field.type === "checkbox") input.checked = Boolean(row[field.name]);
    else if (field.type === "image" || field.type === "audio") {
      const existing = document.getElementById(`${section.key}-current-${field.name}`);
      if (existing) {
        existing.replaceChildren();
        const url = row[field.property];
        if (url) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Open current file";
          existing.append(link);
          existing.hidden = false;
        } else existing.hidden = true;
      }
      input.required = false;
    } else if (field.type === "datetime-local") {
      input.value = toLocalDateTime(row[field.name]);
    } else if (field.type === "time") {
      input.value = String(row[field.name] || "").slice(0, 5);
    } else if (field.name === "tags" && Array.isArray(row[field.name])) {
      input.value = row[field.name].join(", ");
    } else {
      input.value = row[field.name] === null || row[field.name] === undefined
        ? ""
        : String(row[field.name]);
    }
  });
  document.getElementById(`cancel-${section.key}`).hidden = false;
  document.getElementById(`editor-${section.key}`).scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetEditor(section) {
  const form = document.getElementById(`form-${section.key}`);
  if (!form) return;
  form.reset();
  form.elements.namedItem("record_id").value = "";
  const heading = form.querySelector("h3");
  if (heading) heading.textContent = "Add new";
  section.fields.filter((field) => field.type === "image" || field.type === "audio").forEach((field) => {
    const input = form.elements.namedItem(field.name);
    if (input) input.required = Boolean(field.required);
    const existing = document.getElementById(`${section.key}-current-${field.name}`);
    if (existing) existing.hidden = true;
  });
  document.getElementById(`cancel-${section.key}`).hidden = true;
}

async function deleteAdminRecord(section, row, button) {
  if (!window.confirm(`Delete "${row.title || row.name || "this item"}"? This cannot be undone.`)) return;
  await deleteRecord(section, row, button);
}

async function deleteInboxRecord(section, row, button) {
  if (!window.confirm("Delete this message? This cannot be undone.")) return;
  await deleteRecord(section, row, button);
}

async function deleteRecord(section, row, button) {
  const status = document.getElementById("dashboard-status");
  if (button) button.disabled = true;
  try {
    const { error } = await window.supabaseClient.from(section.table).delete().eq("id", row.id);
    if (error) throw error;
    adminRecordCache.delete(`${section.key}:${row.id}`);
    setAdminStatus(status, "Item deleted.", false);
    await loadAdminRecords(section, true);
  } catch (error) {
    console.error(`Could not delete from ${section.table}:`, error);
    setAdminStatus(status, "We could not delete that item. Please try again.", true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function setTestimonyApproval(row, approved, button) {
  const status = document.getElementById("dashboard-status");
  if (button) button.disabled = true;
  try {
    const { error } = await window.supabaseClient
      .from("testimonies")
      .update({ approved })
      .eq("id", row.id);
    if (error) throw error;
    setAdminStatus(status, approved ? "Testimony approved." : "Testimony is no longer public.", false);
    await loadAdminRecords(ADMIN_SECTIONS_ALL.find((item) => item.key === "testimonies"), true);
  } catch (error) {
    console.error("Could not update testimony approval:", error);
    setAdminStatus(status, "We could not update that testimony. Please try again.", true);
  } finally {
    if (button) button.disabled = false;
  }
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatAdminDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function safeAdminMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "https:" || url.origin === window.location.origin
      ? url.href
      : "";
  } catch (error) {
    console.warn("Ignored an invalid admin media URL.", error);
    return "";
  }
}

function getFriendlyAdminError(section, error) {
  if (error instanceof Error && [
    "Choose an audio file for this sermon.",
    "Choose a valid audio file.",
    "This file upload was not accepted.",
    "The file upload was cancelled.",
    "Resumable audio uploads are unavailable. Refresh the page and try again.",
    "Your session has expired. Sign in again to upload files.",
  ].includes(error.message)) return error.message;
  if (section.key === "posts") return "We could not save this post. Check the title and try again.";
  if (section.key === "sermons") return "We could not save this sermon. Check the details and media files, then try again.";
  return "We could not save this item. Check the details and try again.";
}

async function withButtonBusy(button, status, message, action) {
  if (!(button instanceof HTMLButtonElement)) return action();
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  if (status && message) setAdminStatus(status, message, false);
  try {
    await action();
  } catch (error) {
    console.error("Admin action failed:", error);
    if (status) setAdminStatus(status, "This action could not be completed. Please try again.", true);
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function clearAdminStatus(status) {
  if (!status) return;
  status.textContent = "";
  status.classList.remove("admin-status-error", "admin-status-success");
}

function setAdminStatus(status, message, isError) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("admin-status-error", isError);
  status.classList.toggle("admin-status-success", !isError && Boolean(message));
}

function setGlobalStatus(message, isError) {
  setAdminStatus(document.getElementById("dashboard-status"), message, isError);
}
