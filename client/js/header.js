document.addEventListener("click", (e) => {
  if (e.target.closest(".menu-toggle")) {
    document.querySelector(".mobile-menu").classList.toggle("show");
  }
});