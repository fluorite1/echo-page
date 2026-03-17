import mitt from 'mitt'

type Events = {
  move: [isDownward: boolean, isRightward: boolean]
  unmove: void
}

export const eventBus = mitt<Events>()
