const KEY = 'tradeDNAUserProfile'
const DEFAULT = {
  avatarUrl: '',
  nickName: '',
  openid: '',
  uid: '',
  loggedIn: false,
  loginAt: 0
}

function getProfile(){
  const saved = wx.getStorageSync(KEY)
  return Object.assign({}, DEFAULT, saved || {})
}

function saveProfile(partial){
  const next = Object.assign({}, getProfile(), partial || {})
  wx.setStorageSync(KEY, next)
  return next
}

function ensureUid(profile){
  const p = profile || getProfile()
  if(p.uid) return p.uid
  const uid = 'td_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  saveProfile({ uid })
  return uid
}

function isProfileReady(profile){
  const p = profile || getProfile()
  return !!(p.loggedIn && p.avatarUrl && (p.nickName || '').trim().length >= 1)
}

function getDisplayName(profile){
  const p = profile || getProfile()
  const name = (p.nickName || '').trim()
  return name || '交易者'
}

module.exports = {
  getProfile, saveProfile, ensureUid, isProfileReady, getDisplayName
}
