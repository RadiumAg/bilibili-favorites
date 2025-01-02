import React from 'react'
import img1 from '@/assets/finish-img/1.png'
import img2 from '@/assets/finish-img/2.png'
import img3 from '@/assets/finish-img/3.png'
import img4 from '@/assets/finish-img/4.png'
import img5 from '@/assets/finish-img/5.png'
import { sleep } from '@/utils/promise'
import classNames from 'classnames'

type FinishedProps = {
  width?: number
  height?: number
  duration?: number
  start: boolean
  onFinished?: () => Promise<void> | void
}

const Finished: React.FC<FinishedProps> = (props) => {
  const { width = 200, height = 200, duration = 4000, start, onFinished } = props
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const startRef = React.useRef(start)
  startRef.current = start

  console.log(startRef.current)

  const createImageElement = (src: string) => {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = document.createElement('img')

      img.src = src
      img.style.objectFit = 'contain'
      img.width = width
      img.height = height
      img.onload = () => {
        resolve(img)
      }
    })
  }

  React.useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    let destory = false

    const play = async (src?: string, index = 0) => {
      if (destory) return
      if (!startRef.current) return

      if (index > 0) {
        context?.clearRect(0, 0, width, height)
      }

      if (src) {
        const img = await createImageElement(src)
        context?.drawImage(img, 0, 0, width, height)
      }

      requestAnimationFrame(async () => {
        if (index > 0) {
          await sleep(200)
        }

        switch (index) {
          case 0:
            play(img1, ++index)
            break

          case 1:
            await sleep(1000)
            play(img2, ++index)
            break

          case 2:
            play(img3, ++index)
            break

          default: {
            if (index % 3 === 0) {
              play(img4, ++index)
            } else {
              play(img5, ++index)
            }
          }
        }
      })
    }

    Promise.all([play(), sleep(duration)]).then(() => {
      console.log('finished')
      onFinished?.()
    })

    return () => {
      destory = true
      context?.clearRect(0, 0, width, height)
      console.log('finished destory')
    }
  }, [start])

  return (
    <canvas
      width={width}
      height={height}
      ref={canvasRef}
      className={classNames({ ['hidden']: start === false })}
    ></canvas>
  )
}

export default Finished
