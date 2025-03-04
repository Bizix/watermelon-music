<template>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-bar"></div>
      <p class="text-center mt-2">{{ message }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      isLoading: {
        type: Boolean,
        required: true,
      },
      message: {
        type: String,
        default: "Fetching latest rankings, please wait...",
      },
    },
  };
  </script>
  
  <style>
  .loading-container {
    text-align: center;
    margin-top: 20px;
  }
  
  .loading-bar {
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #00d202, #ffffff);
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { width: 0; }
    100% { width: 100%; }
  }
  </style>
  