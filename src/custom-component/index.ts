import { defineAsyncComponent, type App } from 'vue'

const componentNames = ['VText', 'VButton', 'RectShape', 'CircleShape', 'LineShape', 'Picture', 'VTable', 'VChart'] as const

export default {
  install(app: App) {
    componentNames.forEach((key) => {
      app.component(
        key,
        defineAsyncComponent(() => import(`@/custom-component/${key}/Component.vue`)),
      )
      app.component(
        `${key}Attr`,
        defineAsyncComponent(() => import(`@/custom-component/${key}/Attr.vue`)),
      )
    })
  },
}
