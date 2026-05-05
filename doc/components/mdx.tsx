import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { basePath } from '@/lib/shared'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img
        src={`${basePath}${props.src}`}
        alt={props.alt || ''}
        className={props.className}
        loading="lazy"
      />
    ),
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
