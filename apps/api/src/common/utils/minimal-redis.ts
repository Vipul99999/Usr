import net from 'node:net'
import tls from 'node:tls'

export type RedisValue = string | number | null

type RedisConnectionConfig = {
  host: string
  port: number
  username?: string
  password?: string
  database: number
  tls: boolean
}

function encodeCommand(parts: string[]) {
  const chunks = [`*${parts.length}\r\n`]

  for (const part of parts) {
    chunks.push(`$${Buffer.byteLength(part)}\r\n${part}\r\n`)
  }

  return chunks.join('')
}

export function parseRedisUrl(value: string): RedisConnectionConfig {
  const url = new URL(value)

  return {
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'rediss:' ? 6380 : 6379)),
    username: url.username || undefined,
    password: url.password || undefined,
    database: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) || 0 : 0,
    tls: url.protocol === 'rediss:'
  }
}

function readLine(buffer: Buffer, start: number) {
  const end = buffer.indexOf('\r\n', start)
  if (end === -1) return null

  return {
    line: buffer.toString('utf8', start, end),
    nextOffset: end + 2
  }
}

function parseValue(buffer: Buffer, start = 0): { value: RedisValue; nextOffset: number } | null {
  if (start >= buffer.length) return null

  const prefix = String.fromCharCode(buffer[start])

  if (prefix === '+' || prefix === '-' || prefix === ':') {
    const line = readLine(buffer, start + 1)
    if (!line) return null

    if (prefix === '-') {
      throw new Error(line.line)
    }

    return {
      value: prefix === ':' ? Number(line.line) : line.line,
      nextOffset: line.nextOffset
    }
  }

  if (prefix === '$') {
    const line = readLine(buffer, start + 1)
    if (!line) return null

    const size = Number(line.line)
    if (size === -1) {
      return {
        value: null,
        nextOffset: line.nextOffset
      }
    }

    const end = line.nextOffset + size
    if (buffer.length < end + 2) return null

    return {
      value: buffer.toString('utf8', line.nextOffset, end),
      nextOffset: end + 2
    }
  }

  throw new Error(`Unsupported Redis response prefix: ${prefix}`)
}

export class MinimalRedisClient {
  constructor(private readonly config: RedisConnectionConfig) {}

  async execute(commands: string[][]) {
    const bootstrapCommands: string[][] = []

    if (this.config.password) {
      if (this.config.username) {
        bootstrapCommands.push(['AUTH', this.config.username, this.config.password])
      } else {
        bootstrapCommands.push(['AUTH', this.config.password])
      }
    }

    if (this.config.database > 0) {
      bootstrapCommands.push(['SELECT', String(this.config.database)])
    }

    const allCommands = [...bootstrapCommands, ...commands]

    return new Promise<RedisValue[]>((resolve, reject) => {
      const socket = this.config.tls
        ? tls.connect({
            host: this.config.host,
            port: this.config.port,
            servername: this.config.host
          })
        : net.createConnection({
            host: this.config.host,
            port: this.config.port
          })

      let buffer = Buffer.alloc(0)
      let parsedCount = 0
      const responses: RedisValue[] = []

      socket.once('error', (error) => {
        socket.destroy()
        reject(error)
      })

      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk])

        try {
          while (parsedCount < allCommands.length) {
            const parsed = parseValue(buffer)
            if (!parsed) break

            responses.push(parsed.value)
            buffer = buffer.subarray(parsed.nextOffset)
            parsedCount += 1
          }

          if (parsedCount === allCommands.length) {
            socket.end()
            resolve(responses.slice(bootstrapCommands.length))
          }
        } catch (error) {
          socket.destroy()
          reject(error)
        }
      })

      socket.once('connect', () => {
        const payload = allCommands.map((command) => encodeCommand(command)).join('')
        socket.write(payload)
      })
    })
  }

  async ping() {
    await this.execute([['PING']])
  }

  async get(key: string) {
    const [value] = await this.execute([['GET', key]])
    return typeof value === 'string' ? value : null
  }

  async setEx(key: string, ttlSeconds: number, value: string) {
    await this.execute([['SETEX', key, String(ttlSeconds), value]])
  }

  async set(key: string, value: string, options: Array<string | number> = []) {
    await this.execute([['SET', key, value, ...options.map(String)]])
  }

  async incr(key: string) {
    const [value] = await this.execute([['INCR', key]])
    return typeof value === 'number' ? value : Number(value || 0)
  }

  async expire(key: string, ttlSeconds: number) {
    await this.execute([['EXPIRE', key, String(ttlSeconds)]])
  }

  async del(key: string) {
    await this.execute([['DEL', key]])
  }
}
