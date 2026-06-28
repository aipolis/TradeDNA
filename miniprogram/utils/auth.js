const { getProfile, saveProfile, ensureUid, isProfileReady, clearProfile } = require('./userProfile')

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
      // 异步同步到云端,失败不阻塞登录
      try {
        const { syncProfile } = require('./api')
        syncProfile({ nickName: next.nickName, avatarUrl: next.avatarUrl })
          .catch(err => console.warn('[auth] profile sync skipped', err && err.message))
      } catch(err) {
        console.warn('[auth] profile sync require failed', err)
      }
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

function logout(opts){
  clearProfile()
  // 同时清测评相关本地缓存,避免下一个用户进来看到上一个的数据
  wx.removeStorageSync('tradeDNAResult')
  wx.removeStorageSync('tradeDNAHistory')
  wx.removeStorageSync('tradeDNAProgress')
  const redirect = (opts && opts.redirect) || '/pages/index/index'
  wx.reLaunch({ url: redirect })
}

module.exports = {
  wxLogin, resolveOpenId, completeLogin, goLogin, ensureProfile, isProfileReady, logout
}
