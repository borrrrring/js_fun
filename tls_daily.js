/**

Author: lxk0301, Kenji
Last Updated: 2021/05/11 13:10
Usage:
    quanx:
        [rewrite_remote]
        https://raw.githubusercontent.com/borrrrring/js_fun/master/tls_daily.conf, tag=特仑苏, update-interval=86400, opt-parser=false, enabled=true
        或者
        mitm = xw.mengniu.cn
        [rewrite_local] 
        https:\/\/xw\.mengniu\.cn\/grass\/Api\/TelunsuHandler\.ashx\?method\=GetMyPrize url script-request-header https://raw.githubusercontent.com/borrrrring/js_fun/master/tls_daily.js
    Loon:
        http-request https:\/\/xw\.mengniu\.cn\/grass\/Api\/TelunsuHandler\.ashx\?method\=GetMyPrize script-path= https://raw.githubusercontent.com/borrrrring/js_fun/master/tls_daily.js, requires-body=true, timeout=30, tag=特仑苏获取cookie

    操作步骤：
        首先使用工具添加上述参数，然后打开微信小程序“向往的生活”，进入首页后点击左上角我的奖品获取cookie手动运行该脚本即可。

*/
const $ = new Env("特仑苏")
const TLS_API_HOST = "https://xw.mengniu.cn/grass/Api/TelunsuHandler.ashx?";

// 最后更新日期
$.lastUpdate = "2021/05/11 13:10"
// 是否推送获取cookie成功
$.showCKAlert = true
// 多账号Cookie数组
$.cookies = $.getdata("tls_daily_ck")
$.cookie = ""
// 是否推送运行结果
$.showAlert = true
// 推送信息
$.message = ""
// 是否助力作者，每天 +100g草种
$.helpAuthor = true
// 牧草种子数量
$.grass_seed = 0
// 自动答题
$.autoAnswer = true
// 本周是否已答题
$.ispaly = false
$.answerList = []
// 打印response data
$.debugLog = false
const isRequest = typeof $request != "undefined";
isRequest ? getCookie() : main();

async function main() {
    try {
        if (!$.cookies) {
            if ($.showAlert) {
                $.msg($.name, '', '请先打开微信小程序“向往的生活”，进入首页后点击左上角我的奖品获取cookie');
            } else {
                $.log('\n请先打开微信小程序“向往的生活”，进入首页后点击左上角我的奖品获取cookie');
            }
            return;
        }

        let cookies;
        try {
            cookies = JSON.parse($.cookies);
        } catch (e) {
            $.log(e)
        }
        if (typeof cookies != "undefined" && cookies instanceof Array) {
            for (obj of cookies) {
                $.message = "";
                $.answerList = [];
                $.cookie = obj["cookie"];
                $.log(`当前 🆔 = ${obj["userid"]}, Cookie = ${$.cookie}`);
                if (await run()) {
                    continue;
                }
            }
        } else {
            $.cookie = $.cookies;
            await run();
        }
    } catch (e) {
        $.logErr(e)
    } finally {
        if ($.isNode()) {
            process.exit()
        } else {
            $.done({})
        }
    }
}

function run() {
    return new Promise(async (resolve) => {
        for (var type of [
            "AddInteraction",   // 完成牧牧乐园任务
            "ClickSign",        // 收集草种-每日签到
            "GetLunchAward",    // 收集草种-加餐奖励（12:00-13:00）
            "Getanswer",        // 获取限时闯关答案（每周末12:00后）
            "AddanswerOrder",   // 自动答题
            "AddShare",         // 助力得草种
            "GetUserInfo",      // 获取用户信息
            "TakeMilk",         // 喂食
            "PlantGrassSeed"    // 种植草种
        ]) {
            switch (type) {
                case "AddInteraction":
                    for (var task of [
                        "susuMeijia",       // 牧牧乐园-美甲
                        "susuRiguangyu",    // 牧牧乐园-听音乐
                        "susuHuli"          // 牧牧乐园-护理
                    ]) {
                        if (await tls(type, task)) {
                            resolve(true);
                        }
                    }
                    break;
                case "PlantGrassSeed":
                    if ($.grass_seed < 100) {
                        $.log("\n每次种植至少需要100g草种哦，快去收集草种再来吧")
                    } else {
                        let i = 0
                        while ($.grass_seed >= 100 && i < 5) {
                            await tls(type);
                            await $.wait(3 * 1000);
                            await tls("TakeMilk");
                            await tls("GetUserInfo", "", "", true);
                            i++
                        }
                        await tls("GetUserInfo");
                    }
                    break;
                case "AddanswerOrder":
                    if ($.autoAnswer) {
                        if ($.answerList.length > 0) {
                            if ($.ispaly) {
                                $.log("\n本周已经完成闯关。养精蓄锐，下周再来吧！");
                            } else {
                                $.log("\n开始自动答题…请等待30秒\n");
                                let seconds = 0;
                                while (seconds < 30) {
                                    await $.wait(1 * 1000);
                                    seconds += 1;
                                    $.log(`${seconds}秒`)
                                }
                                await tls(type);
                            }
                        } else {
                            $.log("\n本周闯关尚未开始，活动时间：每周六12:00-周日23:59");
                        }
                    }
                    break;
                case "AddShare":
                    if ($.helpAuthor) {
                        for (const userId of ["71603", "64563", "69867", "5364449", "151749", "85769", "76187", "75950", "86620", "75738"]) {
                            await tls(type, "", userId);
                            await $.wait(3 * 1000);
                        }
                    }
                    break;
                default:
                    await tls(type)
                    break;
            }
            await $.wait(3 * 1000)
        }
        await showMsg();
        resolve(false);
    })
}

