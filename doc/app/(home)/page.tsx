import Link from 'next/link'
import { basePath } from '@/lib/shared'

const features = [
  {
    icon: '📊',
    title: '收藏内容分析',
    desc: '深度分析收藏分布、AI 关键词提取、可视化图表展示',
  },
  {
    icon: '🗂️',
    title: '智能整理',
    desc: '关键词自动归类、AI 智能分类、批量移动视频',
  },
  {
    icon: '🖱️',
    title: '拖拽管理',
    desc: '可视化拖拽移动、多选操作、实时反馈',
  },
  {
    icon: '🧠',
    title: 'MBTI 性格分析',
    desc: '基于收藏内容生成性格画像、四维度分析、个性化建议',
  },
]

const screenshots = [
  { src: '/screenshots/product.png', alt: '产品概览' },
  { src: '/screenshots/fav-1.png', alt: '收藏分析' },
  { src: '/screenshots/visualization.png', alt: '拖拽管理' },
  { src: '/screenshots/ai-config.png', alt: 'AI 配置' },
]

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-pink-50/80 to-white dark:from-pink-950/20 dark:to-fd-background">
        <div className="mx-auto flex max-w-(--fd-layout-width) flex-col items-center px-6 py-20 text-center md:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-fd-background/80 px-3 py-1 text-xs font-medium text-fd-muted-foreground backdrop-blur">
            <span className="inline-block size-2 rounded-full bg-pink-500" />
            Chrome 扩展 · 免费使用
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-fd-foreground md:text-5xl">
            B站收藏夹
            <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              整理工具
            </span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground">
            一款强大的 Chrome 扩展，帮助你高效管理和分析 Bilibili 收藏夹内容。 AI
            驱动的智能分类、可视化拖拽管理、MBTI 性格分析，让收藏不再混乱。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-fd-foreground px-5 py-2.5 text-sm font-medium text-fd-background shadow-sm transition-colors hover:bg-fd-foreground/90"
            >
              📖 使用文档
            </Link>
            <a
              href="https://chromewebstore.google.com/detail/b%E7%AB%99%E6%94%B6%E8%97%8F%E5%A4%B9%E6%95%B4%E7%90%86%E5%B7%A5%E5%85%B7/kompiebhklojoioghbddednmmnebnkoc"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-lg border bg-fd-background px-5 py-2.5 text-sm font-medium text-fd-foreground shadow-sm transition-colors hover:bg-fd-accent"
            >
              🔌 Chrome 商店安装
            </a>
            <a
              href="https://github.com/RadiumAg/bilibili-favorites"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-lg border bg-fd-background px-5 py-2.5 text-sm font-medium text-fd-foreground shadow-sm transition-colors hover:bg-fd-accent"
            >
              ⭐ GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-(--fd-layout-width) px-6 py-16 md:py-20">
          <h2 className="mb-2 text-center text-2xl font-bold">✨ 功能特性</h2>
          <p className="mb-10 text-center text-fd-muted-foreground">
            从分析到整理，全方位管理你的 B 站收藏
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border bg-fd-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-sm text-fd-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="border-b bg-fd-muted/30">
        <div className="mx-auto max-w-(--fd-layout-width) px-6 py-16 md:py-20">
          <h2 className="mb-2 text-center text-2xl font-bold">📸 产品预览</h2>
          <p className="mb-10 text-center text-fd-muted-foreground">简洁直观的界面，开箱即用</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {screenshots.map((s) => (
              <div key={s.src} className="overflow-hidden rounded-xl border bg-fd-card shadow-sm">
                <img
                  src={`${basePath}${s.src}`}
                  alt={s.alt}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-(--fd-layout-width) px-6 py-16 text-center md:py-20">
          <h2 className="mb-3 text-2xl font-bold">🚀 立即开始</h2>
          <p className="mb-6 text-fd-muted-foreground">
            安装扩展，连接你的 B 站账号，一键整理收藏夹
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://chromewebstore.google.com/detail/b%E7%AB%99%E6%94%B6%E8%97%8F%E5%A4%B9%E6%95%B4%E7%90%86%E5%B7%A5%E5%85%B7/kompiebhklojoioghbddednmmnebnkoc"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-lg bg-fd-foreground px-6 py-3 text-sm font-medium text-fd-background shadow-sm transition-colors hover:bg-fd-foreground/90"
            >
              🔌 前往 Chrome 商店安装
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border bg-fd-background px-6 py-3 text-sm font-medium text-fd-foreground shadow-sm transition-colors hover:bg-fd-accent"
            >
              📖 阅读使用文档
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
