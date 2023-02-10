const { MAIL, MAIL_PWD } = require("./env");

const nodemailer = require('nodemailer');

// 创建邮箱对象
const transporter = nodemailer.createTransport({
    host: "smtp.exmail.qq.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: MAIL, // generated ethereal user
      pass: MAIL_PWD, // generated ethereal password
    },
});

/**
 * 发送邮件
 */
export async function sendMail(content){
    let info = await transporter.sendMail({
        from: `"chrom升级助手" <${MAIL}>`, // sender address
        to: MAIL, // list of receivers
        ...content
    });
    console.log("Message sent: %s", info.messageId);
}