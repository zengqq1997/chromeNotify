const axios = require("axios");
const execSync = require("./exec");
const {
    WEIXIN_WEBHOOK,
    WEIXIN_WEBHOOK1,
    WEIXIN_WEBHOOK2,
    MOBILE,
    MOBILE2,
} = require("./utils/env");
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
        const beta = chromeData?.beta ?? {};
        const stableUpdateTime = stable?.stable_date
            ? stable?.next_stable_refresh
            : stable?.stable_date;
        const betaUpdateTime = beta?.stable_date;
        const version = stable?.mstone;
        const betaVersion = beta?.mstone;
        const time2date = new Date(stableUpdateTime);
        const betaTime2date = new Date(betaUpdateTime);
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，大概是时区和地区更新不一致，所以将获取到的日期加一天
        time2date.setDate(time2date.getDate() + 1);
        betaTime2date.setDate(betaTime2date.getDate() + 1);

        const year = time2date.getFullYear();
        const month = time2date.getMonth();
        const date = time2date.getDate();
        const nowDate = new Date();

        const betaYear = time2date.getFullYear();
        const betaMonth = time2date.getMonth();
        const betaDate = time2date.getDate();

        if (
            month === nowDate.getMonth() &&
            date === nowDate.getDate() &&
            year === nowDate.getFullYear()
        ) {
            if (year === betaYear && betaMonth === month && date === betaDate) {
                sendHookMessage(
                    `请注意，今日谷歌浏览器有大版本更新，更新版本, ${betaVersion}`,
                    MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : ""
                );
            } else
                sendHookMessage(
                    `请注意今日谷歌浏览器有小版本，更新版本， ${version}`,
                    MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : ""
                );
        } else {
            sendHookMessage(
                `谷歌浏览器下次更新时间:${year}-${month}-${date}`,
                MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : "",
                "text",
                // 每日
                WEIXIN_WEBHOOK2
            );
        }
    })
    .catch((err) => {
        sendHookMessage(
            `警告：接口请求异常，请及时处理\n ${err}`,
            MOBILE ? [`${MOBILE}`] : "",
            "text",
            //康复
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
    if (!hookUrl) {
        // chrome提醒
        const cmd = `curl '${WEIXIN_WEBHOOK2}' -H 'Content-Type: application/json' -d '${objStr}'`;
        const { error, stdout } = execSync(cmd);
        if (error) sendMail();
    }
    if (hookUrl) {
        const cmd1 = `curl '${hookUrl}' -H 'Content-Type: application/json' -d '${objStr}'`;
        const { error1, stdout1 } = execSync(cmd1);
        if (error1) sendMail();
    }
};
