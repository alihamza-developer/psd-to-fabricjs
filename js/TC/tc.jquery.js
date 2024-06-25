const tcCheckbox = () => {
    $(".tc-checkbox").each(function () {
        if (this.hasAttribute("data-fetched")) return;
        $(this).attr("data-fetched", "true");
        let checkbox = $(this).clone(),
            label = "",
            extraClass = $(this).dataVal("extra-class", "");

        if (this.hasAttribute('data-label')) label = $(this).attr("data-label");
        if ($(this).hasAttr("data-extra-class") === "")
            checkbox.removeClass("tc-checkbox");
        checkbox.addClass("nc-code-lable");
        checkbox.addClass("checkbox");
        let html = `
                    <label class="checkboxLabel ${extraClass}">
                        ${checkbox.get(0).outerHTML}
                        <span class="c-box">
                            <i class="fas fa-check"></i>
                        </span>
                        <span>${label}</span>
                    </label>
                `;
        $(html).insertBefore($(this));
        $(this).remove();
    });
}
// #region TC Nav
$(document).on("click", ".tc-nav .tc-nav-item", function (e) {
    e.preventDefault();
    let target = $(this).dataVal("target"),
        $parent = $(this).parents(".tc-nav").first();
    $parent.find(".tc-nav-item.active").removeClass("active");
    $parent.find(".tc-nav-panel.active").removeClass("active");
    $(this).addClass('active');
    let $panel = $parent.find(target);
    $panel.addClass("active");
    tc.fn._handle($parent);
    tc.fn._handle($panel);
});
// Remove Tc Nav
$(document).on("click", ".tc-nav .tc-nav-item [data-detach='tc-nav']", function (e) {
    e.preventDefault();
    let $navItem = $(this).parents(".tc-nav-item"),
        target = $navItem.dataVal("target"),
        $parent = $(this).parents(".tc-nav").first();
    $navItem.remove();
    $parent.find(target).remove();
});
let navItemsCount = 0;
// Replace variables
function replaceVars(str, variables) {
    for (let key in variables) {
        let value = variables[key];
        key = key.toUpperCase();
        let re = new RegExp(`(_:TC\.${key}:_)`, 'g');
        str = str.replace(re, value);
    }
    return str;
}
// Create New Nav
$(document).on("click", ".tc-nav .tc-nav-add-btn", function (e) {
    e.preventDefault();
    // Select Elements
    let $form = $(this).parents(".tc-nav-add-form").first(),
        $input = $form.find(".tc-nav-add-input"),
        value = $input.val(),
        $parent = $(this).parents(".tc-nav").first(),
        $navItemsGroup = $parent.find(".tc-nav-items-group"),
        $panelItemGroup = $parent.find(".tc-nav-panels"),
        $panel = $($parent.data("panel")),
        $nav = $($parent.data("nav"));
    if (!$panel.length) return logError("Panel Not Found");
    if (!$nav.length) return logError("Nav Not Found");

    $panel = $panel.clone();
    $nav = $nav.clone();

    let navId = "tcPanelItem" + ++navItemsCount,
        variables = {
            "name": value,
        };
    $panel.attr("id", navId);
    $nav.removeAttr("id");
    $nav.attr("data-target", "#" + navId);
    $nav = replaceVars($nav.get(0).outerHTML, variables);
    $panel = replaceVars($panel.get(0).outerHTML, variables);
    $navItemsGroup.append($nav);
    $panelItemGroup.append($panel);

    $parent.find(`[data-target="#${navId}"]`).click();

    $input.val('');
});
$(document).on("keydown", ".tc-nav .tc-nav-add-input", function (e) {
    let keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        $(this).parents(".tc-nav-add-form").first().find(".tc-nav-add-btn").click();
    }
});
$(document).ready(function () {
    $(".tc-nav .tc-nav-item.active").click();
});
//#endregion TC Nav

