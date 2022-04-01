/*global app, countlyVue, countlyVueExample, countlyGlobal, countlyCommon, validators, extendViewWithFilter */

const versionStatus = [
    {
        label: '未上架', value: 0
    }, {
        label: '已上架', value: 1
    }];
const updateTypes = [
    {
        label: '强制更新', value: 0
    },
    {
        label: '一般更新', value: 1
    },
    {
        label: '静默更新', value: 2
    },
    {
        label: '可忽略更新', value: 3
    },
    {
        label: '静默可忽略更新', value: 4
    }];
const grayReleaseds = [
    {
        label: '全量发布', value: 0
    }, {
        label: '白名单发布', value: 1, disabled: true
    }, {
        label: 'IP发布', value: 2, disabled: true
    }];

var VersionsView = countlyVue.views.BaseView.extend({
    template: '#version-control-list-template',

    data: function () {
        const validateTwoAppVersion = (rule, value, callback) => {
            if (value !== this.twoConfirm.appVersion) {
                callback(new Error('输入的版本号不符,请重试'));
            } else {
                callback();
            }
        };
        /**
         * 根据日期时间戳返回指定格式日期
         * @param date
         * @param fmt format 日期格式
         * @returns string
         */
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

        return {
            currentPage: 1,
            // total: 0,
            pageSize: 10, // 类型筛选
            updateTypes: [
                {
                    label: '强制更新', value: 0
                }, {
                    label: '一般更新', value: 1
                }, {
                    label: '静默更新', value: 2
                }, {
                    label: '可忽略更新', value: 3
                }, {
                    label: '静默可忽略更新', value: 4
                }], // table
            columns: [
                {
                    type: 'index', fixed: 'left', width: 50
                },
                {
                    title: 'App类型', width: 100, fixed: 'left', render: (h, params) => {
                        return h('div', this.clientTypeFilter(params.row.clientType));
                    }
                },
                {
                    title: '渠道', width: 80, render: (h, params) => {
                        return h('div', this.channelTypeFilter(params.row.channelCode));
                    }
                },
                {
                    title: '版本号', key: 'appVersion', width: 110, fixed: 'left'
                },
                {
                    title: '允许最低版本', minWidth: 140, key: 'allowLowestVersion'
                },
                {
                    title: '更新类型', minWidth: 140, render: (h, params) => {
                        return h('div', this.updateTypeFilter(params.row.updateType));
                    }
                },
                {
                    title: '更新描述', width: 90, align: 'center', render: (h, params) => {
                        return h('div', [h('Button', {
                            props: {
                                type: 'info', size: 'small'
                            }, on: {
                                click: () => {
                                    this.$Modal.confirm({
                                        width: '800', cancelText: ' ', render: (h) => {
                                            return h('div', [h('h2', {
                                                style: {
                                                    fontSize: '20px',
                                                    marginBottom: '10px',
                                                    marginTop: '-10px',
                                                    borderBottom: '1px solid #f7f7f7',
                                                    paddingBottom: '10px'
                                                }
                                            }, '更新描述'), h('pre', {
                                                style: {
                                                    overflow: 'hidden', overflowX: 'auto'
                                                }
                                            }, params.row.versionDescription)]);
                                        }
                                    });
                                }
                            }
                        }, '查看')]);
                    }
                }, {
                    title: '上下架', width: 90, align: 'center', render: (h, params) => {
                        return h('div', [h('i-switch', {
                            props: {
                                value: params.row.versionStatus === 1
                            }, on: {
                                'on-change': (value) => {
                                    if (value === true) {
                                        console.log('应用版本上架');
                                        this.twoConfirm = params.row;
                                        this.twoConfirm.versionStatus = 1;
                                        this.inTwoConfirm = true;
                                    } else {
                                        console.log('应用版本下架');
                                        this.putChangeStatus(params.row, 0);
                                    }
                                }
                            }
                        })]);
                    }
                }, {
                    title: '静态服务器地址', minWidth: 200, render: (h, params) => {
                        return h('div', {
                            style: `display: -webkit-box;
                                -webkit-box-orient: vertical;
                                -webkit-line-clamp: 2;
                                height: 24px;
                                overflow: hidden;
                                line-height: 1;
                                font-size: 12px;`, on: {
                                click: () => {
                                    this.$Modal.confirm({
                                        cancelText: ' ', render: h => {
                                            return h('p', {
                                                style: 'word-wrap: break-word;'
                                            }, params.row.staticServerUrl);
                                        }
                                    });
                                }
                            }
                        }, params.row.staticServerUrl);
                    }
                }, {
                    title: '灰度发布', minWidth: 140, render: (h, params) => {
                        return h('div', this.grayReleasedFilter(params.row.grayReleased));
                    }
                }, {
                    title: '编辑时间', width: 180, render: (h, params) => {
                        var date = new Date(params.row.editTime);
                        if (params.row.editTime == null) date = new Date(params.row.createdTime);
                        return h('div', formatDate(date, 'yyyy-MM-dd hh:mm:ss'));
                    }
                }, {
                    title: '添加者', key: 'createdBy', minWidth: 140
                }, {
                    title: '操作', width: 220, fixed: 'right', render: (h, params) => {
                        return h('div', [
                            h('Button', {
                                props: {
                                    type: 'success', size: 'small'
                                }, style: {
                                    marginRight: '12px'
                                }, on: {
                                    click: () => {
                                        this.$Message.error('暂时不支持安装包上传');
                                    }
                                }
                            }, '包管理'),
                            h('Button', {
                                props: {
                                    type: 'primary', size: 'small'
                                }, style: {
                                    marginRight: '12px'
                                }, on: {
                                    click: () => {
                                        this.$emit("open-versionDrawer", "version", params.row);
                                    }
                                }
                            }, '编辑'),
                            h('Poptip', {
                                props: {
                                    confirm: true,
                                    transfer: true,
                                    width: 260,
                                    placement: 'top-end',
                                    title: '确定删除[' + params.row.appVersion + ']版本吗？'
                                }, on: {
                                    'on-ok': (value) => {
                                        this.delIOS(params.row._id);
                                    }
                                }
                            }, [h('Button', {
                                props: {
                                    type: 'error', size: 'small'
                                }
                            }, '删除')])]);
                    }
                }], // search
            versionStatus,
            inTwoConfirm: false,
            twoConfirm: {
                id: '',
                appVersion: '',
                allowLowestVersion: '',
                updateType: '',
                grayReleased: '',
                createdBy: '',
                twoAppVersion: ''
            },
            twoConfirmRule: {
                twoAppVersion: [{required: true, message: '请输入当前上架的版本号', trigger: 'blur'}, {
                    required: true, validator: validateTwoAppVersion, trigger: 'blur'
                }]
            }
        };
    },
    computed: {
        tableList: function () {
            return this.$store.getters["countlyVersionControl/versionTableData"];
        },
        total: function () {
            return this.tableList.length;
        },
        queryParams: function () {
            return this.$store.getters["countlyVersionControl/queryParams"];
        },
        isLoading() {
            return false;
        },
        channelData: function () {
            return this.$store.getters["countlyVersionControl/channelData"];
        },
        channelTypeFilter: function () {
            return function (channelCode) {
                if (channelCode === null || this.channelData === null || this.channelData.length === 0) return '未知';
                let targetDesc = "未知:" + channelCode;
                for (const channelCodeKey in this.channelData) {
                    if (this.channelData[channelCodeKey].channelCode === channelCode) {
                        targetDesc = this.channelData[channelCodeKey].channelDesc;
                        break;
                    }
                }
                return targetDesc
            }
        }
    },
    created() {
        this.$Message.config({
            top: 70,
            duration: 3
        });
        this.$Notice.config({
            top: 70,
            duration: 3
        });
        this.getVersions();
    },
    methods: {
        refresh: function () {
            console.log("定制更新机制");
            // this.getVersions();
        },

        getVersions() {
            this.$store.dispatch("countlyVersionControl/versionTableData", this.queryParams);
            this.$store.dispatch("countlyVersionControl/channelData");
        },

        async delIOS(params) {
            this.$store.dispatch("countlyVersionControl/myRecords/remove", params).then((response) => {
                response = JSON.parse(response);
                if (response.code === 10000) {
                    this.$Notice.success({
                        title: '请求成功', desc: response.message
                    });
                    this.getVersions();
                } else {
                    this.$Notice.error({
                        title: '请求成功', desc: response.message
                    });
                }

            });
        },

        putChangeStatus(params, status) {
            params.versionStatus = status;
            this.$store.dispatch("countlyVersionControl/myRecords/save", params).then(response => {
                response = JSON.parse(response);

                if (response.code === 10000) {
                    this.$Notice.success({
                        title: '请求成功', desc: response.message
                    });
                    this.getVersions();
                } else {
                    this.$Notice.error({
                        title: '请求失败', desc: response.message
                    });
                }
            });
        },

        changePageSize(size) {
            this.pageSize = size;
            this.getVersions();
        },
        toAndroidPage() {
            let androidModel = countlyVersionControl.factory.getEditFormEmpty();
            androidModel.clientType = "1";///Android
            this.$emit("open-versionDrawer", "version", androidModel);
        },
        toIOSPage() {
            let iOSModel = countlyVersionControl.factory.getEditFormEmpty();
            iOSModel.clientType = "2";///iOS
            this.$emit("open-versionDrawer", "version", iOSModel);
        },
        toChannelPage() {
            let channelModel = {"channelCode": "", "channelDesc": ""};
            this.$emit("open-versionDrawer", "channel", channelModel);
        },
        searchVersions() {
            this.currentPage = 1;
            this.getVersions();
        },
        clientTypeFilter(num) {
            if (isNaN(num)) return '未知';
            let word;
            switch (num) {
                case "1":
                    word = 'Android';
                    break;
                case "2":
                    word = 'iOS';
                    break;
                default:
                    word = '未知';
            }
            return word;
        },

        // channelTypeFilter(channel) {
        //
        //     let channelStr = "渠道"
        //     switch (channel) {
        //         case "official":
        //             channelStr = "官方"
        //             break;
        //         case "360":
        //             channelStr = "360"
        //             break
        //         case "xiaomi":
        //             channelStr = "小米"
        //             break
        //         case "huawei":
        //             channelStr = "华为"
        //             break
        //         case "yingyongbao":
        //             channelStr = "应用宝"
        //             break
        //     }
        //     return channelStr;
        // },

        updateTypeFilter(num) {
            if (isNaN(num)) return '一般更新';

            let word;
            switch (num) {
                case 0:
                    word = '强制更新';
                    break;
                case 1:
                    word = '一般更新';
                    break;
                case 2:
                    word = '静默更新';
                    break;
                case 3:
                    word = '可忽略更新';
                    break;
                case 4:
                    word = '静默可忽略更新';
                    break;
                default:
                    word = '一般更新';
            }
            return word;
        },
        grayReleasedFilter(num) {
            if (isNaN(num)) return '全量发布';

            let word;
            switch (num) {
                case 0:
                    word = '全量发布';
                    break;
                case 1:
                    word = '白名单发布';
                    break;
                case 2:
                    word = 'IP 发布';
                    break;
                default:
                    word = '全量发布';
            }
            return word;
        },
        twoConfirmCancel() {
            this.getVersions();
            this.inTwoConfirm = false;
        },
        twoConfirmSubmit(name) {
            this.$refs[name].validate((valid) => {
                if (!valid) {
                    this.$Message.error('请先完成所有必填项内容!');
                    return false;
                }
                this.putChangeStatus(this.twoConfirm, 1);
                this.inTwoConfirm = false;
            });
        },
    }
});

