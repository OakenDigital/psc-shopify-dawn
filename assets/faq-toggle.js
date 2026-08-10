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
// FAQ Search
var searchInput = document.getElementById('faqSearchInput');
var searchWrap = document.getElementById('faqSearchWrap');
var searchStatus = document.getElementById('faqSearchStatus');
var searchClear = document.getElementById('faqSearchClear');
var noResults = document.getElementById('faqNoResults');

if (searchInput) {
  searchInput.addEventListener('input', function () {
    var query = this.value.trim().toLowerCase();
    searchWrap.classList.toggle('has-value', query.length > 0);

    var totalVisible = 0;

    document.querySelectorAll('details.faq').forEach(function (detail) {
      var text = detail.textContent.toLowerCase();
      var match = !query || text.includes(query);
      detail.classList.toggle('is-hidden-by-search', !match);
      if (match) totalVisible++;
    });

    document.querySelectorAll('section').forEach(function (section) {
      var visibleFaqs = section.querySelectorAll('details.faq:not(.is-hidden-by-search)');
      section.classList.toggle('is-hidden-by-search', visibleFaqs.length === 0);
    });

    if (query) {
      searchStatus.innerHTML = 'Showing <strong>' + totalVisible + '</strong> result' + (totalVisible !== 1 ? 's' : '') + ' for "<strong>' + query + '</strong>"';
    } else {
      searchStatus.textContent = '';
    }

    noResults.classList.toggle('is-visible', totalVisible === 0 && query.length > 0);
  });

  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  }
}
