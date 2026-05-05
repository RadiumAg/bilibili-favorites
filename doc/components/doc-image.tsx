import { basePath } from '@/lib/shared'

interface DocImageProps {
  src: string
  alt?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function DocImage({ src, alt, width, height, className, priority }: DocImageProps) {
  const fullSrc = src.startsWith('http') ? src : `${basePath}${src}`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fullSrc}
      alt={alt || ''}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