var VersionEditView = countlyVue.views.BaseView.extend({
    template: '#version-control-edit-template',
    computed: {
        stepValidations: function () {
            return {
                // "step1": !(this.$v.editedObject.name.$invalid || this.$v.editedObject.field1.$invalid || this.$v.editedObject.field2.$invalid),
                // "step3": !(this.$v.editedObject.selectedProps.$invalid)
            };
        },
        channelCodes: function () {
            return this.$store.getters["countlyVersionControl/channelData"];
        }
    },

    data: function () {
        const validateInput = (rule, value, callback) => {
            if (value !== value.trim()) {
                callback(new Error('请移除前后空格'));
            } else {
                callback();
            }
        };
        return {
            isEdit: false,
            androidId: 0,
            inLoading: false,
            app: {appName: countlyGlobal.apps[countlyCommon.ACTIVE_APP_ID].name},
            editForm: countlyVersionControl.factory.getEditFormEmpty(),
            editFormRule: {
                appVersion: [{required: true, message: '请输入版本号', trigger: 'blur'}, {
                    required: true, type: 'string', max: 32, message: '过长的版本号', trigger: 'blur'
                }, {
                    required: true,
                    pattern: /^([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})$/g,
                    message: '请输入符合规范的版本号，最大版本号为999999.999999.999999.999999',
                    trigger: 'blur'
                }, {required: true, validator: validateInput, trigger: 'blur'}],
                allowLowestVersion: [{required: true, message: '请输入最低版本号', trigger: 'blur'}, {
                    required: true, type: 'string', max: 32, message: '过长的版本号', trigger: 'blur'
                }, {
                    required: true,
                    pattern: /^([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})$/g,
                    message: '请输入符合规范的版本号，最大版本号为999999.999999.999999.999999',
                    trigger: 'blur'
                }, {required: true, validator: validateInput, trigger: 'blur'}],
                updateType: [{type: 'number', required: true, message: '请选择更新类型', trigger: 'change'}],
                channelCode: [{type: 'string', required: true, message: '请选择渠道', trigger: 'change'}],
                versionDescription: [{required: true, message: '请输入版本描述内容', trigger: 'blur'}, {
                    required: true, validator: validateInput, trigger: 'blur'
                }],
                grayReleased: [{type: 'number', required: true, message: '请选择发布范围', trigger: 'change'}],
                staticServerUrl: [{required: true, message: '请输入静态服务器地址', trigger: 'blur'}, {
                    required: true, validator: validateInput, trigger: 'blur'
                }]
            },
            updateTypes,
            grayReleaseds
        };
    },

    filters: {
        updateTypeFilter(type) {
            let o = updateTypes.find(item => {
                return item.value === type;
            });

            return o != null ? o.label : '';
        }, grayReleasedFilter(type) {
            let o = grayReleaseds.find(item => {
                return item.value === type;
            });

            return o != null ? o.label : '';
        }
    },
    methods: {
        created() {
            this.$store.dispatch("countlyVersionControl/channelData");
        },

        beforeLeavingStep: function () {
            if (this.currentStepId === "step1") {
                [this.$v.editedObject.appVersion, this.$v.editedObject.allowLowestVersion, this.$v.editedObject.versionDescription].forEach(function (validator) {
                    validator.$touch();
                });
            } else if (this.currentStepId === "step3") {
                this.$v.editedObject.selectedProps.$touch();
            }
        },
        handleReset: function (name) {
            console.log('清空数据')
            this.$refs[name].resetFields();
        }
    }, // validations: this.editFormRule
});

