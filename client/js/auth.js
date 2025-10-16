// client/js/auth.js
window.authInit = async function () {
  const join = document.getElementById("join-link");
  const dashboard = document.getElementById("dashboard-link");
  const joinMobile = document.getElementById("join-link-mobile");
  const dashboardMobile = document.getElementById("dashboard-link-mobile");
  try {
    const res = await fetch("/api/auth/check", { credentials: "include" });
    if (res.ok) {
      if (join) join.style.display = "none";
      if (dashboard) dashboard.style.display = "inline-block";
      if (joinMobile) joinMobile.style.display = "none";
      if (dashboardMobile) dashboardMobile.style.display = "block";
    } else {
      // logged out
      if (join) join.style.display = "inline-block";
      if (dashboard) dashboard.style.display = "none";
      if (joinMobile) joinMobile.style.display = "block";
      if (dashboardMobile) dashboardMobile.style.display = "none";
    }
  } catch (e) {
    // on error, default to logged-out state
    if (join) join.style.display = "inline-block";
    if (dashboard) dashboard.style.display = "none";
    if (joinMobile) joinMobile.style.display = "block";
    if (dashboardMobile) dashboardMobile.style.display = "none";
  }
};

// In case some pages already have the header present on load:
document.addEventListener("DOMContentLoaded", () => {
  const hasTargets =
    document.getElementById("join-link") ||
    document.getElementById("dashboard-link") ||
    document.getElementById("join-link-mobile") ||
    document.getElementById("dashboard-link-mobile");
  if (hasTargets) window.authInit();
});
