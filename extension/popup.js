const STORAGE_FIELDS = [
  "apiUrl",
  "token",
  "firstName",
  "lastName",
  "email",
  "phone",
  "currentJobTitle",
  "linkedinProfileUrl"
];

const $ = (id) => document.getElementById(id);

const result = $("result");
const detectButton = $("detect");
const importButton = $("import");

function setResult(message, type = "muted") {
  result.textContent = message;
  result.className = type;
}

function getValues() {
  return {
    apiUrl: $("apiUrl").value.trim(),
    token: $("token").value.trim(),
    firstName: $("firstName").value.trim(),
    lastName: $("lastName").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    currentJobTitle: $("currentJobTitle").value.trim(),
    linkedinProfileUrl: $("linkedinProfileUrl").value.trim()
  };
}

function setValues(values) {
  for (const [key, value] of Object.entries(values)) {
    const element = $(key);

    if (element && value !== undefined && value !== null) {
      element.value = value;
    }
  }
}

function saveValues() {
  const values = getValues();

  chrome.storage.local.set(values);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tabs.length || !tabs[0].id) {
    throw new Error("Could not find the active browser tab.");
  }

  return tabs[0];
}

/*
 * This function runs inside the currently active tab.
 *
 * It intentionally reads only visible profile information from
 * the currently opened LinkedIn profile page.
 */
function extractLinkedInProfile() {
  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const visible = (element) => {
    if (!element) return false;

    const style = window.getComputedStyle(element);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      element.getBoundingClientRect().width > 0 &&
      element.getBoundingClientRect().height > 0
    );
  };

  const text = (element) => {
    if (!element || !visible(element)) return "";
    return normalize(element.innerText || element.textContent || "");
  };

  const isLinkedInProfile =
    location.hostname === "www.linkedin.com" &&
    /^\/in\/[^/]+/i.test(location.pathname);

  if (!isLinkedInProfile) {
    return {
      ok: false,
      error: "Please open a LinkedIn profile page first."
    };
  }

  const profileUrl =
    `${location.origin}${location.pathname}`.replace(/\/+$/, "");

  /*
   * LinkedIn changes CSS classes frequently, so use several
   * selectors and semantic fallbacks rather than relying on
   * one generated class name.
   */

  const firstHeading =
    Array.from(document.querySelectorAll("h1"))
      .map(text)
      .find(Boolean) || "";

  let firstName = "";
  let lastName = "";

  if (firstHeading) {
    const parts = firstHeading.split(/\s+/).filter(Boolean);

    firstName = parts.shift() || "";
    lastName = parts.join(" ");
  }

  /*
   * Current headline/title.
   */
  const titleCandidates = [
    '[data-generated-suggestion-target]',
    '.text-body-medium',
    '.text-body-small',
    'div[class*="text-body-medium"]',
    'div[class*="text-body-small"]'
  ];

  let currentJobTitle = "";

  for (const selector of titleCandidates) {
    const candidates = Array.from(
      document.querySelectorAll(selector)
    )
      .map(text)
      .filter(Boolean);

    const candidate = candidates.find((value) => {
      if (!value) return false;
      if (value === firstHeading) return false;
      if (value.length > 180) return false;
      return true;
    });

    if (candidate) {
      currentJobTitle = candidate;
      break;
    }
  }

  /*
   * Fallback: inspect elements close to the main profile heading.
   */
  if (!currentJobTitle && firstHeading) {
    const heading = Array.from(document.querySelectorAll("h1"))
      .find((element) => text(element) === firstHeading);

    if (heading) {
      let parent = heading.parentElement;

      for (let depth = 0; depth < 5 && parent; depth++) {
        const candidates = Array.from(
          parent.querySelectorAll("div, span")
        )
          .map(text)
          .filter(Boolean)
          .filter((value) =>
            value !== firstHeading &&
            value.length >= 2 &&
            value.length <= 180
          );

        if (candidates.length) {
          currentJobTitle = candidates[0];
          break;
        }

        parent = parent.parentElement;
      }
    }
  }

  /*
   * Email and phone are intentionally taken only if they are
   * already visible in the current page DOM.
   *
   * We do not access cookies, local storage, private APIs,
   * authentication tokens, or hidden network endpoints.
   */
  let email = "";

  const emailLink = Array.from(
    document.querySelectorAll('a[href^="mailto:"]')
  ).find(visible);

  if (emailLink) {
    email =
      normalize(emailLink.getAttribute("href")?.replace(/^mailto:/i, "")) ||
      text(emailLink);
  }

  if (!email) {
    const emailPattern =
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

    const bodyText = text(document.body);
    const match = bodyText.match(emailPattern);

    if (match) {
      email = match[0];
    }
  }

  let phone = "";

  const phoneLink = Array.from(
    document.querySelectorAll('a[href^="tel:"]')
  ).find(visible);

  if (phoneLink) {
    phone =
      normalize(phoneLink.getAttribute("href")?.replace(/^tel:/i, "")) ||
      text(phoneLink);
  }

  if (!phone) {
    const phonePattern =
      /(?:\+?\d[\d\s().-]{7,}\d)/;

    const bodyText = text(document.body);
    const match = bodyText.match(phonePattern);

    if (match) {
      phone = normalize(match[0]);
    }
  }

  return {
    ok: true,
    profile: {
      firstName,
      lastName,
      email,
      phone,
      currentJobTitle,
      linkedinProfileUrl: profileUrl
    }
  };
}

