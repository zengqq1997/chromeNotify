const axios = require("axios");
const execSync = require("./exec");
const { WEIXIN_WEBHOOK } = require("./utils/env");

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
        const stableUpdateTime = stable?.stable_date;
        const nextStableRefresh = stable?.next_stable_refresh;

        const time2date = new Date(stableUpdateTime);
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，所以将获取到的日期加一天
        time2date.setDate(time2date.getDate() + 1);
        const month = time2date.getMonth();
        const date = time2date.getDate();
        const nowDate = new Date();
        sendHookMessage(
            `谷歌浏览器下次更新时间:${nextStableRefresh ?? stableUpdateTime}`
        );
        if (month === nowDate.getMonth() && date === nowDate.getDate()) {
            sendHookMessage("今日谷歌浏览器有新版本，请注意更新");
        }
    })
    .catch((err) => {
        console.log(err);
    });

const sendHookMessage = (
    content,
    mentionedMobileList = ["@all"],
    msgtype = "text"
) => {
    const objStr = JSON.stringify({
        msgtype,
        text: {
            content,
            mentioned_mobile_list: mentionedMobileList,
        },
    });
    const cmd = `curl '${WEIXIN_WEBHOOK}' -H 'Content-Type: application/json' -d '${objStr}'`;
    const { error, stdout } = execSync(cmd);
};
