import * as ExternalPlugin from "./.quartz/plugins"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

ExternalPlugin.Explorer({
  sortFn: (a, b) => {
    // 1. Папки всегда идут выше файлов
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1

    // 2. Получаем поле order из frontmatter
    const oa = a.data?.frontmatter?.order ?? a.file?.frontmatter?.order
    const ob = b.data?.frontmatter?.order ?? b.file?.frontmatter?.order

    const hasA = typeof oa === "number"
    const hasB = typeof ob === "number"

    // 3. Если у обоих есть order — сортируем по нему (по возрастанию)
    if (hasA && hasB && oa !== ob) return oa - ob

    // 4. Если order есть только у одного — он идет первым
    if (hasA !== hasB) return hasA ? -1 : 1

    // 5. Фоллбэк: сортируем по алфавиту (лексикографически)
    const nameA = a.displayName || a.name || ""
    const nameB = b.displayName || b.name || ""
    return nameA.localeCompare(nameB)
  },
})

const config = await loadQuartzConfig()

config.plugins.transformers.unshift({
  name: "FilenameAsTitle",
  markdownPlugins() {
    return [
      () => (_tree: unknown, file: any) => {
        const fm = (file.data.frontmatter ??= {}) as Record<string, unknown>
        if (fm.title) return

        const fullPath: string = (file.history && file.history[0]) || file.path || ""
        const base = fullPath.split(/[\\/]/).pop() ?? ""
        let name = base.replace(/\.md$/i, "")

        try {
          if (/%[0-9A-F]{2}/i.test(name)) {
            name = decodeURIComponent(name)
          }
        } catch (e) {
          console.warn(`Failed to decode filename: ${name}`, e)
        }

        if (name === "index" || name === "") {
          fm.title = config.configuration.pageTitle
        } else {
          fm.title = name
        }
      },
    ]
  },
} as any)

export default config
export const layout = await loadQuartzLayout()