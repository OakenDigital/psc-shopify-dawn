// Mega menu third-level navigation handler
document.addEventListener('DOMContentLoaded', function () {
  const megaMenuLinks = document.querySelectorAll('.mega-menu__link--expandable');

  megaMenuLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const submenuId = this.getAttribute('data-submenu-id');
      const submenuPanel = document.getElementById(submenuId);
      const contentArea = this.closest('.mega-menu__wrapper').querySelector('.mega-menu__content-area');
      const featuredArea = contentArea.querySelector('.mega-menu__featured');
      const allSubmenus = contentArea.querySelectorAll('.mega-menu__submenu-panel');
      const allLinks = this.closest('.mega-menu__list').querySelectorAll('.mega-menu__link--level-2');

      // Remove active class from all links
      allLinks.forEach((l) => l.classList.remove('mega-menu__link--selected'));

      // Add active class to clicked link
      this.classList.add('mega-menu__link--selected');

      // Hide all submenus and featured content
      allSubmenus.forEach((panel) => (panel.style.display = 'none'));
      featuredArea.style.display = 'none';

      // Show the selected submenu
      if (submenuPanel) {
        submenuPanel.style.display = 'block';
      }
    });
  });

  // Reset to featured content when mega menu closes
  document.querySelectorAll('.mega-menu').forEach((menu) => {
    menu.addEventListener('toggle', function (e) {
      if (!this.open) {
        const contentArea = this.querySelector('.mega-menu__content-area');
        if (contentArea) {
          const featuredArea = contentArea.querySelector('.mega-menu__featured');
          const allSubmenus = contentArea.querySelectorAll('.mega-menu__submenu-panel');
          const allLinks = this.querySelector('.mega-menu__list').querySelectorAll('.mega-menu__link--level-2');

          // Hide all submenus
          allSubmenus.forEach((panel) => (panel.style.display = 'none'));
          // Show featured content
          if (featuredArea) featuredArea.style.display = 'flex';
          // Remove selected state from links
          allLinks.forEach((l) => l.classList.remove('mega-menu__link--selected'));
        }
      }
    });
  });
});
