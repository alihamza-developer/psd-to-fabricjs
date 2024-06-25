const tc = {};
// TC Functions
tc.fn = {
    // callbacks
    cb: {},
    // call before
    bc: {},
    _has: function (elem, attrName) {
        let hasCallback = false;
        elem = $(elem);
        if (elem.hasAttr("data-" + attrName)) {
            let callbackName = $(elem).attr("data-" + attrName);
            if (callbackName in this) {
                hasCallback = callbackName;
            }
        }
        return hasCallback;
    },
    _handle: function (elem, parameter = null, attrName = "callback") {

        let types = {
            "callbefore": "bc",
            "callback": "cb",
        }

        let callback = $(elem).dataVal(attrName),
            valid = true,
            type = types[attrName] ? types[attrName] : "fn";

        if (callback) {
            let fns = type === "fn" ? this : this[type];
            let callbacks = callback.split(",");
            callbacks.forEach(cb => {
                if (!cb.length) return true;
                if (!(cb in fns)) {
                    valid = false;
                    console.error(`Uncaught TypeError: tc.${type}.${cb} is not a function`);
                    return true;
                }
                if (isJson(parameter)) parameter = JSON.parse(parameter);
                if (parameter !== null)
                    valid = fns[cb](elem, parameter);
                else
                    valid = fns[cb](elem);
            });
        } else {
            callback = $(elem).dataVal(attrName);
            if (callback) {
                console.error('Uncaught TypeError: tc.fn.' + type + '.' + callback + ' is not a function');
                valid = false;
            }
        }
        return valid;
    }
}