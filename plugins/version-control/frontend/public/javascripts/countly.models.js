/*global $, countlyCommon, _, countlyVue */

(function (countVersionControl) {


    countVersionControl.factory = {
        getEditFormEmpty: function (fields) {
            fields = fields || {};
            var original = {
                _id: null,
                appVersion: '1.0.1.1',
                allowLowestVersion: '1.0.1.0',
                updateType: 0,
                versionDescription: '布范围全量发布布范围全量发布',
                grayReleased: 0,
                staticServerUrl: 'http://www.baidu.com'
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
                }
            };
        };

        var getters = {

            versionTableData: function (state) {
                return state.versionTableData;
            },
            queryParams: function (state) {
                return state.queryParams;
            }
        };

        var actions = {
            initialize: function (context) {
                context.dispatch("refresh");
            },
            refresh: function (context) {
                context.dispatch("countVersionControl/myRecords/fetchAll", null, {root: true});
                context.dispatch("versionTableData");
            },
            versionTableData: function (context) {
                return $.when($.ajax({
                    type: "GET",
                    url: countlyCommon.API_URL + "/i/appversion",
                    data: {
                        app_id: countlyCommon.ACTIVE_APP_ID,
                        method: 'get-all-versions'
                    }
                })).then(function (obj) {
                    context.commit("setVersionTableData", obj);
                });
            }
        };

        var mutations = {
            setVersionTableData: function (state, val) {
                state.versionTableData = val;
            }
        };

        // Paged Resource
        var tooManyRecordsResource = countlyVue.vuex.Module("tooManyRecords", {
            resetFn: function () {
                return {
                    paged: {
                        rows: []
                    },
                    requestParams: {}
                };
            },
            getters: {
                paged: function (state) {
                    return state.paged;
                }
            },
            mutations: {
                setPaged: function (state, val) {
                    state.paged = val;
                },
                setRequestParams: function (state, val) {
                    state.requestParams = val;
                }
            },
            actions: {
                fetchPaged: function (context) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_URL + "/o",
                        data: {
                            app_id: countlyCommon.ACTIVE_APP_ID,
                            method: 'large-col',
                            table_params: JSON.stringify(context.state.requestParams)
                        }
                    }))
                        .then(function (res) {
                            context.commit("setPaged", res);
                        })
                        .catch(function () {
                            context.commit("setPaged", {
                                rows: [],
                                totalRows: 0,
                                notFilteredTotalRows: 0
                            });
                        });
                }
            }
        });

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
                        url: countlyCommon.API_PARTS.data.w + "/appversion/save",
                        data: {
                            "app_id": countlyCommon.ACTIVE_APP_ID,
                            "record": JSON.stringify(record)
                        },
                        dataType: "json"
                    }));
                },
                remove: function (context, id) {
                    return $.when($.ajax({
                        type: "GET",
                        url: countlyCommon.API_PARTS.data.w + "/appversion/delete",
                        data: {
                            "app_id": countlyCommon.ACTIVE_APP_ID,
                            "id": id
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
            submodules: [recordsResource, tooManyRecordsResource]
        });
    };

})(window.countlyVersionControl = window.countlyVersionControl || {});