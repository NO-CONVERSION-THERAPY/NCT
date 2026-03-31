(() => {
    const languageSwitcher = document.getElementById('languageSwitcher');

    if (!languageSwitcher) {
        return;
    }

    languageSwitcher.addEventListener('change', () => {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('lang', languageSwitcher.value);
        window.location.href = nextUrl.toString();
    });
})();
