import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import { getConnInfo } from 'hono/cloudflare-workers'
import { createMiddleware } from 'hono/factory'
import * as project from '../__project__/project.json'
import type { HonoProject, HonoRoutes, PreviewHonoEnv } from '../hono'
import { getApp } from './app'
import { customCode } from './routes/preview.customCode'
import { stylesheetHandler } from './routes/preview.stylesheet'

type PreviewData = HonoRoutes &
  HonoProject & {
    files: ProjectFiles
  }

let projectLoadTime: Date | undefined
let projectLoader: Promise<PreviewData> | null = null
const loadProject = ({ branchName }: { branchName: string }) => {
  if (
    projectLoader &&
    // Reload the project if it's older than 10 seconds
    projectLoadTime?.getTime() &&
    Date.now() - projectLoadTime.getTime() < 1000 * 10
  ) {
    return projectLoader
  }
  projectLoadTime = new Date()
  // eslint-disable-next-line no-async-promise-executor
  projectLoader = new Promise(async (resolve) => {
    const jsonProject = project as any
    // Load files from Durable Object
    const { routes } = splitRoutes({
      branchName,
      files: jsonProject.files,
      project: jsonProject.project,
    })
    resolve({
      routes,
      project: jsonProject.project,
      config: jsonProject.files.config,
      files: jsonProject.files,
    })
  })
  return projectLoader
}

export const app = getApp({
  getConnInfo,
  stylesheetRouter: {
    path: '/.toddle/stylesheet/:pageName{.+.css}',
    handler: stylesheetHandler,
  },
  customCodeRouter: {
    path: '/.toddle/custom-code/:pageName{.+.js}',
    handler: customCode,
  },
  pageLoader: {
    loader: ({ ctx }) => {
      return { customCode: true, ...ctx.get('files') }
    },
    urls: {
      pageStylesheetUrl: (name: string) => `/.toddle/stylesheet/${name}.css`,
      customCodeUrl: (name: string) => `/.toddle/custom-code/${name}.js`,
    },
  },
  fileLoaders: [
    createMiddleware<
      PreviewHonoEnv<HonoRoutes & HonoProject & { files: ProjectFiles }>
    >(async (ctx, next) => {
      try {
        const fullProject = await loadProject({
          branchName: 'main',
        })
        ctx.set('routes', fullProject.routes)
        ctx.set('project', fullProject.project)
        ctx.set('config', fullProject.files.config)
        ctx.set('files', fullProject.files)
        return await next()
      } catch (error) {
        return ctx.text(`Error loading project: ${error}`, { status: 500 })
      }
    }),
  ],
})
