import * as BunnySDK from '@bunny.net/edgescript-sdk'
import { app } from './hono'


// eslint-disable-next-line no-console
console.log('Starting server...')
const listener = BunnySDK.net.tcp.unstable_new()
console.log('Listening on: ', BunnySDK.net.tcp.toString(listener))

BunnySDK.net.http.serve((req: Request): Response | Promise<Response> => {
  console.log(`[INFO]: ${req.method} - ${req.url}`)
  return app.fetch(req)
})
