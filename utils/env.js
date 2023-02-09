const env = process.env || {};

module.exports = {
  /**
   * 企业微信机器人配置
   * https://developer.work.weixin.qq.com/document/path/91770
   */
  WEIXIN_WEBHOOK: env.WEIXIN_WEBHOOK,
  WEIXIN_WEBHOOK1: env.WEIXIN_WEBHOOK1,
};
