import { getConnInfo } from 'hono/cloudflare-workers'
import { endTime, startTime } from 'hono/timing'
import * as project from '../__project__/project.json' // eslint-disable-line @typescript-eslint/no-unused-vars
import { getApp } from './app'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'

export const app = getApp({
  getConnInfo,
  fileLoaders: [routesLoader, loadProjectInfo],
  pageLoader: {
    loader: async ({ name, ctx }) => {
      const timingKey = `pageLoader:${name}`
      startTime(ctx, timingKey)
      const file = project.files as any
      endTime(ctx, timingKey)
      return file
    },
    urls: {
      pageStylesheetUrl: (name) => `/_static/${name}.css`,
      customCodeUrl: (name) => `/_static/cc_${name}.js`,
    },
  },
})