var VersionDrawer = countlyVue.components.BaseDrawer.extend({

    methods: {
        afterObjectCopy: function (newState) {
            if (newState._id !== null) {
                this.title = "编辑版本信息";
                this.saveButtonLabel = "保存";
            } else {
                this.title = "新增版本信息";
                this.saveButtonLabel = "保存";
            }
            this.$parent.$refs.editView.editForm = newState;
            this.$parent.$refs.editView.$refs.editFormRule.model = newState;
            return newState;
        }
    },
    created() {
        console.log("VersionDrawer视图创建了");
    },
    validations: {},

});

var ChannelDrawer = countlyVue.components.BaseDrawer.extend({

    computed: {},

    data: function () {
        return {}
    },

    methods: {

        afterObjectCopy: function (newState) {
            if (newState.channelCode !== null) {
                this.title = "编辑渠道";
            } else {
                this.title = "新增渠道";
            }
            this.saveButtonLabel = "保存";
            this.$store.dispatch("countlyVersionControl/channelData");
            return newState;
        }
    },
    validations: {
        editedObject: {
            channelCode: {
                required: validators.required
            },
            channelDesc: {
                required: validators.required
            }
        }
    }
});

var MainView = countlyVue.views.BaseView.extend({
    template: '#version-control-main-template',
    mixins: [countlyVue.mixins.hasDrawers(["version", "channel"])],
    components: {
        "list-view": VersionsView,
        "version-drawer": VersionDrawer,
        "channel-drawer": ChannelDrawer,
        "edit-view": VersionEditView
    },
    computed: {
        channelTableList: function () {
            // return [{},{}]
            return this.$store.getters["countlyVersionControl/channelData"];
        }
    },
    data() {
        return {
            channelColumns: [
                {
                    type: 'index', fixed: 'left', width: 50
                },
                {
                    title: '渠道编码', width: 100, fixed: 'left', render: (h, params) => {
                        return h('div', params.row.channelCode);
                    }
                },
                {
                    title: '渠道描述', width: 120, render: (h, params) => {
                        return h('div', params.row.channelDesc);
                    }
                }
            ],
            // search
            // channelTableList:[
            //     {channelCode:"测试",channelDesc:"渠道测试"}
            // ]
        };
    },
    created() {
        // this.getAndroids();
        this.$store.dispatch("countlyVersionControl/channelData");
    },
    methods: {
        onDrawerSubmit: function (doc) {
            console.log('提交版本按钮', doc);

            this.$refs.editView.$refs.editFormRule.validate((valid) => {
                if (!valid) {
                    this.$Message.error('请先完成所有必填项内容!');
                    return false;
                }
                this.$store.dispatch("countlyVersionControl/myRecords/save", doc).then(response => {
                    response = JSON.parse(response);

                    if (response.code === 10000) {
                        this.$Notice.success({
                            title: '请求成功', desc: response.message
                        });
                        this.$store.dispatch("countlyVersionControl/versionTableData");
                    } else {
                        this.$Notice.error({
                            title: '请求失败', desc: response.message
                        });
                    }
                });
            });
        },
        
        onChannelDrawerSubmit: function (channel) {
            console.log('提交渠道按钮', channel);
            this.$store.dispatch("countlyVersionControl/saveChannel", channel).then(response => {
                response = JSON.parse(response);

                if (response.code === 10000) {
                    this.$Notice.success({
                        title: '请求成功', desc: response.message
                    });
                    this.$store.dispatch("countlyVersionControl/channelData");
                } else {
                    this.$Notice.error({
                        title: '请求失败', desc: response.message
                    });
                }
            });
        }
    },

    beforeCreate: function () {
        this.$store.dispatch("countlyVersionControl/initialize");
    }
});

var vuex = [{
    clyModel: countlyVersionControl
}];

var versionControlView = new countlyVue.views.BackboneWrapper({
    component: MainView, vuex: vuex, templates: ["/version-control/templates/empty.html", {
        namespace: 'version-control', mapping: {
            'list-template': '/version-control/templates/list.html',
            'main-template': '/version-control/templates/main.html',
            'edit-template': '/version-control/templates/edit.html'
        }
    }]
});

app.versionControlView = versionControlView;

app.route("/version-control", 'version-control', function () {
    const params = {};
    this.versionControlView.params = params;
    this.renderWhenReady(this.versionControlView);
});

$(document).ready(function () {
    if (typeof extendViewWithFilter === "function") {
        app.versionControlView.hideDrillEventMetaProperties = true;
        extendViewWithFilter(app.versionControlView);
    }

    app.addMenu("improve", {
        code: "version-control",
        url: "#/version-control",
        text: "sidebar.version-control",
        icon: '<div class="logo"><i class="material-icons" style="transform:rotate(90deg)"> swap_vertical_circle </i></div>',
        priority: 20
    });
});