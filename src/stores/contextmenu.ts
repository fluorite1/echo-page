import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContextMenuStore = defineStore('contextmenu', () => {
  const menuTop = ref(0)
  const menuLeft = ref(0)
  const menuShow = ref(false)

  function showContextMenu(position: { top: number; left: number }) {
    menuTop.value = position.top
    menuLeft.value = position.left
    menuShow.value = true
  }

  function hideContextMenu() {
    menuShow.value = false
  }

  return {
    menuTop,
    menuLeft,
    menuShow,
    showContextMenu,
    hideContextMenu,
  }
})
