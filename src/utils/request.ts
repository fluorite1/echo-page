import { ElMessage } from 'element-plus'
import type { RequestConfig } from '@/types'

export const urlRE = /(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/

export function requestRaw(options: RequestConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = 6000

    let url = getURL(options.url)
    if (options.method === 'GET') {
      url += `${getURLParam(options.data)}`
    }

    xhr.open(options.method, url)

    xhr.ontimeout = reject
    xhr.onerror = reject
    xhr.onload = (e) => {
      resolve((e.target as XMLHttpRequest).response)
    }

    xhr.send(JSON.stringify(getURLData(options.data, options.paramType)))
  })
}

export async function requestJSON(options: RequestConfig): Promise<any> {
  const text = await requestRaw(options)
  return JSON.parse(text)
}

function getURLParam(data?: Array<[string, string]>): string {
  if (!data) return ''

  let result = ''
  data.forEach((item) => {
    if (item[0]) {
      result += `&${item[0]}=${item[1]}`
    }
  })

  return result ? `?${result}` : ''
}

function getURLData(data?: Array<[string, string]>, paramType?: string): any {
  if (!data) return ''

  if (paramType === 'array') {
    return data
  }

  const result: Record<string, string> = {}
  data.forEach((item) => {
    if (item[0]) {
      result[item[0]] = item[1]
    }
  })

  return result
}

export function getURL(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`
}

/**
 * @param options 请求的相关参数
 * @param obj 需要修改的数据的父对象
 * @param key 需要修改的数据在父对象中对应的 key
 * @param responseType 需要修改的数据对应的类型
 * @returns 可以取消请求的函数
 */
export default function requestWrapper(
  options: RequestConfig,
  obj: any,
  key: string,
  responseType: 'object' | 'array' | 'string' = 'object'
): () => void {
  let count = 0
  let timer: number | undefined

  const url = options?.url
  if ((url && !/^\d+$/.test(url)) || urlRE.test(getURL(url))) {
    if (!options.series) {
      requestRaw(options)
        .then((data) => {
          if (responseType === 'object' || responseType === 'array') {
            obj[key] = JSON.parse(data)
          } else {
            obj[key] = data
          }
        })
        .catch((err) => ElMessage.error(err?.message || err))
    } else {
      timer = window.setInterval(() => {
        if (options.requestCount != 0 && options.requestCount && options.requestCount <= count) {
          clearInterval(timer)
          return
        }

        count++
        requestRaw(options)
          .then((data) => {
            if (responseType === 'object' || responseType === 'array') {
              obj[key] = JSON.parse(data)
            } else {
              obj[key] = data
            }
          })
          .catch((err) => ElMessage.error(err?.message || err))
      }, options.time)
    }
  }

  return function cancelRequest() {
    clearInterval(timer)
  }
}
