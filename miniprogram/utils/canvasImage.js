/**
 * 真机 Canvas 2D 加载本地图片
 * <image> 能显示 ≠ createImage 能绘制；依次尝试 getImageInfo.path / base64 / 复制到临时目录
 */

function extMime(src){
  return (src || '').toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
}

function basename(src){
  const parts = (src || '').split('/')
  return parts[parts.length - 1] || src
}

function candidates(src){
  const name = basename(src)
  const list = [src, `/assets/${name}`, `../../assets/${name}`]
  return [...new Set(list.filter(Boolean))]
}

function isResolvedPath(path){
  return /^(wxfile:|https?:|data:|blob:)/.test(path || '')
}

function loadFromSrc(canvas, src){
  return new Promise((resolve, reject)=>{
    const img = canvas.createImage()
    img.onload = () => resolve(img)
    img.onerror = err => reject(err || new Error('createImage onerror'))
    img.src = src
  })
}

function loadViaGetImageInfo(canvas, path){
  return new Promise((resolve, reject)=>{
    wx.getImageInfo({
      src: path,
      success(info){
        if(!info || !info.width || !info.height) return reject(new Error('empty image: ' + path))
        loadFromSrc(canvas, info.path).then(resolve).catch(reject)
      },
      fail: reject
    })
  })
}

function loadViaBase64(canvas, path){
  return new Promise((resolve, reject)=>{
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success(res){
        loadFromSrc(canvas, `data:${extMime(path)};base64,${res.data}`).then(resolve).catch(reject)
      },
      fail: reject
    })
  })
}

function loadViaCopy(canvas, path){
  const name = basename(path)
  const dest = `${wx.env.USER_DATA_PATH}/canvas_${name}`
  return new Promise((resolve, reject)=>{
    wx.getFileSystemManager().copyFile({
      srcPath: path,
      destPath: dest,
      success: () => loadViaGetImageInfo(canvas, dest).then(resolve).catch(reject),
      fail: reject
    })
  })
}

function loadCanvasImage(canvas, src){
  if(isResolvedPath(src)) return loadFromSrc(canvas, src)
  const paths = candidates(src)
  return paths.reduce((chain, path) => {
    return chain.catch(() =>
      loadViaGetImageInfo(canvas, path)
        .catch(() => loadViaBase64(canvas, path))
        .catch(() => loadViaCopy(canvas, path))
    )
  }, Promise.reject(new Error('no path')))
}

module.exports = { loadCanvasImage }
