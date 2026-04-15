import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

export default function useScrollIndicator(scrollElementRef: any) {
  const showScrollIndicator = ref(true);
  let activeElement: HTMLElement | null = null;

  function checkScroll() {
    if (scrollElementRef.value) {
      const isAtBottom = Math.abs(
        scrollElementRef.value.scrollTop +
          scrollElementRef.value.clientHeight -
          scrollElementRef.value.scrollHeight
      ) < 2;
      showScrollIndicator.value = !isAtBottom;
    }
  }

  function detachListener() {
    if (activeElement) {
      activeElement.removeEventListener("scroll", checkScroll);
      activeElement = null;
    }
  }

  async function bindListener() {
    await nextTick();
    detachListener();

    const currentElement = scrollElementRef.value;
    if (currentElement) {
      activeElement = currentElement;
      currentElement.addEventListener("scroll", checkScroll, { passive: true });
    }

    checkScroll();
  }

  watch(scrollElementRef, () => {
    bindListener();
  });

  onMounted(() => {
    bindListener();
    window.addEventListener("resize", checkScroll);
  });

  onUnmounted(() => {
    detachListener();
    window.removeEventListener("resize", checkScroll);
  });

  return { showScrollIndicator, checkScroll };
}
