document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.toggle-all').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = this.closest('section');
      var details = section.querySelectorAll('details.faq');
      var allOpen = Array.from(details).every(function (d) { return d.open; });
      details.forEach(function (d) { d.open = !allOpen; });
      this.textContent = allOpen ? 'Expand all' : 'Collapse all';
    });
  });
});