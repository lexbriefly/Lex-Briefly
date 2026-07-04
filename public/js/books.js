document.addEventListener('DOMContentLoaded', () => {
    const btnBooks = document.getElementById('btnToggleBooks');
    const btnActs = document.getElementById('btnToggleActs');
    const booksContainer = document.getElementById('booksGridContainer');
    const actsContainer = document.getElementById('actsGridContainer');
    const search = document.getElementById('pageSearch');

    function showBooks() {
        booksContainer.classList.remove('hidden');
        actsContainer.classList.add('hidden');
        btnBooks.classList.add('bg-royal-blue', 'text-white-text', 'shadow-[0_0_20px_rgba(30,77,255,0.35)]');
        btnBooks.classList.remove('text-light-gray');
        btnActs.classList.remove('bg-royal-blue', 'text-white-text', 'shadow-[0_0_20px_rgba(30,77,255,0.35)]');
        btnActs.classList.add('text-light-gray');
    }
    function showActs() {
        actsContainer.classList.remove('hidden');
        booksContainer.classList.add('hidden');
        btnActs.classList.add('bg-royal-blue', 'text-white-text', 'shadow-[0_0_20px_rgba(30,77,255,0.35)]');
        btnActs.classList.remove('text-light-gray');
        btnBooks.classList.remove('bg-royal-blue', 'text-white-text', 'shadow-[0_0_20px_rgba(30,77,255,0.35)]');
        btnBooks.classList.add('text-light-gray');
    }

    if (btnBooks && btnActs) {
        btnBooks.addEventListener('click', showBooks);
        btnActs.addEventListener('click', showActs);
    }

    if (search) {
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            document.querySelectorAll('#cardGrid [data-name], #actsGrid [data-name]').forEach((card) => {
                const name = (card.getAttribute('data-name') || '').toLowerCase();
                card.style.display = name.includes(q) ? '' : 'none';
            });
        });
    }
});