import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

const config = await loadQuartzConfig()

config.plugins.transformers.unshift({
  name: "FilenameAsTitle",
  markdownPlugins() {
    return [
      () => (_tree: unknown, file: any) => {
        const fm = (file.data.frontmatter ??= {}) as Record<string, unknown>
        if (fm.title) return

        // Берем "сырое" имя файла из истории
        const fullPath: string = (file.history && file.history[0]) || file.path || ""
        const base = fullPath.split(/[\\/]/).pop() ?? ""
        let name = base.replace(/\.md$/i, "")

        // Если имя выглядит как URL-encoded строка, декодируем его
        try {
          if (/%[0-9A-F]{2}/i.test(name)) {
            name = decodeURIComponent(name)
          }
        } catch (e) {
          // Если декодирование не удалось, оставляем имя как есть
          console.warn(`Failed to decode filename: ${name}`, e)
        }

        // Для главной страницы используем название сайта, для остальных — имя файла
        if (name === "index" || name === "") {
          fm.title = config.configuration.pageTitle
        } else {
          fm.title = name
        }
      },
    ]
  },
} as any)

const explorerPlugin = config.plugins.components.find(
  (plugin) => plugin.name === "Explorer"
)

if (explorerPlugin) {
  ;(explorerPlugin.options as any).sortFn = (a: any, b: any) => {
    // 1. Папки всегда идут выше файлов (если хотите смешивать - уберите этот блок)
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1

    // 2. Получаем поле order из frontmatter
    // Проверяем разные пути, так как структура может отличаться
    const oa = a.data?.frontmatter?.order ?? a.file?.frontmatter?.order
    const ob = b.data?.frontmatter?.order ?? b.file?.frontmatter?.order
    
    const hasA = typeof oa === "number"
    const hasB = typeof ob === "number"

    // 3. Если у обоих есть order — сортируем по нему (по возрастанию)
    if (hasA && hasB && oa !== ob) return oa - ob

    // 4. Если order есть только у одного — он идет первым
    if (hasA !== hasB) return hasA ? -1 : 1

    // 5. Если order нет ни у кого (или они равны) — сортируем по алфавиту (лексикографически)
    // Используем title (если есть), иначе имя файла
    const nameA = a.data?.frontmatter?.title || a.name || a.displayName || ""
    const nameB = b.data?.frontmatter?.title || b.name || b.displayName || ""
    
    return nameA.localeCompare(nameB)
  }
}

export default config
export const layout = await loadQuartzLayout()