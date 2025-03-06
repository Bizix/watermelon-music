import { ref, onMounted, onUnmounted } from "vue";

export default function useScrollIndicator() {
  const showScrollIndicator = ref(true);
  const songList = ref<HTMLElement | null>(null);

  function checkScroll() {
    if (songList.value) {
      const isAtBottom = Math.abs(songList.value.scrollTop + songList.value.clientHeight - songList.value.scrollHeight) < 2;
      showScrollIndicator.value = !isAtBottom;
    }
  }

  onMounted(() => {
    if (songList.value) {
      songList.value.addEventListener("scroll", checkScroll);
    }
  });

  onUnmounted(() => {
    if (songList.value) {
      songList.value.removeEventListener("scroll", checkScroll);
    }
  });

  return { showScrollIndicator, checkScroll, songList };
}
