import * as BunnySDK from '@bunny.net/edgescript-sdk'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// eslint-disable-next-line no-console
console.log('Starting server...')
const listener = BunnySDK.net.tcp.unstable_new()
console.log('Listening on: ', BunnySDK.net.tcp.toString(listener))
BunnySDK.net.http.serve(async (req) => {
  // eslint-disable-next-line no-console
  console.log(`[INFO]: ${req.method} - ${req.url}`)
  await sleep(1)
  return new Response('blbl')
})
