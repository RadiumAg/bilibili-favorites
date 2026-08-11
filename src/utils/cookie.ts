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

const BILIBILI_COOKIE_URL = 'https://www.bilibili.com/'
const BILIBILI_AUTH_COOKIE_NAMES = ['DedeUserID', 'bili_jct'] as const

const readBilibiliCookieFromChrome = async (): Promise<string> => {
  const cookies = await Promise.all(
    BILIBILI_AUTH_COOKIE_NAMES.map((name) =>
      chrome.cookies.get({
        url: BILIBILI_COOKIE_URL,
        name,
      }),
    ),
  )

  return cookies
    .filter((cookie): cookie is chrome.cookies.Cookie => cookie !== null)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}

export { getCookieValue, readBilibiliCookieFromChrome }
