/*global app, countlyVue, countlyVueExample, countlyGlobal, countlyCommon, validators, extendViewWithFilter */
const versionStatus = [
    {
        label: '未上架',
        value: 0
    },
    {
        label: '已上架',
        value: 1
    }
];
const updateTypes = [
    {
        label: '强制更新',
        value: 0
    },
    {
        label: '一般更新',
        value: 1
    },
    {
        label: '静默更新',
        value: 2
    },
    {
        label: '可忽略更新',
        value: 3
    },
    {
        label: '静默可忽略更新',
        value: 4
    }
];
const grayReleaseds = [
    {
        label: '全量发布',
        value: 0
    },
    {
        label: '白名单发布',
        value: 1,
        disabled: true
    },
    {
        label: 'IP发布',
        value: 2,
        disabled: true
    }
];
var VersionsView = countlyVue.views.BaseView.extend(
    {
    template: '#version-control-list-template',

    data: function () {
        const validateTwoAppVersion = (rule, value, callback) => {
            if (value !== this.twoConfirm.appVersion) {
                callback(new Error('输入的版本号不符,请重试'));
            } else {
                callback();
            }
        };
        return {
            inLoading: false,
            // 分页
            currentPage: 1,
            total: 0,
            pageSize: 10,
            // 类型筛选
            updateTypes: [
                {
                    label: '强制更新',
                    value: 0
                },
                {
                    label: '一般更新',
                    value: 1
                },
                {
                    label: '静默更新',
                    value: 2
                },
                {
                    label: '可忽略更新',
                    value: 3
                },
                {
                    label: '静默可忽略更新',
                    value: 4
                }
            ],
            // table
            columns: [
                {
                    title: '#',
                    key: 'id',
                    fixed: 'left',
                    width: 80
                },
                {
                    title: '版本号',
                    key: 'appVersion',
                    width: 140,
                    fixed: 'left'
                },
                {
                    title: '允许最低版本',
                    minWidth: 140,
                    key: 'allowLowestVersion'
                },
                {
                    title: '更新类型',
                    minWidth: 140,
                    render: (h, params) => {
                        return h('div', this.updateTypeFilter(params.row.updateType));
                    }
                },
                {
                    title: '更新描述',
                    width: 90,
                    align: 'center',
                    render: (h, params) => {
                        return h('div', [
                            h('Button', {
                                props: {
                                    type: 'info',
                                    size: 'small'
                                },
                                on: {
                                    click: () => {
                                        this.$Modal.confirm({
                                            width: '800',
                                            cancelText: ' ',
                                            render: (h) => {
                                                return h('div', [
                                                    h('h2', {
                                                        style: {
                                                            fontSize: '20px',
                                                            marginBottom: '10px',
                                                            marginTop: '-20px',
                                                            borderBottom: '1px solid #f7f7f7',
                                                            paddingBottom: '10px'
                                                        }
                                                    }, '更新描述'),
                                                    h('pre', {
                                                        style: {
                                                            overflow: 'hidden',
                                                            overflowX: 'auto'
                                                        }
                                                    }, params.row.versionDescription)
                                                ]);
                                            }
                                        });
                                    }
                                }
                            }, '查看')
                        ]);
                    }
                },
                {
                    title: '上下架',
                    width: 90,
                    align: 'center',
                    render: (h, params) => {
                        return h('div', [
                            h('i-switch', {
                                props: {
                                    value: !(params.row.versionStatus === 0 || params.row.versionStatus === 2)
                                },
                                on: {
                                    'on-change': (value) => {
                                        if (value === true) {
                                            this.twoConfirm = {
                                                id: params.row.id,
                                                appVersion: params.row.appVersion,
                                                allowLowestVersion: params.row.allowLowestVersion,
                                                updateType: params.row.updateType,
                                                grayReleased: params.row.grayReleased,
                                                createdBy: params.row.createdBy
                                            };
                                            this.inTwoConfirm = true;
                                        } else {
                                            let status = params.row.versionStatus === 0 || params.row.versionStatus === 2 ? 'delivery' : 'undelivery';
                                            this.putChangeStatus(params.row.id, status);
                                        }
                                    }
                                }
                            })
                        ]);
                    }
                },
                {
                    title: '静态服务器地址',
                    minWidth: 200,
                    render: (h, params) => {
                        return h(
                            'div',
                            {
                                style: `display: -webkit-box;
                                -webkit-box-orient: vertical;
                                -webkit-line-clamp: 2;
                                height: 24px;
                                overflow: hidden;
                                line-height: 1;
                                font-size: 12px;`,
                                on: {
                                    click: () => {
                                        this.$Modal.confirm({
                                            cancelText: ' ',
                                            render: h => {
                                                return h(
                                                    'p',
                                                    {
                                                        style: 'word-wrap: break-word;'
                                                    },
                                                    params.row.staticServerUrl
                                                );
                                            }
                                        });
                                    }
                                }
                            },
                            params.row.staticServerUrl
                        );
                    }
                },
                {
                    title: '灰度发布',
                    minWidth: 140,
                    render: (h, params) => {
                        return h('div', this.grayReleasedFilter(params.row.grayReleased));
                    }
                },
                {
                    title: '添加时间',
                    width: 180,
                    render: (h, params) => {
                        var date = new Date(params.row.createdTime);
                        return h('div', formatDate(date, 'yyyy-MM-dd hh:mm:ss'));
                    }
                },
                {
                    title: '添加者',
                    key: 'createdBy',
                    minWidth: 140
                },
                {
                    title: '操作',
                    width: 220,
                    fixed: 'right',
                    render: (h, params) => {
                        return h('div', [
                            h('Button', {
                                props: {
                                    type: 'success',
                                    size: 'small'
                                },
                                style: {
                                    marginRight: '12px'
                                },
                                on: {
                                    click: () => {
                                        this.$Message.error('暂时不支持安装包上传');
                                        // this.$router.push({
                                        //     name: 'version-android_apk',
                                        //     params: {
                                        //         androidId: params.row.id
                                        //     }
                                        // });
                                    }
                                }
                            }, '包管理'),
                            h('Button', {
                                props: {
                                    type: 'primary',
                                    size: 'small'
                                },
                                style: {
                                    marginRight: '12px'
                                },
                                on: {
                                    click: () => {
                                        this.$router.push({
                                            name: 'version-android_edit',
                                            params: {
                                                androidId: params.row.id
                                            }
                                        });
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
                                },
                                on: {
                                    'on-ok': (value) => {
                                        this.delIOS(params.row.id);
                                    }
                                }
                            }, [
                                h('Button', {
                                    props: {
                                        type: 'error',
                                        size: 'small'
                                    }
                                }, '删除')
                            ])
                        ]);
                    }
                }
            ],
            // search
            queryParams: {
                appVersion: '',
                updateType: null,
                versionStatus: null
            },
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
                twoAppVersion: [
                    { required: true, message: '请输入当前上架的版本号', trigger: 'blur' },
                    { required: true, validator: validateTwoAppVersion, trigger: 'blur' }
                ]
            }
        };
    },
    computed: {
        tableList: function () {
            return this.$store.getters["countlyVersionControl/versionTableData"];
        },
        queryParams: function () {
            var queryParamsT = this.$store.getters["countlyVersionControl/queryParams"];
            console.log("queryParamsT:",queryParamsT);
            return queryParamsT;
        },
    },
        created() {
            // this.getAndroids();
            this.getVersions();
        },
    methods: {
        refresh: function () {
            // this.$store.dispatch("countlyVersionControl/fetchGraphPoints");
            console.log("更新列表");
        },
        getVersions(){
            this.$store.dispatch("countlyVersionControl/versionTableData");
        },
        async getAndroids () {
            this.inLoading = true;
            let response = this.$store.commit("countVersionControl/myRecords/fetchAll")
            console.log("fetchAll:",response);

            // let response = await http.get('/android', {
            //     params: {
            //         page: this.currentPage,
            //         pageSize: this.pageSize,
            //         appVersion: this.queryParams.appVersion,
            //         updateType: this.queryParams.updateType === undefined ? null : this.queryParams.updateType,
            //         versionStatus: this.queryParams.versionStatus === undefined ? null : this.queryParams.versionStatus
            //     }
            // });

            if (response.data.code === 200) {
                this.tableList = response.data.data.records;
                this.total = response.data.data.total;
                this.currentPage = response.data.data.current;
            } else {
                this.$Notice.error({
                    title: '请求失败',
                    desc: response.data.message
                });
            }

            this.inLoading = false;
        },
        async delIOS (id) {
            let response = await http.delete('/android/' + id);
            if (response.data.code === 200) {
                this.$Notice.success({
                    title: '请求成功',
                    desc: `删除版本[${response.data.data.appVersion}]成功`
                });
            } else {
                this.$Notice.error({
                    title: '请求失败',
                    desc: response.data.message
                });
            }

            this.getAndroids();
        },
        async putChangeStatus (id, status) {
            let response = await http.put('/android/' + id + '/' + status);
            let statusText = status === 'delivery' ? '上架' : '下架';

            if (response.data.code === 200) {
                this.$Notice.success({
                    title: '请求成功',
                    desc: `${statusText}成功`
                });
            } else {
                this.$Notice.error({
                    title: '请求失败',
                    desc: response.data.message
                });
            }

            this.getAndroids();
        },
        searchAndroids () {
            this.currentPage = 1;
            this.getAndroids();
        },
        changePageSize (size) {
            this.pageSize = size;
            this.getAndroids();
        },
        toCreatePage () {
            this.$emit("open-versionDrawer", "version", countlyVersionControl.factory.getEmpty());
        },

        updateTypeFilter (num) {
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
        grayReleasedFilter (num) {
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
        twoConfirmCancel () {
            let item = this.tableList.find(item => {
                return item.id === this.twoConfirm.id;
            });
            this.getAndroids();
            this.inTwoConfirm = false;
        },
        twoConfirmSubmit (name) {
            this.$refs[name].validate((valid) => {
                if (!valid) {
                    this.$Message.error('请先完成所有必填项内容!');
                    return false;
                }

                this.putChangeStatus(this.twoConfirm.id, 'delivery');
                this.inTwoConfirm = false;
            });
        }
    }
});

var VersionEditView = countlyVue.views.BaseView.extend(
    {
        template: '#version-control-edit-template',
        computed: {
            stepValidations: function () {
                return {
                    // "step1": !(this.$v.editedObject.name.$invalid || this.$v.editedObject.field1.$invalid || this.$v.editedObject.field2.$invalid),
                    // "step3": !(this.$v.editedObject.selectedProps.$invalid)
                };
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
                constants: {
                    "visibilityOptions": [
                        {label: "Global", value: "global", description: "Can be seen by everyone."},
                        {label: "Private", value: "private", description: "Can be seen by the creator."}
                    ],
                    "availableProps": [
                        {label: "Type 1", value: 1},
                        {label: "Type 2", value: 2},
                        {label: "Type 3", value: 3}
                    ]
                },
                isEdit: false,
                androidId: 0,
                inLoading: false,
                app: JSON.parse(localStorage.getItem('app') ? localStorage.getItem('app') : '{}'),
                editForm: {
                    appVersion: '',
                    allowLowestVersion: '',
                    updateType: 0,
                    versionDescription: '',
                    grayReleased: 0,
                    staticServerUrl: ''
                },
                editFormRule: {
                    appVersion: [
                        { required: true, message: '请输入版本号', trigger: 'blur' },
                        { required: true, type: 'string', max: 32, message: '过长的版本号', trigger: 'blur' },
                        { required: true, pattern: /^([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})$/g, message: '请输入符合规范的版本号，最大版本号为999999.999999.999999.999999', trigger: 'blur' },
                        { required: true, validator: validateInput, trigger: 'blur' }
                    ],
                    allowLowestVersion: [
                        { required: true, message: '请输入最低版本号', trigger: 'blur' },
                        { required: true, type: 'string', max: 32, message: '过长的版本号', trigger: 'blur' },
                        { required: true, pattern: /^([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})\.([0]|[1-9][0-9]{0,5})$/g, message: '请输入符合规范的版本号，最大版本号为999999.999999.999999.999999', trigger: 'blur' },
                        { required: true, validator: validateInput, trigger: 'blur' }
                    ],
                    updateType: [
                        { type: 'number', required: true, message: '请选择更新类型', trigger: 'change' }
                    ],
                    versionDescription: [
                        { required: true, message: '请输入版本描述内容', trigger: 'blur' },
                        { required: true, validator: validateInput, trigger: 'blur' }
                    ],
                    grayReleased: [
                        { type: 'number', required: true, message: '请选择发布范围', trigger: 'change' }
                    ],
                    staticServerUrl: [
                        { required: true, message: '请输入静态服务器地址', trigger: 'blur' },
                        { required: true, validator: validateInput, trigger: 'blur' }]
                },
                updateTypes,
                grayReleaseds
            };
        },
        filters: {
            updateTypeFilter (type) {
                let o = updateTypes.find(item => {
                    return item.value === type;
                });

                return o != null ? o.label : '';
            },
            grayReleasedFilter (type) {
                let o = grayReleaseds.find(item => {
                    return item.value === type;
                });

                return o != null ? o.label : '';
            }
        },
        methods: {
            beforeLeavingStep: function () {
                if (this.currentStepId === "step1") {
                    [this.$v.editedObject.name, this.$v.editedObject.field1, this.$v.editedObject.field2].forEach(function (validator) {
                        validator.$touch();
                    });
                } else if (this.currentStepId === "step3") {
                    this.$v.editedObject.selectedProps.$touch();
                }
            },

        },
        validations: {
            editedObject: {
                name: {
                    required: validators.required
                },
                field1: {
                    required: validators.required
                },
                field2: {
                    required: validators.required
                },
                selectedProps: {
                    required: validators.required,
                    minLength: validators.minLength(2)
                }
            }
        }
    }
);

var VersionDrawer = countlyVue.components.BaseDrawer.extend({
    computed: {
    },
    data: function () {
        return {
            constants: {
                "visibilityOptions": [
                    {label: "Global", value: "global", description: "Can be seen by everyone."},
                    {label: "Private", value: "private", description: "Can be seen by the creator."}
                ],
                "availableProps": [
                    {label: "Type 1", value: 1},
                    {label: "Type 2", value: 2},
                    {label: "Type 3", value: 3}
                ]
            },
        };
    },
    methods: {
        afterObjectCopy: function (newState) {
            if (newState._id !== null) {
                this.title = "Edit Record";
                this.saveButtonLabel = "Save Changes";
            } else {
                this.title = "新增版本信息";
                this.saveButtonLabel = "确认";
            }
            return newState;
        }
    },
    validations: {
        editedObject: {
            name: {
                required: validators.required
            },
            field1: {
                required: validators.required
            },
            field2: {
                required: validators.required
            },
            selectedProps: {
                required: validators.required,
                minLength: validators.minLength(2)
            }
        }
    }

});

var ChannelDrawer = countlyVue.components.BaseDrawer.extend({
    computed: {
        stepValidations: function () {
            return {
                "step1": !(this.$v.editedObject.name.$invalid || this.$v.editedObject.field1.$invalid || this.$v.editedObject.field2.$invalid),
                "step3": !(this.$v.editedObject.selectedProps.$invalid)
            };
        }
    },
    data: function () {
        return {
            constants: {
                "visibilityOptions": [
                    {label: "Global", value: "global", description: "Can be seen by everyone."},
                    {label: "Private", value: "private", description: "Can be seen by the creator."}
                ],
                "availableProps": [
                    {label: "Type 1", value: 1},
                    {label: "Type 2", value: 2},
                    {label: "Type 3", value: 3}
                ]
            }
        };
    },
    methods: {
        beforeLeavingStep: function () {
            if (this.currentStepId === "step1") {
                [this.$v.editedObject.name, this.$v.editedObject.field1, this.$v.editedObject.field2].forEach(function (validator) {
                    validator.$touch();
                });
            } else if (this.currentStepId === "step3") {
                this.$v.editedObject.selectedProps.$touch();
            }
        },
        afterObjectCopy: function (newState) {
            if (newState._id !== null) {
                this.title = "Edit Record";
                this.saveButtonLabel = "Save Changes";
            } else {
                this.title = "Create New Record";
                this.saveButtonLabel = "Create Record";
            }
            return newState;
        }
    },
    validations: {
        editedObject: {
            name: {
                required: validators.required
            },
            field1: {
                required: validators.required
            },
            field2: {
                required: validators.required
            },
            selectedProps: {
                required: validators.required,
                minLength: validators.minLength(2)
            }
        }
    }
});

var MainView = countlyVue.views.BaseView.extend({
    template: '#version-control-main-template',
    mixins: [countlyVue.mixins.hasDrawers(["version","channel"])],
    components: {
        "list-view": VersionsView,
        "version-drawer": VersionDrawer,
        "channel-drawer": ChannelDrawer,
        "edit-view": VersionEditView
    },
    data() {
        return {

        };
    },
    created() {
        // this.getAndroids();
    },
    methods: {
        onDrawerSubmit: function (doc) {
            this.$store.dispatch("countlyVueExample/myRecords/save", doc);
        },
    },

    watch: {
        'currentPage': 'getAndroids'
    },

    beforeCreate: function () {
        this.$store.dispatch("countlyVersionControl/initialize");
    }
});

var vuex = [{
    clyModel: countlyVersionControl
}];

var versionControlView = new countlyVue.views.BackboneWrapper({
    component: MainView,
    vuex: vuex,
    templates: [
        "/version-control/templates/empty.html",
        {
            namespace: 'version-control',
            mapping: {
                'list-template': '/version-control/templates/list.html',
                'main-template': '/version-control/templates/main.html',
                'edit-template': '/version-control/templates/edit.html'
            }
        }
    ]
});

app.versionControlView = versionControlView;

app.route("/version-control", 'version-control', function () {
    var params = {};
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