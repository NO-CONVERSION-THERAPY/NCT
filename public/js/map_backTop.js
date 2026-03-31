const backToTopButton = document.getElementById('backToTop');

if (backToTopButton) {
  // 下滑一定距离后再显示按钮，避免它一直遮住内容。
  window.addEventListener('scroll', () => {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      backToTopButton.style.display = 'block';
    } else {
      backToTopButton.style.display = 'none';
    }
  });

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
