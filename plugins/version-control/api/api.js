require('./parts/rc');
var pluginOb = {},
    plugins = require('../../pluginManager.js'),
    common = require('../../../api/utils/common.js'),
    log = common.log('mgmt:apps');

const {validateUserForWrite} = require("../../../api/utils/rights");

(function () {
    plugins.register("/i/appversion", function (ob) {
        var validateUserForDataReadAPI = ob.validateUserForDataReadAPI;

        var params = ob.params;

        if (params.qstring.method === "get-all-versions") {
            log.i("获取版本信息:", params.qstring);

            return new Promise(function (resolve, reject) {
                // params.qstring.app_id = params.app_id;
                params.app_user = params.app_user || {};

                validateUserForDataReadAPI(params, function () {
                    var query = {"appid": ob.params.qstring.app_id};
                    ///更新类型
                    if (ob.params.qstring.updateType) {
                        query.updateType = parseInt(ob.params.qstring.updateType);
                    }
                    ///版本
                    if (ob.params.qstring.appVersion) {
                        query.appVersion = {$regex: ob.params.qstring.appVersion};
                    }
                    ///上下架
                    if (ob.params.qstring.versionStatus) {
                        query.versionStatus = parseInt(ob.params.qstring.versionStatus);
                    }
                    ///渠道
                    if (ob.params.qstring.channelCode) {
                        query.channelCode = ob.params.qstring.channelCode;
                    }
                    common.db.collection("app_version").find(query).toArray(function (err, records) {
                        common.returnOutput(params, records || []);
                    });
                });
                return true;
            });
        } else if (params.qstring.method === "save") {
            log.i("新增版本信息:", params.qstring);

            validateUserForWrite(params, function (callBackResult) {
                let record = params.qstring.record;
                record = JSON.parse(record);
                record.appid = params.qstring.app_id;
                record.createdBy = callBackResult.member.username;
                if (!record._id) {
                    record.createdTime = new Date();
                    return common.db.collection("app_version").insert(record, function (err, result) {
                        let response = {"message": "版本新增成功", "code": 10000};
                        if (!err) {
                            common.returnOutput(params, JSON.stringify(response));
                        } else {
                            response.message = "版本新增失败"
                            response.code = 10001
                            common.returnOutput(params, JSON.stringify(response));
                        }
                    });
                } else {
                    record.editTime = new Date();
                    const id = record._id;
                    delete record._id;
                    return common.db.collection("app_version").findAndModify({_id: common.db.ObjectID(id)}, {}, {$set: record}, function (err, result) {
                        let response = {"message": "版本更新成功", "code": 10000};
                        if (!err) {
                            common.returnOutput(params, JSON.stringify(response));
                        } else {
                            response.message = "版本更新失败"
                            response.code = 10001
                            common.returnOutput(params, JSON.stringify(response));
                        }

                    });
                }
            });
            return true;
        } else if (params.qstring.method === "delete") {
            log.i("删除版本信息:", params.qstring);
            validateUserForWrite(params, function (callBackResult) {
                let parameterId = params.qstring.id;
                let collectionName = "app_version";
                common.db.collection(collectionName).findOne({"_id": common.db.ObjectID(parameterId)}, function (err, parameter) {
                    let response = {"message": "版本删除成功", "code": 10000};
                    if (!err) {
                        common.db.collection(collectionName).remove({_id: common.db.ObjectID(parameterId)}, function (removeErr) {
                            if (!removeErr) {
                                return common.returnOutput(params, JSON.stringify(response));
                            }
                            response.message = "应用修改失败，请重试"
                            response.code = 10001;
                            return common.returnOutput(params, JSON.stringify(response));
                        });
                    } else {
                        response.message = "应用不存在，请重试"
                        response.code = 10002;
                        return common.returnOutput(params, JSON.stringify(response));
                    }
                });
            });
            return true;
        }
    });

    plugins.register("/i/appchannel", function (ob) {
        var validateUserForDataReadAPI = ob.validateUserForDataReadAPI;
        var params = ob.params;
        if (params.qstring.method === "get-all-channel") {
            log.i("获取渠道信息:", params.qstring);

            return new Promise(function (resolve, reject) {
                // params.qstring.app_id = params.app_id;
                params.app_user = params.app_user || {};

                validateUserForDataReadAPI(params, function () {
                    var query = {};
                    if (ob.params.qstring.id) {
                        query = {"app_id": params.app_id};
                    }
                    common.db.collection("app_channel").find(query).toArray(function (err, records) {
                        common.returnOutput(params, records || []);
                    });
                });
                return true;
            });
        } else if (params.qstring.method === "save") {
            log.i("新增渠道信息:", params.qstring);

            validateUserForWrite(params, function (callBackResult) {
                let record = params.qstring.record;
                record = JSON.parse(record);
                record.appid = params.qstring.app_id;
                record.createdBy = callBackResult.member.username;
                common.db.collection("app_channel").findOne({channelCode: record.channelCode}, function (err, parameter) {
                    let response = {"message": "渠道更新成功", "code": 10000};

                    if (!err) {
                        if (parameter != null) {
                            record.editTime = new Date();
                            return common.db.collection("app_channel").findAndModify({channelCode: record.channelCode}, {}, {$set: record}, function (err, result) {
                                if (!err) {
                                    common.returnOutput(params, JSON.stringify(response));
                                } else {
                                    response.message = "渠道更新失败"
                                    response.code = 10001
                                    common.returnOutput(params, JSON.stringify(response));
                                }
                            });
                        } else {
                            record.createdTime = new Date();
                            return common.db.collection("app_channel").insert(record, function (err, result) {
                                response = {"message": "渠道新增成功", "code": 10000};
                                if (!err) {
                                    common.returnOutput(params, JSON.stringify(response));
                                } else {
                                    response.message = "渠道新增失败"
                                    response.code = 10002
                                    common.returnOutput(params, JSON.stringify(response));
                                }
                            });
                        }

                    } else {
                        response.message = "渠道查询失败"
                        response.code = 10001
                        common.returnOutput(params, JSON.stringify(response));
                    }
                });

            });
            return true;
        }
    });

    const formatDate = (date, fmt) => {
        const padLeftZero = str => {
            return ('00' + str).substr(str.length);
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        let o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds()
        };
        for (let k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
                let str = o[k] + '';
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
            }
        }
        return fmt;
    };

    plugins.register("/o/appversion", async function (ob) {
        var params = ob.params;
        log.i("获取版本信息:", params.qstring);
        let response = await queryAppVersion(params);
        common.returnOutput(params, response);
    });

    async function queryAppVersion(params) {
        let appquery = {};
        if (params.qstring.appid) {
            appquery.appid = params.qstring.appid;
        }
        let apps = await common.db.collection("apps").find(appquery).toArray();
        let response = {message: "应用获取成功", code: 10000, Dlist: []};
        if (apps.length === 0) {
            response.message = "还没有创建应用";
            response.code = 10002;

            return JSON.stringify(response);
        }
        let versionquery = {};
        if (params.qstring.platform) {
            if (params.qstring.platform === "Android") {
                versionquery.clientType = 1;
            } else if (params.qstring.platform === "iOS") {
                versionquery.clientType = 0;
            }
        }
        ///已上架
        versionquery.versionStatus = 1;
        ///全量发布
        versionquery.grayReleased = 0;
        ///渠道
        versionquery.channelCode = "official";

        for (let i = 0; i < apps.length; i++) {
            let appMap = apps[i];
            versionquery.appid = appMap._id.toString();
            let appResponse = {};
            appResponse.id = appMap.key;
            appResponse.name = appMap.name;
            response.Dlist.push(appResponse);

            let records = await common.db.collection("app_version").find(versionquery).toArray();
            for (let j = 0; j < records.length; j++) {
                let appVersion = records[j];
                if (appVersion.clientType === "1") {
                    appResponse.Dandroid = appVersion.staticServerUrl;
                } else if (appVersion.clientType === "2") {
                    appResponse.DiOS = appVersion.staticServerUrl;
                }
                let versionDate = new Date(appVersion.createdTime);
                if (appVersion.editTime) {
                    versionDate = new Date(appVersion.editTime);
                }
                appResponse.updateTime = formatDate(versionDate, 'yyyy-MM-dd hh:mm:ss');
                appResponse.mark = appVersion.versionDescription;
            }
        }
        return JSON.stringify(response);
    }

}(pluginOb));

module.exports = pluginOb;