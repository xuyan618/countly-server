var exportedPlugin = {},
    plugins = require("../../pluginManager");
var Vue = require("frontend/express/public/javascripts/utils/vue/vue.min.js")
var Element = require("element-ui")
Vue.use(Element)

(function(plugin) {
    plugin.init = function() {

    };

    plugin.renderDashboard = function(ob) {
        ob.data.countlyGlobal.maximum_allowed_parameters = plugins.getConfig("remote-config").maximum_allowed_parameters;
        ob.data.countlyGlobal.conditions_per_paramaeters = plugins.getConfig("remote-config").conditions_per_paramaeters;
    };
}(exportedPlugin));

module.exports = exportedPlugin;