function tls(type, task, userId, isUpdateData) {
    return new Promise(async (resolve) => {
        var options = taskUrl(type)
        switch (type) {
            case "AddInteraction":
                options["body"] = `InterName=${task}`;
                break;
            case "AddShare":
                options["body"] = `userid=${userId}`;
                break;
            case "AddanswerOrder":
                options["body"] = `answerList=${JSON.stringify($.answerList)}&alltime=30`;
                break;
            default:
                break;
        }
        $.post(
            options,
            async (err, resp, data) => {
                let isOutOfDate = false
                try {
                    if ($.debugLog) {
                        $.log(`返回消息体\n${data}\n`);
                    }
                    let results = JSON.parse(typeof data !== 'undefined' && data.length > 0 ? data : '{"errcode":1,"errmsg":"无信息返回"}');
                    if (await dealWithResult(type, task, results, isUpdateData)) {
                        isOutOfDate = true;
                        return;
                    }
                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve(isOutOfDate);
                }
            }
        );
    });
}

function dealWithResult(type, task, results, isUpdateData) {
    return new Promise((resolve) => {
        let errcode = results.errcode;
        let errmsg = results.errmsg;

        let msg = "";
        switch (type) {
            case "AddInteraction":
                switch (task) {
                    case "susuMeijia":
                        msg = '\n完成牧牧乐园-美甲';
                        break;
                    case "susuRiguangyu":
                        msg = '\n完成牧牧乐园-听音乐';
                        break;
                    case "susuHuli":
                        msg = '\n完成牧牧乐园-护理';
                        break;

                    default:
                        break;
                }
                break;
            case "ClickSign":
                msg = '\n收集草种-每日签到'
                break;
            case "GetLunchAward":
                msg = '\n收集草种-加餐奖励（12:00-13:00）'
                break;
            case "GetUserInfo":
                msg = `\n获取用户信息`;
                break;
            case "PlantGrassSeed":
                msg = '\n种植草种'
                break;
            case "TakeMilk":
                msg = '\n喂食'
                break;
            case "Getanswer":
                msg = '\n获取特仑苏限时闯关正确答案'
                break;
            case "AddanswerOrder":
                msg = '\n自动答题'
                break;
            case "AddShare":
                msg = '\n助力'
                break;

            default:
                break;
        }

        if (errcode != 0) {
            if (errmsg.indexOf("没有授权") != -1) {
                if ($.showAlert) {
                    $.msg($.name, '', 'Cookie已过期，请先打开微信小程序“向往的生活”，进入首页后点击左上角我的奖品获取cookie');
                } else {
                    $.log('\nCookie已过期，请先打开微信小程序“向往的生活”，进入首页后点击左上角我的奖品获取cookie');
                }
                resolve(true);
                return;
            } else {
                $.log(`${msg}失败\n${errmsg}`);
            }
            resolve(false);
            return;
        }
        if (type == "AddInteraction") {
            msg += "成功, 奶滴 +1g";

            $.message += msg
        } else if (type == "GetUserInfo") {
            msg += "成功";

            let userid = results.result.id;
            let nickname = results.result.nickname;
            let signcount = results.result.signcount;
            let milk = results.result.milk;
            if (milk >= 300) {
                $.msg($.name, "已满300g奶滴，快打开小程序去商城兑换吧！");
            }
            $.grass_seed = results.result.grass_seed;

            if (!isUpdateData) {
                msg += `\n💪💪💪 ${nickname}(ID：${userid})已签到${signcount}天, 当前拥有${$.grass_seed}颗牧草种子和${milk}g奶滴`;
                $.message += msg
            }
        } else if (type == "Getanswer") {
            $.ispaly = results.result.ispaly == 1
            let answerlist = results.result.answerlist;
            if (answerlist != 'null' && answerlist.length > 0) {
                msg += "成功";

                var answer = "";
                var index = 0;

                for (const obj of answerlist) {
                    if (index > 0 && index % 4 == 0) {
                        answer += " ";
                    }
                    ;
                    answer += obj.answer_right;
                    index += 1;

                    // 处理答案
                    let answerObj = {
                        "question_id": `${obj.id}`,
                        "question_answer": `${obj.answer_right}`,
                        "time_interval": ""
                    };
                    $.answerList.push(answerObj);
                }

                msg += `\n🎊🎊🎊 特仑苏限时闯关正确答案：${answer}`;

                $.message += msg
            } else {
                msg += "失败";
                if (!$.autoAnswer) {
                    msg += "\n活动时间：每周六12:00-周日23:59";
                }
            }
        } else if (type == "AddanswerOrder") {
            msg += "成功";
            let getalfalfa = results.result.getalfalfa;
            msg += `\n获得${getalfalfa}g 草种奖励`;

            $.message += msg
        } else if (type == "AddShare") {
            msg += "成功, 草种 +100g";

            $.message += msg
        } else {
            msg += "成功";

            $.message += msg
        }

        $.log(msg);
        resolve(false);
    })
}

