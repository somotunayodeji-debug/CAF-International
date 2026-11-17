// Replace this with the church's WhatsApp group invitation link when ready.
const PHASE5_WHATSAPP_GROUP_URL = "";
const FORM_SUBMISSION_COOLDOWN_MS = 60 * 1000;
const FORM_MINIMUM_TIME_MS = 3000;

const PUBLIC_FORM_CONFIG = {
  prayer: {
    table: "prayer_requests",
    success: "Thank you. Your prayer request has been sent privately.",
    failure: "We could not send your request right now. Please try again later.",
    fields: {
      name: { max: 100 },
      contact: { max: 200 },
      request: { max: 2000, required: true },
    },
  },
  testimony: {
    table: "testimonies",
    success: "Thank you for sharing. Your testimony has been sent for review.",
    failure: "We could not send your testimony right now. Please try again later.",
    fields: {
      name: { max: 100 },
      testimony: { max: 2000, required: true },
    },
  },
  "first-timer": {
    table: "first_timers",
    success: "Thank you for introducing yourself. We are glad you visited.",
    failure: "We could not send your details right now. Please try again later.",
    fields: {
      name: { max: 100, required: true },
      phone: { max: 50, required: true },
      email: { max: 254, type: "email" },
      how_heard: { max: 200 },
    },
  },
  contact: {
    table: "contact_messages",
    success: "Thank you. Your message has been sent to the church.",
    failure: "We could not send your message right now. Please try again later.",
    fields: {
      name: { max: 100, required: true },
      contact: { max: 200, required: true },
      message: { max: 2000, required: true },
    },
  },
};

document.addEventListener("DOMContentLoaded", () => {
  configureWhatsAppGroupLink();
  document.querySelectorAll(".connect-form[data-form-kind]").forEach((form) => {
    form.dataset.openedAt = String(Date.now());
    form.addEventListener("submit", handlePublicFormSubmit);
  });
});

function configureWhatsAppGroupLink() {
  const link = document.getElementById("whatsapp-group-link");
  const placeholder = document.getElementById("whatsapp-group-placeholder");
  if (!link || !placeholder) return;

  const groupUrl = safeWhatsAppGroupUrl(PHASE5_WHATSAPP_GROUP_URL);
  if (!groupUrl) return;

  link.href = groupUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = false;
  placeholder.hidden = true;
}

function safeWhatsAppGroupUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "chat.whatsapp.com"
      ? url.href
      : "";
  } catch (error) {
    console.warn("The configured WhatsApp group URL is invalid.", error);
    return "";
  }
}

async function handlePublicFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  const kind = form.dataset.formKind;
  const config = PUBLIC_FORM_CONFIG[kind];
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  if (!config || !(submitButton instanceof HTMLButtonElement) || !status) return;

  clearFormStatus(status);
  const values = readAndValidateForm(form, config);
  if (values.error) {
    showFormStatus(status, values.error, true);
    return;
  }

  const honeypot = form.elements.namedItem("website");
  if (honeypot instanceof HTMLInputElement && honeypot.value.trim()) {
    form.reset();
    showFormStatus(status, config.success, false);
    return;
  }

  const openedAt = Number(form.dataset.openedAt);
  if (!Number.isFinite(openedAt) || Date.now() - openedAt < FORM_MINIMUM_TIME_MS) {
    showFormStatus(status, "Please wait a moment before sending your message.", true);
    return;
  }

  const cooldown = readFormCooldown(kind);
  if (cooldown.error) {
    showFormStatus(status, "Please wait before sending another message from this form.", true);
    return;
  }
  if (cooldown.remaining > 0) {
    showFormStatus(
      status,
      `Please wait ${Math.ceil(cooldown.remaining / 1000)} seconds before sending another message.`,
      true,
    );
    return;
  }

  if (!window.supabaseClient) {
    showFormStatus(status, "The connection is temporarily unavailable. Please try again later.", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  showFormStatus(status, "Sending your message…", false);

  try {
    const payload = buildFormPayload(kind, values.data, form);
    const { error } = await window.supabaseClient
      .from(config.table)
      .insert(payload);
    if (error) {
      console.error(`Public ${kind} form submission failed:`, error.message);
      showFormStatus(status, config.failure, true);
      return;
    }

    saveFormCooldown(kind);
    form.reset();
    form.dataset.openedAt = String(Date.now());
    showFormStatus(status, config.success, false);
  } catch (error) {
    console.error(`Public ${kind} form submission failed:`, error);
    showFormStatus(status, config.failure, true);
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
  }
}

function readAndValidateForm(form, config) {
  const data = {};
  for (const [name, rules] of Object.entries(config.fields)) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return { error: "This form is incomplete. Please refresh the page and try again." };
    }

    const value = field.value.trim();
    if (rules.required && !value) {
      field.focus();
      return { error: "Please complete all required fields." };
    }
    if (value.length > rules.max) {
      field.focus();
      return { error: `Please keep ${field.labels?.[0]?.textContent?.trim() || "this field"} to ${rules.max} characters or fewer.` };
    }
    if (rules.type === "email" && value && !isValidEmail(value)) {
      field.focus();
      return { error: "Please enter a valid email address." };
    }
    data[name] = value || null;
  }
  return { data };
}

function buildFormPayload(kind, data, form) {
  if (kind === "prayer") return { ...data, is_private: true };
  if (kind === "testimony") return { ...data, approved: false };
  if (kind === "first-timer") {
    const followup = form.elements.namedItem("wants_followup");
    return {
      ...data,
      wants_followup: followup instanceof HTMLInputElement && followup.checked,
    };
  }
  return data;
}

function isValidEmail(value) {
  return value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readFormCooldown(kind) {
  try {
    const lastSubmittedAt = Number(localStorage.getItem(`public-form-${kind}-submitted`));
    if (!Number.isFinite(lastSubmittedAt) || lastSubmittedAt <= 0) {
      return { remaining: 0, error: false };
    }
    const remaining = FORM_SUBMISSION_COOLDOWN_MS - (Date.now() - lastSubmittedAt);
    return { remaining: Math.max(0, remaining), error: false };
  } catch (error) {
    console.warn("Could not check the form submission cooldown.", error);
    return { remaining: 0, error: true };
  }
}

function saveFormCooldown(kind) {
  try {
    localStorage.setItem(`public-form-${kind}-submitted`, String(Date.now()));
  } catch (error) {
    console.warn("Could not save the form submission cooldown.", error);
  }
}

function clearFormStatus(status) {
  status.textContent = "";
  status.classList.remove("form-status-error", "form-status-success");
}

function showFormStatus(status, message, isError) {
  status.textContent = message;
  status.classList.toggle("form-status-error", isError);
  status.classList.toggle("form-status-success", !isError && Boolean(message));
}
