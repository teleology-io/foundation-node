import axios from 'axios';
import { w3cwebsocket as Websocket } from 'websocket';

interface ResolvedVariable {
  id: string
  name: string
  value: any
}

interface VariableCache {
  [index: string]: ResolvedVariable
}

export function Foundation({ url, apiKey, uid: globalUid }: {
  url: string
  apiKey: string
  uid?: string
}) {
  let config: object | undefined
  let environment: object | undefined
  let variables: VariableCache = {}
  let callback: (event?: string, data?: any) => void

  const socketUrl = `${url}/v1/realtime?apiKey=${apiKey}`.replace("http", "ws")
  const client = axios.create({
    baseURL: url,
    headers: {
      ['X-Api-Key']: apiKey
    },
  })

  async function getEnvironment() {
    if (!environment) {
      environment = await client({
        url: '/v1/environment',
        method: 'get'
      }).then((res) => res.data).catch(error => {
        if (error.response) {
          throw new Error(JSON.stringify(error.response.data))
        } else {
          throw error
        }
      })
    }

    return environment
  }

  async function getConfiguration() {
    if (!config) {
      const result: any = await client({
        url: '/v1/configuration',
        method: 'get'
      }).then((res) => res.data).catch(error => {
        if (error.response) {
          throw new Error(JSON.stringify(error.response.data))
        } else {
          throw error
        }
      })

      if (result?.mime_type === 'application/json') {
        config = JSON.parse(result.content)
      } else {
        config = result?.content
      }
    }

    return config
  }

  async function getVariable({ name, uid, fallback }: { name: string, uid?: string, fallback?: any }) {
    const found = variables[name]
    if (found) {
      return found.value
    }

    const result: ResolvedVariable = await client({
      url: '/v1/variable',
      method: 'post',
      data: {
        name,
        uid: uid || globalUid
      }
    }).then((res) => res.data).catch(error => {
      // not found for variable only, this is because we can use a fallback
      if (error?.response?.status === 404) return undefined;

      if (error.response) {
        throw new Error(JSON.stringify(error.response.data))
      } else {
        throw error
      }
    })

    if (result) {
      variables[name] = result;
      return result.value
    }

    return fallback
  }

  function subscribe(cb: (event?: string, data?: any) => void) {
    callback = cb
  }

  function realtime(callback: (data?: any) => void) {
    const ws = new Websocket(socketUrl)

    ws.onerror = () => ws.close()

    ws.onclose = () => {
      setTimeout(() => realtime(callback), 1000)
    }

    ws.onmessage = function (e) {
      if (typeof e.data === 'string') {
        try {
          callback(JSON.parse(e?.data))
        } catch (err) {
          callback(e.data)
        }
      }
    }
  }

  realtime(async (data: any) => {
    switch (data?.type) {
      case 'variable.updated': {
        const name = data.payload.name

        delete variables[name];
        await getVariable(data?.payload?.name)

        callback && callback(data.type, variables[name])
        break;
      }
      case 'configuration.published': {
        config = undefined

        callback && callback(data.type, await getConfiguration())
        break;
      }
      case 'environment.updated': {
        environment = undefined;

        callback && callback(data.type, await getEnvironment())
        break;
      }
    }
  })

  return {
    getConfiguration,
    getEnvironment,
    getVariable,
    subscribe,
  }
}