function taskUrl(function_path) {
    return {
        url: `${TLS_API_HOST}method=${function_path}`,
        headers: {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Content-Length": "0",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": $.cookie,
            "Host": "xw.mengniu.cn",
            "Origin": "https://xw.mengniu.cn",
            "Referer": "https://xw.mengniu.cn/grass/index.html?dmcode=&si=&Scene=defualt&SceneValue=1089&UserID=64563&v=878&hmsr=defualt&sharetype=&fromUserId=&fromGrowthid=",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.4(0x18000428) NetType/WIFI Language/zh_CN miniProgram"
        },
    };
}

function showMsg() {
    return new Promise(resolve => {
        if ($.showAlert) {
            $.msg($.name, '', `${$.message}\n该脚本最后更新于：${$.lastUpdate} by Kenji`, {"media-url": "https://raw.githubusercontent.com/borrrrring/js_fun/master/tls.png"});
        } else {
            $.log(`${$.message}\n该脚本最后更新于：${$.lastUpdate} by Kenji`, {"media-url": "https://raw.githubusercontent.com/borrrrring/js_fun/master/tls.png"})
        }
        resolve();
    });
}

function getCookie() {
    try {
        if ($request && $request.method != 'OPTIONS' && $request.url.indexOf("GetMyPrize") >= 0) {
            headers = $request.headers;
            let referer = headers.Referer;
            let userid = getQueryParam(referer, "UserID");
            let newCookie = headers.Cookie;
            
            let isUpdateCK = false
            $.log(`USERID：\n${userid} COOKIE：\n${newCookie}\n`)
            let oldCookies;
            try {
                oldCookies = JSON.parse($.getdata("tls_daily_ck"));
            } catch (e) {
                $.log(e);
            }
            let finalCookies = "";
            if (typeof oldCookies != "undefined" && oldCookies instanceof Array) {

                for (obj of oldCookies) {
                    if (obj["userid"] == userid) {
                        obj["cookie"] = newCookie;
                        isUpdateCK = true
                    }
                }
                if (!isUpdateCK) {
                    oldCookies.push({ "userid": userid, "cookie": newCookie })
                }

                finalCookies = JSON.stringify(oldCookies);
            } else {
                finalCookies = JSON.stringify([{ "userid": userid, "cookie": newCookie }]);
            }

            var ret = $.setdata(finalCookies, "tls_daily_ck");
            if ($.showCKAlert && ret) {
                $.msg($.name, '写入ck成功', $.getdata("tls_daily_ck"));
            }
        }
        $.done({})
    } catch (e) {
        $.logErr(e)
    } finally {
        $.done({})
    }
}

function getQueryParam(url, key) {
    if (!key) {
        return false;
    }

    var value = '';
    var paramStr = url.split("?").pop();

    if (paramStr) {
        paramStr.split('&').forEach(function (param) {
            var arr = param.split('=');
            if (arr[0] == key) {
                value = arr[1];
            }
        });
    }

    return value;
}

// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
