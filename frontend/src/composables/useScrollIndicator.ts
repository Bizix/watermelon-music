import { ref, onMounted, onUnmounted } from "vue";

export default function useScrollIndicator(scrollElementRef: any) {
  const showScrollIndicator = ref(true);

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

  onMounted(() => {
    if (scrollElementRef.value) {
      scrollElementRef.value.addEventListener("scroll", checkScroll);
      checkScroll(); // ✅ Initial check
    }
  });

  onUnmounted(() => {
    if (scrollElementRef.value) {
      scrollElementRef.value.removeEventListener("scroll", checkScroll);
    }
  });

  return { showScrollIndicator, checkScroll };
}

