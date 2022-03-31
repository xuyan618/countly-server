/*global $, countlyCommon, _, countlyVue */

(function (countVersionControl) {

    countVersionControl.factory = {
        getEditFormEmpty: function (fields) {
            fields = fields || {};
            var original = {
                _id: null,
                appVersion: '1.0.1.1',
                allowLowestVersion: '1.0.1.0',
                updateType: 1,
                versionDescription: '布范围全量发布布范围全量发布',
                grayReleased: 0,
                staticServerUrl: 'http://www.baidu.com',
                versionStatus: 0,
                channelCode:'official'
            };
            return _.extend(original, fields);
        },
    };

    countVersionControl.getVuexModule = function () {

        var getEmptyState = function () {
            return {
                versionTableData: [],
                queryParams: {
                    updateType: "",
                    appVersion: "",
                    versionStatus: "",
                    channelCode:""
                },
                channelData: [],///渠道数据
            };
        };

        var getters = {
            versionTableData: function (state) {
                return state.versionTableData;
            },
            queryParams: function (state) {
                return state.queryParams;
            },
            channelData:function (state) {
                return state.channelData
            }
        };

        var actions = {
            initialize: function (context) {
                context.dispatch("refresh");
            },
            refresh: function (context) {
                context.dispatch("versionTableData");
            },
            versionTableData: function (context, query) {
                query = query?query:{};
                query.app_id = countlyCommon.ACTIVE_APP_KEY;
                query.method = 'get-all-versions';
                return $.when($.ajax({
                    type: "GET",
                    url: countlyCommon.API_URL + "/i/appversion",
                    data: query
                })).then(function (obj) {
                    context.commit("setVersionTableData", obj);
                }).catch(function () {
                    context.commit("setVersionTableData", []);
                });
            },
            channelData:function (context) {
                return $.when($.ajax({
                    type: "GET",
                    url: countlyCommon.API_URL + "/i/appchannel",
                    data: {
                        app_id: countlyCommon.ACTIVE_APP_KEY,
                        method: 'get-all-channel'
                    }
                })).then(function (obj) {
                    context.commit("setChannelData", obj);
                }).catch(function () {
                    context.commit("setChannelData", []);
                });
            },
            saveChannel:function (context,record) {
                return $.when($.ajax({
                    type: "GET",
                    url: countlyCommon.API_URL + "/i/appchannel",
                    data: {
                        app_id: countlyCommon.ACTIVE_APP_KEY,
                        method: 'save',
                        record: JSON.stringify(record),
                    }
                }))
            }
        };

        var mutations = {
            setVersionTableData: function (state, val) {
                state.versionTableData = val;
            },
            setChannelData:function (state, vale) {
                state.channelData = vale;
            }
        };

        // Paged Resource
        var recordsResource = countlyVue.vuex.Module("myRecords", {
            resetFn: function () {
                return {
                    all: []
                };
            },
            getters: {
                all: function (state) {
                    return state.all;
                }
            },
            mutations: {
                setAll: function (state, val) {
                    state.all = val;
                }
            },
            actions: {
                save: function (context, record) {
                    return $.when($.ajax({
                        type: "POST",
                        url: countlyCommon.API_PARTS.data.w + "/appversion",
                        data: {
                            app_id: countlyCommon.ACTIVE_APP_KEY,
                            record: JSON.stringify(record),
                            method: "save"
                        },
                        dataType: "json"
                    }))
                },
                remove: function (context, id) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_PARTS.data.w + "/appversion",
                        data: {
                            "app_id": countlyCommon.ACTIVE_APP_KEY,
                            "id": id,
                            method: "delete"
                        },
                        dataType: "json"
                    }));
                }
            }
        });

        return countlyVue.vuex.Module("countlyVersionControl", {
            resetFn: getEmptyState,
            getters: getters,
            actions: actions,
            mutations: mutations,
            submodules: [recordsResource]
        });
    };

})(window.countlyVersionControl = window.countlyVersionControl || {});