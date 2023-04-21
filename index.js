const axios = require("axios");
const execSync = require("./exec");
const {
    WEIXIN_WEBHOOK, // 异常提醒
    WEIXIN_WEBHOOK1, // 每日提醒
    WEIXIN_WEBHOOK2, // 版本更新提醒
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
        const nextRefreshTime = stable?.next_late_stable_refresh
            ? new Date(stable?.next_late_stable_refresh) >
              new Date(stable?.next_stable_refresh)
                ? stable?.next_late_stable_refresh
                : stable?.next_stable_refresh
            : stable?.next_stable_refresh;
        //stable 版本
        const version = stable?.mstone ? stable.mstone : stable?.version;
        // bate 数据
        const beta = chromeData?.beta ?? {};
        const betaUpdateTime = beta?.late_stable_date
            ? beta?.late_stable_date
            : beta?.stable_date;

        const time2date = new Date(stableTime);
        const nextTime2date = new Date(nextRefreshTime);
        const betaTime2date = new Date(betaUpdateTime);
        // 因为谷歌上的升级时间表上的时间与预期会延迟个一天，大概是时区和地区更新不一致，所以将获取到的日期加一天
        if (!stable?.late_stable_date)
            time2date.setDate(time2date.getDate() + 1);

        nextTime2date.setDate(nextTime2date.getDate() + 1);

        if (!stable?.next_late_stable_refresh)
            nextTime2date.setDate(nextTime2date.getDate() + 1);
        if (!beta?.late_stable_date)
            betaTime2date.setDate(betaTime2date.getDate() + 1);
        // stable 首次更新时间
        let year = time2date.getFullYear();
        let month = time2date.getMonth();
        let date = time2date.getDate();
        // stable 下次更新时间
        let nextYear = nextTime2date.getFullYear();
        let nextMonth = nextTime2date.getMonth();
        let nextDate = nextTime2date.getDate();
        //当前时间
        const nowYear = nowDate.getFullYear();
        const nowMonth = nowDate.getMonth();
        const nowDay = nowDate.getDate();

        // beta 更新时间
        const betaYear = betaTime2date.getFullYear();
        const betaMonth = betaTime2date.getMonth();
        const betaDate = betaTime2date.getDate();
        // 如果下次的更新时间的月份和beta 更新时间的月份一致，则直接用beta的更新时间
        if (nextMonth === betaMonth && nextDate < betaDate) {
            nextDate = betaDate;
            nextMonth = betaMonth;
            nextYear = betaYear;
        }
        if (nowYear > year || nowMonth > month || nowDay > date) {
            year = nextYear;
            month = nextMonth;
            date = nextDate;
        }

        if (
            (month === nowDate.getMonth() &&
                date === nowDate.getDate() &&
                year === nowDate.getFullYear()) ||
            (betaMonth === nowDate.getMonth() &&
                betaDate === nowDate.getDate() &&
                betaYear === nowDate.getFullYear())
        ) {
            sendHookMessage(
                `请注意今日谷歌浏览器有版本，更新版本， ${version}`,
                MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : ""
            );
        } else {
            sendHookMessage(
                `谷歌浏览器下次更新时间:${nextYear}-${
                    nextMonth + 1
                }-${nextDate}`,
                MOBILE ? [`${MOBILE}`, `${MOBILE2}`] : "",
                "text",
                // 康复
                WEIXIN_WEBHOOK1
            );
        }
    })
    .catch((err) => {
        sendHookMessage(
            `警告：接口请求异常，请及时处理\n ${err}`,
            MOBILE ? [`${MOBILE}`] : "",
            "text",
            // 每天
            WEIXIN_WEBHOOK
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
