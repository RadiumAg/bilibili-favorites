class AIError extends Error {
  constructor(
    message: string,
    public detail?: string,
  ) {
    super()
    this.message = message
  }
}

export { AIError }
