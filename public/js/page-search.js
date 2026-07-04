/* Filters the visible content cards on resource.html, cases.html,
   internship.html and news.html as the user types, matching against the
   data-name attribute set on each card. */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('pageSearch');
    const grid = document.getElementById('cardGrid');
    if (!input || !grid) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        const cards = grid.querySelectorAll('[data-name]');
        cards.forEach((card) => {
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            card.style.display = name.includes(q) ? '' : 'none';
        });
    });
});