// #region TC JX Element
// Ajax Request Elements
function initTcJxElements(selector) {
    $(selector).each(function () {
        if (!$(this).hasAttr("data-launched")) {
            let event = $(this).dataVal("listener"),
                tagName = $(this).tagName();
            if (!event) {
                if (['input', 'select', 'textarea'].includes(tagName))
                    event = "change";
                else if ($(this).hasAttr("contenteditable"))
                    event = "focusout";
                else
                    event = "click";
            }
            $(this).attr("data-launched", "true");
            $(this).on(event, function () {
                // Setting element (if settings element (for data target,submit,include, etc) is another)
                let $settingsEl = $(this);
                if ($(this).dataVal("settings")) {
                    $settingsEl = $($(this).data("settings")).first();
                    let radius = $(this).dataVal("radius");
                    if (radius) $settingsEl = $(this).parents(radius).find($(this).data("settings"));
                    ['return-callback', 'callbactcJxRequestSend'].forEach(attr => {
                        let attrValue = $settingsEl.dataVal(attr);
                        if (attrValue) {
                            $(this).attr(`data-${attr}`, attrValue);
                        }
                    });
                }
                // Select Attributes data
                let targetUrl = $(this).dataVal("target") ? $(this).dataVal("target") : $settingsEl.dataVal("target"),
                    submitData = $(this).dataVal("submit") ? $(this).dataVal("submit") : $settingsEl.dataVal("submit", {}),
                    dataIncludeSel = $(this).dataVal("include") ? $(this).dataVal("include") : $settingsEl.dataVal("include"),
                    dataInclude = {},
                    name = $(this).dataVal("name"),
                    type = $(this).inputType(),
                    elValue = null,
                    showAlert = true;

                if ($settingsEl.hasAttr("data-show-alert")) {
                    if ($settingsEl.data("show-alert") == false) {
                        showAlert = false;
                    }
                }

                if (typeof submitData === "string") {
                    if (!isJson(submitData)) return logError("data-submit is not json in tc-jx-element");
                    submitData = JSON.parse(submitData);
                }

                if (!name) name = $(this).attr("name");
                if (!targetUrl) return logError("data-target attribute not found in tc-jx-element");
                // Append value
                if (event === "focusout")
                    elValue = $(this).text();
                if (event === "change") {
                    if (['radio', 'checkbox'].includes(type)) {
                        let checkedEl = $(this);
                        elValue = checkedEl.is(":checked");
                        if (checkedEl.hasAttr("value"))
                            submitData[`${name}Value`] = checkedEl.val();
                    } else if (['file'].includes(type)) {
                        let fileInput = $(this).get(0),
                            files = fileInput.files;
                        elValue = files;
                    } else
                        elValue = $(this).val();
                }
                if (elValue !== null) submitData[name] = elValue;
                // Data include
                if (dataIncludeSel) {
                    let radius = $settingsEl.dataVal("radius"),
                        $parent = $("body").first();
                    if (radius) {
                        $parent = $(this).parents(radius);
                    }
                    dataInclude = $parent.find(dataIncludeSel).serializeArray();
                }
                // Mege Data
                for (let key in dataInclude) {
                    let data = dataInclude[key];
                    if (data.name.length)
                        submitData[data.name] = data.value;
                }
                // Show loader
                let loader = $(this).dataVal("loader");
                if (!loader) {
                    loader = (event === "click") ? true : false;
                } else {
                    loader == "false" ? false : true;
                }
                let requestData = {
                    data: submitData,
                    url: targetUrl,
                    element: $(this),
                    showAlert,
                    loader,
                    type
                };
                tcJxRequest(requestData);
            });
        }
    });
}
// Ajax Request Fn
function tcJxRequestSend(request) {
    let { url, data, element, loader, showAlert, type } = request,
        $elem = $(element),
        elementHtml = $elem.html(),
        jsonData = $elem.dataVal("res-type", true),
        formData = new FormData(),
        isFile = false;
    jsonData = toBoolean(jsonData);
    if (url.indexOf("./") === -1) {
        url = `./controllers/${url}`;
    }
    if (type == 'file') {
        for (const key in data) {
            let item = data[key];
            if (item instanceof FileList) {
                for (let i = 0; i < item.length; i++) {
                    let file = item[i];
                    formData.append(key, file);
                }
                continue;
            }
            formData.append(key, item);
        }
        isFile = true;
    }
    // Callback
    let callback = $elem.dataVal("callback");
    let ajaxData = {
        url: url,
        type: "POST",
        data: isFile ? formData : data,
        beforeSend: function () {
            if (loader) disableBtn(element);
        },
        success: function (response) {
            if (isFile) {
                element.val('');
            }
            if (loader)
                enableBtn(element, elementHtml);
            if (callback)
                return tc.fn._handle(element, response);
            if (!showAlert)
                return true;
            if (!isJson(response)) return false;
            response = JSON.parse(response);
            // Alert
            if ("redirect" in response) {
                if (response.redirect === "refresh") {
                    location.reload();
                } else {
                    location.assign(response.redirect);
                }
            } else {
                sAlert(response.data, response.status);
            }

        },
        error: function () {
            if (loader)
                enableBtn(element, elementHtml);
            makeError();
        }
    };
    if (isFile) {
        ajaxData.processData = false;
        ajaxData.contentType = false;
    }
    $.ajax(ajaxData)
}
// Send Ajax request
function tcJxRequest(request) {
    let { element, loader, showAlert, type } = request,
        $elem = $(element);
    // Loader
    if (!("loader" in request)) {
        if ($elem.dataVal("loader", null) !== null) {
            loader = $elem.data("loader");
        }
    }
    loader = JSON.parse(loader);
    request.loader = loader;
    // Show Alert
    if (!("showAlert" in request)) {
        if ($elem.dataVal("alert", null) !== null) {
            showAlert = $elem.data("alert");
        }
    }
    showAlert = JSON.parse(showAlert);
    request.showAlert = showAlert;
    // Confirm Data
    let dataConfirm = false;
    if ($elem.hasAttr("data-confirm")) {
        let isConfirm = $elem.data("confirm");
        if (isJson(isConfirm)) {
            dataConfirm = JSON.parse(isConfirm);
        } else {
            dataConfirm = isConfirm;
        }
    }
    if (dataConfirm) {
        tcConfirm({
            success: function () {
                tcJxRequestSend(request)
            }
        });
        return false;
    }
    tcJxRequestSend(request);

}
// TC Confirm
function tcConfirm(options = {}) {
    let { success, error } = options;
    Swal.fire({
        title: "Are you Sure?",
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
    }).then((result) => {
        if (result.value) {
            if (success)
                success();
        } else {
            if (error)
                error();
        }
    });
}
// #endregion TC JX Element
// #region Folding Card
//Collapse bar
$(document).on("click", ".folding-card .card-header", function (e) {
    if ($(e.target).data("prevent-slide") || $(e.target).parents("[data-prevent-slide]").length > 0) return true;
    let $cardBody = $(this).parents(".folding-card").first().find(".card-body").first();
    if ($(this).hasClass("active")) {
        $cardBody.slideUp("1000");
        $(this).removeClass("active");
    }
    else {
        $cardBody.slideDown("1000");
        $(this).addClass("active");
    }
});
// #endregion Folding Card
// #region Add Multiple HTML
$(document).on("click", '[data-toggle="addHTML"]', function () {
    if (!$(this).hasAttr("data-pick")) return logError("data-pick attribute not found!");
    let $pick,
        pickSelector = $(this).data("pick"),
        radius = $(this).dataVal("pick-radius");
    if (!radius) radius = $(this).dataVal("radius");
    if (radius) $pick = $(this).parents(radius).find(pickSelector);
    else $pick = $(pickSelector);
    if (!$pick.length) return logError("picking element not found!");
    $pick = $pick.clone();
    $pick.removeAttr("id");
    // drop element
    let $drop,
        dropSelector = $(this).data("drop");
    radius = $(this).dataVal("radius", false);
    if (radius) {
        $drop = $(this).parents(radius).first().find(dropSelector);
    } else {
        $drop = $(dropSelector);
    }
    if ($drop.length < 1) return logError("droping element not found!");
    // Append Data
    $pick.removeClass("d-none");
    $drop.append($pick);
    tc.fn._handle(this);
});
// #endregion Add HTML
// Bootstrap modal callback
$(document).on("show.bs.modal", ".modal[data-callback]", function (e) {
    tc.fn._handle(this, e, 'callback');
});
// #region Preview image file from file input
$(document).on("change", ".tc-file-preview-input", function () {
    let target = $(this).dataVal("target");
    if (!target) return logError("target not found!");
    let $target = $(target);
    if (!$target.length) return logError("target not found!");
    if (!this.files.length) return true;
    let file = this.files[0];

    if (!isImageFile(file)) return logError("file is not an image!");

    let reader = new FileReader();
    reader.onload = function (e) {
        $target.attr("src", e.target.result);
    };
    reader.readAsDataURL(file);
});
// #endregion Preview image file from file input