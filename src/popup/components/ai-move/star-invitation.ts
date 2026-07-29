const shouldRecordAIMoveUse = (successCount: number, skippedCount: number): boolean => {
  return successCount + skippedCount > 0
}

export { shouldRecordAIMoveUse }
