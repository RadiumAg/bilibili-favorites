const log = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

export { log }
