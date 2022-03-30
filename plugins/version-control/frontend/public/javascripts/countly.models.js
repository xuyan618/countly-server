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
                channel: 'official',
                versionStatus: 0
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
                },
                isLoading: false,///网络请求状态
            };
        };

        var getters = {
            versionTableData: function (state) {
                return state.versionTableData;
            },
            queryParams: function (state) {
                return state.queryParams;
            },
            isLoading: function (state) {
                return state.isLoading;
            }
        };

        var actions = {
            initialize: function (context) {
                context.dispatch("refresh");
            },
            refresh: function (context) {
                context.dispatch("versionTableData");
            },
            versionTableData: function (context) {
                context.commit("setIsLoading", true);
                return $.when($.ajax({
                    type: "GET",
                    url: countlyCommon.API_URL + "/i/appversion",
                    data: {
                        app_id: countlyCommon.ACTIVE_APP_ID,
                        method: 'get-all-versions'
                    }
                })).then(function (obj) {
                    context.commit("setVersionTableData", obj);
                    context.commit("setIsLoading", false);
                }).catch(function () {
                    context.commit("setIsLoading", false);
                });
            }
        };

        var mutations = {
            setVersionTableData: function (state, val) {
                state.versionTableData = val;
            },
            setIsLoading: function (state, vale) {
                state.isLoading = vale;
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
                            app_id: countlyCommon.ACTIVE_APP_ID,
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
                            "app_id": countlyCommon.ACTIVE_APP_ID,
                            "id": id,
                            method: "delete"
                        },
                        dataType: "json"
                    }));
                },
                status: function (context, updates) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_PARTS.data.w + "/vue_example/status",
                        data: {
                            "app_id": countlyCommon.ACTIVE_APP_ID,
                            "records": JSON.stringify(updates)
                        },
                        dataType: "json"
                    }));
                },
                fetchAll: function (context) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_URL + "/o",
                        data: {
                            app_id: countlyCommon.ACTIVE_APP_ID,
                            method: 'vue-records'
                        }
                    })).then(function (res) {
                        context.commit("setAll", res);
                    });
                },
                fetchSingle: function (context, id) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_URL + "/o",
                        data: {
                            app_id: countlyCommon.ACTIVE_APP_ID,
                            method: 'vue-records',
                            id: id
                        }
                    })).then(function (records) {
                        return records[0];
                    });
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