import React from 'react'
import img1 from '@/assets/finish-img/1.png'
import img2 from '@/assets/finish-img/2.png'
import img3 from '@/assets/finish-img/3.png'
import img4 from '@/assets/finish-img/4.png'
import img5 from '@/assets/finish-img/5.png'
import { sleep } from '@/utils/promise'

type FinishedProps = {
  width?: number
  height?: number
  duration?: number
  onFinished?: () => Promise<void> | void
}

const Finished: React.FC<FinishedProps> = (props) => {
  const { width = 200, height = 200, duration = 3000, onFinished } = props
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const createImageElement = (src: string) => {
    const img = document.createElement('img')

    img.src = src
    img.style.objectFit = 'contain'
    img.width = width
    img.height = height

    return img
  }

  React.useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    let destory = false

    const play = async (src?: string, index = 0) => {
      if (destory) true
      if (index > 0) {
        context?.clearRect(0, 0, width, height)
      }

      if (src) {
        const img = createImageElement(src)
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
      onFinished?.()
    })

    return () => {
      destory = true
      context?.clearRect(0, 0, width, height)
      console.log('finished destory')
    }
  }, [])

  return <canvas width={width} height={height} ref={canvasRef}></canvas>
}

export default Finished
