/**
 * 云托管配置
 *
 * service:  云托管服务名,必须和云托管控制台创建时一致
 * env:      云开发环境 ID(必填,callContainer 不支持默认环境)
 *           在云开发控制台 → 环境设置 → 环境 ID 中查
 * enabled:  开关。本地调试 / 云托管未部署时设 false,上报全部 skip
 */
module.exports = {
  service: 'tradedna-api',
  env: 'prod-d3g2pxi63c4a4516b',
  enabled: true
}
