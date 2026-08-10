const updateSelection = <T>(previous: Set<T>, value: T, checked?: boolean): Set<T> => {
  const next = new Set(previous)
  const shouldSelect = checked ?? !next.has(value)

  if (shouldSelect) {
    next.add(value)
  } else {
    next.delete(value)
  }

  return next
}

export { updateSelection }
