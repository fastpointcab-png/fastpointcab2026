export const resetHomepageScroll = (behavior: ScrollBehavior = 'auto') => {
  const scrollingElement = document.scrollingElement;

  if (scrollingElement) {
    scrollingElement.scrollTo({ top: 0, left: 0, behavior });
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior });
};
