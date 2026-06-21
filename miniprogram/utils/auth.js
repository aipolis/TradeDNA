const { getProfile, saveProfile, ensureUid, isProfileReady } = require('./userProfile')

function wxLogin(){
  return new Promise((resolve, reject)=>{
    wx.login({
      success: res => res.code ? resolve(res.code) : reject(res),
      fail: reject
    })
  })
}

function resolveOpenId(){
  if(!wx.cloud || !wx.cloud.callFunction) return Promise.resolve('')
  return wx.cloud.callFunction({ name: 'login' })
    .then(res => (res.result && res.result.openid) || '')
    .catch(err => {
      console.warn('[auth] cloud openid skip', err)
      return ''
    })
}

function completeLogin(profilePatch){
  return wxLogin()
    .then(() => resolveOpenId())
    .then(openid => {
      const next = saveProfile(Object.assign({}, profilePatch, {
        openid: openid || getProfile().openid || '',
        loggedIn: true,
        loginAt: Date.now()
      }))
      ensureUid(next)
      return next
    })
}

function goLogin(redirect){
  const url = `/pages/login/login?redirect=${encodeURIComponent(redirect || '/pages/intro/intro')}`
  wx.navigateTo({ url })
}

function ensureProfile(redirect){
  const profile = getProfile()
  if(isProfileReady(profile)) return Promise.resolve(profile)
  goLogin(redirect)
  return Promise.reject(new Error('need login'))
}

module.exports = {
  wxLogin, resolveOpenId, completeLogin, goLogin, ensureProfile, isProfileReady
}
