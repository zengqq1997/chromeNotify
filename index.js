const axios = require("axios");
const execSync = require("./exec");
const { WEIXIN_WEBHOOK, WEIXIN_WEBHOOK1, MOBILE } = require("./utils/env");
const { sendMail } = require("./utils/mail");

// 创建忽略 SSL 的 axios 实例
const instance = axios.create({
    baseURL: "https://chromestatus.com/api/v0",
});

instance({ url: "/channels" }, (error, response, data) => {
    console.log(error, response, data);
    // instance.del(url: string, data: any, callback: Function): void;
})
    .then((result) => {
        let chromeData = {};
        if (typeof result.data === "string") {
            const chromeDataArr = result.data.split("\n");
            const chromeDataStr = chromeDataArr?.[1] ?? {};
            chromeData = JSON.parse(chromeDataStr);
        } else {
            chromeData = result.data;
        }
        const stable = chromeData?.stable ?? {};
        const stableUpdateTime = stable?.next_stable_refresh
            ? stable?.next_stable_refresh
            : stable?.stable_date;
        const version = stable?.mstone;
        const time2date = new Date(stableUpdateTime);
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，大概是时区和地区更新不一致，所以将获取到的日期加一天
        time2date.setDate(time2date.getDate() + 1);
        const year = time2date.getFullYear();
        const month = time2date.getMonth() + 1;
        const date = time2date.getDate();
        const nowDate = new Date();

        if (month === nowDate.getMonth() && date === nowDate.getDate()) {
            sendHookMessage(
                `今日谷歌浏览器有新版本，请注意更新, ${version}`,
                MOBILE ? [`${MOBILE}`] : ""
            );
        } else {
            sendHookMessage(
                `谷歌浏览器下次更新时间:${year}-${month}-${date}`,
                MOBILE ? [`${MOBILE}`] : ""
            );
        }
    })
    .catch((err) => {
        sendHookMessage(
            `警告：接口请求异常，请及时处理\n ${err}`,
            MOBILE ? [`${MOBILE}`] : "",
            "text",
            WEIXIN_WEBHOOK1
        );
    });

const sendHookMessage = (
    content,
    mentionedMobileList = ["@all"],
    msgtype = "text",
    hookUrl
) => {
    const objStr = JSON.stringify({
        msgtype,
        text: {
            content,
            mentioned_mobile_list: mentionedMobileList,
        },
    });
    const cmd = `curl '${WEIXIN_WEBHOOK}' -H 'Content-Type: application/json' -d '${objStr}'`;
    const cmd1 = `curl '${hookUrl}' -H 'Content-Type: application/json' -d '${objStr}'`;
    const { error, stdout } = execSync(cmd);
    if (error) sendMail();
    const { error1, stdout1 } = execSync(cmd1);
    if (error1) sendMail();
};
