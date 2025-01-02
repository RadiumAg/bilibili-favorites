const sleep = (time: number) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      resolve(undefined)
    }, time)
  })
}

export { sleep }
