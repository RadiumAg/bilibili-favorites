const getCookieValue = (name: string, cookies: string) => {
  var cookieArray = cookies.split('; ')
  for (var i = 0; i < cookieArray.length; i++) {
    var cookiePair = cookieArray[i].split('=')
    if (cookiePair[0] === name) {
      return cookiePair[1]
    }
  }
  return null
}

export { getCookieValue }
