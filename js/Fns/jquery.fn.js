// Has attribute
$.fn.hasAttr = function (attrName) {
    let attr = false;
    if ($(this).length > 0) {
        if ($(this).get(0).hasAttribute(attrName)) attr = true;
    }
    return attr;
}
// Get data attribute value
$.fn.dataVal = function (dataName, defaultValue = false) {
    let attrVal = defaultValue;
    if ($(this).hasAttr("data-" + dataName)) {
        attrVal = $(this).attr("data-" + dataName);
    }
    return attrVal;
}
// dnone jquery Display toggle
$.fn.dnone = function (toggle = true) {
    if (toggle) {
        $(this).addClass("d-none");
    } else {
        $(this).removeClass("d-none");
    }
}
// Bootstrap Tooltips
function bsTooltips() {
    if (!$.isFunction($.fn.tooltip)) return false;
    $('[title]:not([data-toggle="popover"],.no-tooltip').tooltip({
        trigger: 'hover'
    });
    $('[title]:not([data-toggle="popover"],.no-tooltip').on("click", function () {
        $(".tooltip").remove();
    });
    $('[title]:not([data-toggle="popover"])').on("click", function () {
        $(".tooltip").remove();
    });
    $("[data-toggle='popover']:not('.clickable')").popover({ trigger: "hover" });
    $(".clickable[data-toggle='popover']").popover({
        container: 'body'
    });
}

// Get all attributes for element
$.fn.attrs = function () {
    let attrs = {};
    if (!$(this).length) return attrs;
    $.each(this.attributes, function () {
        if (this.specified) {
            attrs[this.name] = this.value;
        }
    });
    return attrs;
}
// Get tag name of jqueyr elememnt
$.fn.tagName = function () {
    return $(this).get(0).tagName.toLowerCase();
}
// Get Input type
$.fn.inputType = function () {
    let tag = $(this).tagName(),
        type = tag;
    if (tag === "input") {
        if (["checkbox", "radio"].includes($(this).attr("type"))) {
            type = $(this).attr("type")
        } else if ($(this).attr("type") == "file") {
            type = "file";
        }
    }
    return type;
}
// Check if checked
$.fn.isChecked = function () {
    return $(this).is(":checked");
}
// Check if file
const isFile = data => data.lastModified && data.size;
