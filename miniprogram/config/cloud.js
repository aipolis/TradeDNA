/**
 * 云托管配置
 *
 * service:  云托管服务名,必须和云托管控制台创建时一致(部署后在控制台查)
 * env:      可选,云开发环境 ID。留空用默认环境(适合只有一个环境的情况)
 * enabled:  开关。本地调试 / 云托管未部署时设 false,上报全部 skip
 */
module.exports = {
  service: 'tradedna-api',
  env: '',
  enabled: true
}
