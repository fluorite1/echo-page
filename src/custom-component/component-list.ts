import type { Component } from '@/types'

export const commonStyle = {
  opacity: 1,
}

export const commonAttr = {
  animations: [],
  events: {},
  groupStyle: {},
  collapseName: 'style',
  triggerAnimations: {},
  subscriptions: [],
}

const list: Partial<Component>[] = [
  {
    component: 'VText',
    label: '文字',
    propValue: '双击编辑文字',
    icon: 'wenben',
    style: {
      width: 200,
      height: 28,
      top: 0,
      left: 0,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: '',
      color: '',
      padding: 4,
    },
  },
  {
    component: 'VButton',
    label: '按钮',
    propValue: '按钮',
    icon: 'button',
    style: {
      width: 100,
      height: 34,
      top: 0,
      left: 0,
      borderWidth: 1,
      borderColor: '',
      borderRadius: '',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: '',
      color: '',
      backgroundColor: '',
    },
  },
  {
    component: 'RectShape',
    label: '矩形',
    propValue: '&nbsp;',
    icon: 'juxing',
    style: {
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      borderWidth: 1,
      borderStyle: 'solid',
      backgroundColor: '',
      borderRadius: '',
    },
  },
  {
    component: 'CircleShape',
    label: '圆形',
    propValue: '&nbsp;',
    icon: 'circle',
    style: {
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
      borderColor: '#000',
      borderWidth: 1,
      borderStyle: 'solid',
      backgroundColor: '',
      borderRadius: '',
    },
  },
  {
    component: 'LineShape',
    label: '直线',
    propValue: '',
    icon: 'line',
    style: {
      width: 200,
      height: 2,
      top: 0,
      left: 0,
      backgroundColor: '#000',
    },
  },
  {
    component: 'Picture',
    label: '图片',
    icon: 'picture',
    propValue: {
      url: '',
      flip: {
        horizontal: false,
        vertical: false,
      },
    },
    style: {
      width: 300,
      height: 200,
      top: 0,
      left: 0,
      borderRadius: '',
    },
  },
  {
    component: 'VTable',
    label: '表格',
    icon: 'biaoge',
    propValue: {
      data: [
        ['表头1', '表头2', '表头3'],
        ['内容1', '内容2', '内容3'],
      ],
      stripe: true,
      thBold: true,
    },
    style: {
      width: 600,
      height: 200,
      top: 0,
      left: 0,
      fontSize: 14,
      fontWeight: 400,
      textAlign: 'center',
      color: '',
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
  },
  {
    component: 'VChart',
    label: '图表',
    icon: 'el-icon-data-analysis',
    propValue: {
      chart: 'VChart',
      option: {
        title: {
          text: '柱状图',
          show: true,
        },
        legend: {
          show: true,
        },
        tooltip: {
          show: true,
          trigger: 'item',
        },
        xAxis: {
          show: true,
          data: ['A', 'B', 'C', 'D', 'E'],
        },
        yAxis: {},
        series: {
          type: 'bar',
          name: '销量',
          data: [23, 61, 35, 77, 35],
          itemStyle: {
            barBorderRadius: 5,
            borderWidth: 1,
            borderType: 'solid',
            borderColor: '#73c0de',
            shadowColor: '#5470c6',
            shadowBlur: 3,
          },
        },
      },
    },
    style: {
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      fontSize: 14,
      fontWeight: 400,
      color: '',
    },
  },
]

for (let i = 0, len = list.length; i < len; i++) {
  const item = list[i]
  if (item && item.style) {
    item.style = { ...commonStyle, ...item.style }
  }
  if (item) {
    list[i] = { ...commonAttr, ...item } as any
  }
}

export default list as Component[]
