const axios = require("axios");
const execSync = require("./exec");
const {
    WEIXIN_WEBHOOK, // 异常提醒
    WEIXIN_WEBHOOK1, // 每日提醒
    WEIXIN_WEBHOOK2, // 版本更新提醒
    MOBILE,
    MOBILE2,
    COOKIE,
    TOKEN,
} = require("./utils/env");
const fs = require("fs");
const { sendMail } = require("./utils/mail");

// 创建忽略 SSL 的 axios 实例
const instance = axios.create({
    baseURL: "",
    headers: {
        Cookie: process.env.COOKIE,
        "X-Xsrf-Token": process.env.TOKEN,
    },
});

// 确保缓存目录存在
const cacheDir = 'cache';
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// 定义存储版本数据的文件路径
const versionDataFile = `${cacheDir}/version_data.json`;

// 读取本地版本数据
const readLocalVersionData = () => {
    if (fs.existsSync(versionDataFile)) {
        const data = fs.readFileSync(versionDataFile);
        return JSON.parse(data);
    }
    return null;
};

// 保存版本数据到本地文件
const saveLocalVersionData = (data) => {
    fs.writeFileSync(versionDataFile, JSON.stringify(data, null, 2));
};

// 发送钩子消息
const sendHookMessage = (content, mentionedMobileList = ["@all"], msgtype = "text", hookUrl) => {
    return;
    const objStr = JSON.stringify({
        msgtype,
        text: {
            content,
            mentioned_mobile_list: mentionedMobileList,
        },
    });

    const url = hookUrl || process.env.WEIXIN_WEBHOOK2; // 默认使用更新提醒的 webhook
    const cmd = `curl '${url}' -H 'Content-Type: application/json' -d '${objStr}'`;
    const { error } = execSync(cmd);
    if (error) sendMail();
};

// 获取 Chrome 版本信息
const checkChromeVersion = async () => {
    try {
        const response = await instance.get("https://versionhistory.googleapis.com/v1/chrome/platforms/win64/channels/stable/versions/all/releases?filter=endtime=none");
        const resultData = response.data ?? {};
        const { releases = [] } = resultData;
        const nowVersionObj = releases.find((item) => item.pinnable);
        
        if (!nowVersionObj) {
            console.error("未找到可用的版本信息");
            return;
        }

        const { version } = nowVersionObj;
        const mainVersion = version.split(".")[0];
        
        // 读取本地版本数据
        const localData = readLocalVersionData();
        console.log(11111, localData)
        const localVersion = localData ? localData.version.split(".")[0] : null;

        // 判断是否有更新
        if (!localVersion || mainVersion > localVersion) {
            // 更新本地版本
            saveLocalVersionData(version);
            sendHookMessage(`请注意今日谷歌浏览器有版本更新，版本号：${version}`, [process.env.MOBILE, process.env.MOBILE2]);
        } else {
            sendHookMessage("谷歌浏览器今日无更新", [process.env.MOBILE, process.env.MOBILE2], "text", process.env.WEIXIN_WEBHOOK1);
        }
    } catch (err) {
        sendHookMessage(`警告：接口请求异常，请及时处理\n ${err.message}`, [process.env.MOBILE], "text", process.env.WEIXIN_WEBHOOK);
    }
};

// 执行版本检查
checkChromeVersion();
