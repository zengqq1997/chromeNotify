const axios = require("axios");
const execSync = require("./exec");
const { WEIXIN_WEBHOOK } = require("./utils/env");
const { WEIXIN_WEBHOOK1 } = require("./utils/env");

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
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，所以将获取到的日期加一天
        time2date.setDate(time2date.getDate() + 1);
        const month = time2date.getMonth();
        const date = time2date.getDate();
        const nowDate = new Date();

        if (month === nowDate.getMonth() && date === nowDate.getDate()) {
            sendHookMessage(`今日谷歌浏览器有新版本，请注意更新, ${version}`);
        } else {
            sendHookMessage(`谷歌浏览器下次更新时间:${stableUpdateTime}`);
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
    const cmd1 = `curl '${WEIXIN_WEBHOOK1}' -H 'Content-Type: application/json' -d '${objStr}'`;
    const { error, stdout } = execSync(cmd);
    const { error1, stdout1 } = execSync(cmd1);
};
