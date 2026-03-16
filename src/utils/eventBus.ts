import mitt from 'mitt'

type Events = {
  move: [isDownward: boolean, isRightward: boolean]
  unmove: void
  'v-click': string
  'v-hover': string
  save: void
  preview: void
  clearCanvas: void
  componentClick: void
  runAnimation: void
  stopAnimation: void
  hideArea: void
}

export const eventBus = mitt<Events>()
