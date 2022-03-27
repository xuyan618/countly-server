/*global app, countlyVue, countlyVueExample, countlyGlobal, countlyCommon, validators, extendViewWithFilter */
const versionStatus = [
    {
        label: 'δ�ϼ�',
        value: 0
    },
    {
        label: '���ϼ�',
        value: 1
    }
];

var VersionsView = countlyVue.views.BaseView.extend(
    {
    template: '#version-control-list-template',

    data: function () {
        const validateTwoAppVersion = (rule, value, callback) => {
            if (value !== this.twoConfirm.appVersion) {
                callback(new Error('?????��?????,??????'));
            } else {
                callback();
            }
        };

        return {
            // ����ɸѡ
            updateTypes: [
                {
                    label: 'ǿ�Ƹ���',
                    value: 0
                },
                {
                    label: 'һ�����',
                    value: 1
                },
                {
                    label: '��Ĭ����',
                    value: 2
                },
                {
                    label: '�ɺ��Ը���',
                    value: 3
                },
                {
                    label: '��Ĭ�ɺ��Ը���',
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
                    title: '�汾��',
                    key: 'appVersion',
                    width: 140,
                    fixed: 'left'
                },
                {
                    title: '������Ͱ汾',
                    minWidth: 140,
                    key: 'allowLowestVersion'
                },
                {
                    title: '��������',
                    minWidth: 140,
                    render: (h, params) => {
                        return h('div', this.updateTypeFilter(params.row.updateType));
                    }
                },
                {
                    title: '��������',
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
                                                    }, '��������'),
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
                            }, '�鿴')
                        ]);
                    }
                },
                {
                    title: '���¼�',
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
                    title: '��̬��������ַ',
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
                    title: '�Ҷȷ���',
                    minWidth: 140,
                    render: (h, params) => {
                        return h('div', this.grayReleasedFilter(params.row.grayReleased));
                    }
                },
                {
                    title: '���ʱ��',
                    width: 180,
                    render: (h, params) => {
                        var date = new Date(params.row.createdTime);
                        return h('div', formatDate(date, 'yyyy-MM-dd hh:mm:ss'));
                    }
                },
                {
                    title: '�����',
                    key: 'createdBy',
                    minWidth: 140
                },
                {
                    title: '����',
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
                                        this.$Message.error('��ʱ��֧�ְ�װ���ϴ�');
                                        // this.$router.push({
                                        //     name: 'version-android_apk',
                                        //     params: {
                                        //         androidId: params.row.id
                                        //     }
                                        // });
                                    }
                                }
                            }, '������'),
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
                            }, '�༭'),
                            h('Poptip', {
                                props: {
                                    confirm: true,
                                    transfer: true,
                                    width: 260,
                                    placement: 'top-end',
                                    title: 'ȷ��ɾ��[' + params.row.appVersion + ']�汾��'
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
                                }, 'ɾ��')
                            ])
                        ]);
                    }
                }
            ],
            tableList: [],
            inLoading: false,
            // ��ҳ
            currentPage: 1,
            total: 0,
            pageSize: 10,

            // search
            queryParams: {
                appVersion: '',
                updateType: null,
                versionStatus: null
            },
            versionStatus: "",
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
                    {required: true, message: '�����뵱ǰ�ϼܵİ汾��', trigger: 'blur'},
                    {required: true, validator: validateTwoAppVersion, trigger: 'blur'}
                ]
            }
        };
    },
    computed: {
        randomNumbers: function () {
            return this.$store.getters["countlyVueExample/graphPoints"];
        },
        queryParams: function () {
            return this.$store.getters["countlyVersionControl/queryParams"];
        }
    },
    methods: {
        refresh: function () {
            this.$store.dispatch("countlyVersionControl/fetchGraphPoints");
        },
        async getAndroids() {
            this.inLoading = true;
            let response = await http.get('/android', {
                params: {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    appVersion: this.queryParams.appVersion,
                    updateType: this.queryParams.updateType === undefined ? null : this.queryParams.updateType,
                    versionStatus: this.queryParams.versionStatus === undefined ? null : this.queryParams.versionStatus
                }
            });

            if (response.data.code === 200) {
                this.tableList = response.data.data.records;
                this.total = response.data.data.total;
                this.currentPage = response.data.data.current;
            } else {
                this.$Notice.error({
                    title: '???????',
                    desc: response.data.message
                });
            }

            this.inLoading = false;
        },

        async delIOS(id) {
            let response = await http.delete('/android/' + id);
            if (response.data.code === 200) {
                this.$Notice.success({
                    title: '??????',
                    desc: `????��[${response.data.data.appVersion}]???`
                });
            } else {
                this.$Notice.error({
                    title: '???????',
                    desc: response.data.message
                });
            }

            this.getAndroids();
        },

        async putChangeStatus(id, status) {
            let response = await http.put('/android/' + id + '/' + status);
            let statusText = status === 'delivery' ? '???' : '???';

            if (response.data.code === 200) {
                this.$Notice.success({
                    title: '??????',
                    desc: `${statusText}???`
                });
            } else {
                this.$Notice.error({
                    title: '???????',
                    desc: response.data.message
                });
            }

            this.getAndroids();
        },

        searchAndroids() {
            this.currentPage = 1;
            this.getAndroids();
        },

        changePageSize(size) {
            this.pageSize = size;
            this.getAndroids();
        },

        toCreatePage() {
            this.$router.push({
                name: 'version-android_create'
            });
        },

        updateTypeFilter(num) {
            if (isNaN(num)) return '??????';

            let word;
            switch (num) {
                case 0:
                    word = '??????';
                    break;
                case 1:
                    word = '??????';
                    break;
                case 2:
                    word = '???????';
                    break;
                case 3:
                    word = '????????';
                    break;
                case 4:
                    word = '???????????';
                    break;
                default:
                    word = '??????';
            }
            return word;
        },

        grayReleasedFilter(num) {
            if (isNaN(num)) return '???????';

            let word;
            switch (num) {
                case 0:
                    word = '???????';
                    break;
                case 1:
                    word = '??????????';
                    break;
                case 2:
                    word = 'IP ????';
                    break;
                default:
                    word = '???????';
            }
            return word;
        },

        twoConfirmCancel() {
            let item = this.tableList.find(item => {
                return item.id === this.twoConfirm.id;
            });
            this.getAndroids();
            this.inTwoConfirm = false;
        },

        twoConfirmSubmit(name) {
            this.$refs[name].validate((valid) => {
                if (!valid) {
                    this.$Message.error('??????????��?????????!');
                    return false;
                }

                this.putChangeStatus(this.twoConfirm.id, 'delivery');
                this.inTwoConfirm = false;
            });
        },
    }
});

var ExampleDrawer = countlyVue.components.BaseDrawer.extend({
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
    mixins: [countlyVue.mixins.hasDrawers("main")],
    components: {
        "list-view": VersionsView,
        "example-drawer": ExampleDrawer
    },
    data() {

        return {};
    },
    created() {
        // this.getAndroids();
    },
    methods: {
        onDrawerSubmit: function (doc) {
            this.$store.dispatch("countlyVueExample/myRecords/save", doc);
        }
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
                'main-template': '/version-control/templates/main.html'
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