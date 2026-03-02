<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="logout-icon"
    :class="{ 'logout-icon-hover': hover }"
  >
    <!-- Door/Exit Frame -->
    <path
      d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Door Opening -->
    <path
      d="M16 17L21 12L16 7"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Arrow Line -->
    <path
      d="M21 12H9"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 20
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  hover: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.logout-icon {
  transition: all 0.2s ease;
  display: inline-block;
  vertical-align: middle;
}

.logout-icon-hover {
  transform: translateX(2px);
}

.logout-icon:hover {
  transform: translateX(2px);
}
</style>

