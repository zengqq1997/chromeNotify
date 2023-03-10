const env = process.env || {};

module.exports = {
  /**
   * 企业微信机器人配置
   * https://developer.work.weixin.qq.com/document/path/91770
   */
  // 日常通知
  WEIXIN_WEBHOOK: env.WEIXIN_WEBHOOK,
  // 异常通知
  WEIXIN_WEBHOOK1: env.WEIXIN_WEBHOOK1,
  // 版本更新通知
  WEIXIN_WEBHOOK2: env.WEIXIN_WEBHOOK2,
  MAIL: env.MAIL,
  MAIL_PWD: env.MAIL_PWD,
  MOBILE: env.MOBILE,
  MOBILE2: env.MOBILE2,
};
