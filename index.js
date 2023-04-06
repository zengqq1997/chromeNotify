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
        const nowDate = new Date();
        // stable 数据
        const stable = chromeData?.stable ?? {};
        // stable 时间
        const stableTime = stable?.late_stable_date
            ? stable?.late_stable_date
            : stable?.stable_date;
        const nextRefreshTime = stable?.next_stable_refresh;
        //stable 版本
        const version = stable?.mstone;
        // bate 数据
        const beta = chromeData?.beta ?? {};
        const betaUpdateTime = beta?.late_stable_date
            ? beta?.late_stable_date
            : beta?.stable_date;
        const betaVersion = beta?.mstone;

        const time2date = new Date(stableTime);
        const nextTime2date = new Date(nextRefreshTime);
        const betaTime2date = new Date(betaUpdateTime);
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，大概是时区和地区更新不一致，所以将获取到的日期加一天
        if (!stable?.late_stable_date)
            time2date.setDate(time2date.getDate() + 1);
        nextTime2date.setDate(time2date.getDate() + 1);
        if (!beta?.late_stable_date)
            betaTime2date.setDate(betaTime2date.getDate() + 1);
        // stable 首次更新时间
        let year = time2date.getFullYear();
        let month = time2date.getMonth();
        let date = time2date.getDate();
        // stable 下次更新时间
        const nextYear = nextTime2date.getFullYear();
        const nextMonth = nextTime2date.getMonth();
        const nextDate = nextTime2date.getDate();
        //当前时间
        const nowYear = nowDate.getFullYear();
        const nowMonth = nowDate.getMonth();
        const nowDay = nowDate.getDate();
        if (nowYear > year && nowMonth > month && nowDay > date) {
            year = nextYear;
            month = nextMonth;
            date = nextDate;
        }

        // beta 更新时间
        const betaYear = betaTime2date.getFullYear();
        const betaMonth = betaTime2date.getMonth();
        const betaDate = betaTime2date.getDate();

        if (
            (month === nowDate.getMonth() &&
                date === nowDate.getDate() &&
                year === nowDate.getFullYear()) ||
            (betaMonth === nowDate.getMonth() &&
                betaDate === nowDate.getDate() &&
                betaYear === nowDate.getFullYear())
        ) {
            if (year === betaYear && betaMonth === month && date === betaDate) {
                sendHookMessage(
                    `请注意，今日谷歌浏览器有版本更新，更新版本, ${betaVersion}`,
                    MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : "",
                    "text",
                    WEIXIN_WEBHOOK
                );
            } else
                sendHookMessage(
                    `请注意今日谷歌浏览器有版本，更新版本， ${version}`,
                    MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : ""
                );
        } else {
            let y = year;
            let m = month;
            let d = date;
            if (month === betaMonth && d < betaDate) {
                y = betaYear;
                m = betaMonth;
                d = beta;
            }
            sendHookMessage(
                `谷歌浏览器下次更新时间:${y}-${m + 1}-${d}`,
                MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : "",
                "text",
                // 每日
                WEIXIN_WEBHOOK
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