async function detectProfile() {
  detectButton.disabled = true;
  importButton.disabled = true;

  setResult("Detecting LinkedIn profile...", "muted");

  try {
    const tab = await getActiveTab();

    if (!tab.url || !/^https:\/\/(www\.)?linkedin\.com\/in\//i.test(tab.url)) {
      throw new Error(
        "Open a LinkedIn profile page (/in/...) before detecting a candidate."
      );
    }

    const execution = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      func: extractLinkedInProfile
    });

    const extracted = execution?.[0]?.result;

    if (!extracted?.ok) {
      throw new Error(
        extracted?.error || "Could not detect the LinkedIn profile."
      );
    }

    setValues(extracted.profile);
    saveValues();

    const name = [
      extracted.profile.firstName,
      extracted.profile.lastName
    ]
      .filter(Boolean)
      .join(" ");

    if (!name && !extracted.profile.currentJobTitle) {
      setResult(
        "Profile detected, but LinkedIn did not expose enough visible information. You can enter the fields manually.",
        "muted"
      );
    } else {
      setResult(
        `Detected ${name || "candidate"}.\nReview the information, then click Import Candidate.`,
        "success"
      );
    }

    importButton.disabled = false;

  } catch (error) {
    console.error(error);

    setResult(
      error?.message || "Could not detect the LinkedIn profile.",
      "error"
    );

  } finally {
    detectButton.disabled = false;
  }
}

async function importCandidate() {
  const values = getValues();

  if (!values.apiUrl) {
    setResult("Enter your HireX API URL.", "error");
    return;
  }

  if (!values.token) {
    setResult("Enter your HireX bearer token.", "error");
    return;
  }

  if (
    !values.email &&
    !values.phone &&
    !values.linkedinProfileUrl
  ) {
    setResult(
      "A LinkedIn profile URL, email, or phone number is required.",
      "error"
    );
    return;
  }

  saveValues();

  importButton.disabled = true;
  detectButton.disabled = true;

  setResult("Importing candidate into HireX...", "muted");

  try {
    const endpoint =
      `${values.apiUrl.replace(/\/$/, "")}` +
      `/api/integrations/linkedin/import`;

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${values.token}`
      },

      body: JSON.stringify({
        source: "user-selected",

        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          currentJobTitle: values.currentJobTitle,
          linkedinProfileUrl: values.linkedinProfileUrl
        }
      })
    });

    let body;

    try {
      body = await response.json();
    } catch {
      body = {};
    }

    if (!response.ok) {
      throw new Error(
        body?.error ||
        `HireX returned HTTP ${response.status}.`
      );
    }

    const candidate = body?.candidate || {};

    const candidateNumber =
      candidate.candidate_id ||
      candidate.Candidate_ID ||
      candidate.id ||
      "candidate";

    const action =
      body.created === false
        ? "updated"
        : "created";

    setResult(
      `Candidate ${action} successfully.\nCandidate: ${candidateNumber}`,
      "success"
    );

  } catch (error) {
    console.error(error);

    setResult(
      error?.message || "Could not import the candidate.",
      "error"
    );

  } finally {
    importButton.disabled = false;
    detectButton.disabled = false;
  }
}

/*
 * Load previously saved HireX connection settings and
 * previously detected candidate data.
 */
chrome.storage.local.get(STORAGE_FIELDS, (saved) => {
  setValues(saved || {});

  /*
   * Automatically attempt detection when the popup opens.
   * The recruiter still reviews the data and explicitly clicks
   * Import Candidate.
   */
  detectProfile();
});

detectButton.addEventListener("click", detectProfile);
importButton.addEventListener("click", importCandidate);
