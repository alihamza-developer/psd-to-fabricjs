
// Submit form
function submitForm(form, extraData = {}, showPopup = true, cb = null) {
    let formData = $(form).serialize(),
        submitBtn = $(form).find("[type='submit']"),
        btnText = submitBtn.html();

    let valid = true;
    let inputs = $(form).find("input:not([type='hidden']), textarea, select");
    for (let i = 0; i < inputs.length; i++) {
        if (!validInput(inputs[i])) {
            valid = false;
            break;
        }
    }
    if (valid) {
        let u_password = $(form).find(".u_password");
        if (u_password.length > 0) {
            if (u_password.get(0).value !== u_password.get(1).value) {
                valid = false;
                appendError($(u_password.get(1)).parents(".form-group"), "Password is not matching.", u_password.get(1));
            }
        }
    }
    // File
    let $inputFiles = $(form).find('input[type="file"]'),
        containFile = false,
        uploadedFiles = [],
        filesNotFound = false;

    // Add files to form data
    $inputFiles.each(function () {
        let files = this.files,
            name = $(this).attr("name");

        for (let i = 0; i < files.length; i++) {
            uploadedFiles.push({
                name: name,
                data: files[i]
            });
        }

        if (files.length) containFile = true;
    });


    if (containFile) {
        formData = new FormData(form);
        // Remove files from form data
        $inputFiles.each(function () {
            formData.delete($(this).attr("name"));
        });
        // Append files to form data
        uploadedFiles.forEach(file => {
            formData.append(file.name, file.data);
        });
    }


    // Adding other form 
    if ($(form).attr("data-other")) {
        let $otherForm = $(`${$(form).attr("data-other")}`);
        if (containFile) {
            let otherData = $otherForm.serializeArray();
            for (let i = 0; i < otherData.length; i++) {
                formData.append(otherData[i].name, otherData[i].value);
            }
        } else {
            formData = formData + "&" + $otherForm.serialize();
        }
    }


    // Adding Extra Data from argument
    if (!$.isEmptyObject(extraData)) {
        if (containFile) {
            for (let key in extraData) {
                let value = extraData[key];
                formData.append(key, value);
            }
        } else {
            formData = formData + "&" + convertObjToQueryStr(extraData);
        }
    }

    if (!valid) return false;
    let action = $(form).attr("action"),
        form_controller = 'controllers/';
    if (action.indexOf('./') !== -1) form_controller = action;
    else form_controller += action;

    disableBtn(submitBtn.get(0));
    let ajaxObject = {
        url: form_controller,
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            enableBtn(submitBtn, btnText);
            if (typeof cb === "function") {
                cb(response);
            }
            if (form.hasAttribute('data-callback')) {
                return fn._handle($(form), response, 'callback');
            }
            if (showPopup) {
                handleAlert(response);
            }
            if ("redirect" in response) {
                location.assign(response.redirect);
            }

        },
        error: function (er) {
            if (showPopup) {
                makeError();
            }
            enableBtn(submitBtn, btnText);
        }
    };
    if (containFile) {
        ajaxObject.processData = false;
        ajaxObject.contentType = false;
    }
    $.ajax(ajaxObject);

}
$(document).on("submit", ".js-form, .ajax_form", function (e) {
    e.preventDefault();
    let form = this;
    if ($(this).hasAttr("data-confirm")) {
        let confirmBtnTxt = $(this).dataVal("confirm-btn", "Yes"),
            cancelBtnTxt = $(this).dataVal("cancel-btn", "Cancel"),
            title = $(this).dataVal("title", "Are you Sure?"),
            txt = $(this).dataVal("text", "You won't be able to revert this!"),
            confirmActionName = $(this).dataVal("confirm-action-name", "performBackgroundAction"),
            confirmActionValue = $(this).dataVal("confirm-action-value", true);
        Swal.fire({
            title: title,
            text: txt,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmBtnTxt,
            cancelButtonText: cancelBtnTxt
        }).then((result) => {
            if (result.value) {
                submitForm(form);
            }
        });
    } else {
        submitForm(form);
    }
});

// Prevent Enter
$(document).on("keydown", '[data-prevent-enter="true"]', function (e) {
    let keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        return false;
    }
});
// Prevent Click
$(document).on("click", '[data-prevent-click="true"]', function (e) {
    e.preventDefault();
    e.stopPropagation();
});
// valid Inputs
function validInput(el) {
    valid = true;
    let value = $(el).val();
    let parent = $(el).parents(".form-group");
    if ($(el).attr("name") === "email") {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(value)) {
            appendError(parent, "Invalid Email", el);
            valid = false;
        }
    }
    if (valid) {
        if (el.hasAttribute("required")) {
            if (!value) return false;
            if ($(el).val().length < 1) {
                let error = '<p class="error">Required</p>';
                if (parent.find(".error").length < 1) {
                    parent.append(error);
                    valid = false;
                }
            }
        }
    }
    if (valid) {
        if (el.hasAttribute("data-length")) {
            let validLength = $(el).attr("data-length");
            if (validLength.indexOf("[") != -1) {
                validLength = validLength.substr(1, validLength.length - 2);
                let fullLength = validLength.split(",");
                minLength = parseInt(fullLength[0]);
                maxLength = parseInt(fullLength[1]);
                if (value.length < minLength) {
                    valid = appendError(parent, "Minimum Length should be " + minLength, el);
                }
                if (maxLength != 0 && maxLength > minLength) {
                    if (value.length > maxLength) {
                        valid = appendError(parent, "Maximum Length should be " + maxLength, el);
                    }
                }
            } else {
                if ($(el).val().length != parseInt(validLength)) {
                    valid = appendError(parent, "Length should be " + maxLength, el);
                }
            }
        }
    }
    if (valid) {
        parent.find(".error").remove();
        parent.removeClass("err");
    }
    return valid;
}
// Append Form Data Error
function appendError(parent, err, el) {
    let error = '<p class="error">' + err + '</p>';
    parent.addClass("err");
    if (parent.find(".error").length < 1) {
        parent.append(error);
    } else {
        parent.find(".error").html(err);
    }
    el.focus();
    return false;
}
// Edit Table Info
$(document).on("click", ".editTableInfo", function (e) {
    e.preventDefault();
    if (!this.hasAttribute("data-target")) return false;
    let target = $($(this).attr("data-target"));
    if (target.length < 1) return false;
    let parent = $(this).parents("tr").first(),
        inputs = target.find("input[name],textarea[name], select[name], .tinymce-inline-editor, .multi-select");
    inputs.each(function () {
        let name = "";
        if ($(this).tagName() == "div") {
            name = $(this).attr("id");
        } else {
            name = $(this).attr("name");
        }
        let td = parent.find('td[data-name="' + name + '"]');
        if (td.length > 0) {
            let value = td.attr('data-value');

            if ($(this).hasClass("multi-select")) {
                let values = JSON.parse(value);
                target.find(`.single-item input`).each(function () {
                    $(this).prop("checked", values.includes($(this).val()));
                });
            } else {
                if ($(this).tagName() == "div") {
                    $(this).html(value);
                } else {
                    if ($(this).attr("type") == "datetime-local") {
                        value = value.replace(" ", "T");
                        value = value.substr(0, value.length - 2) + "00";
                        //value = removeSeconds(value);
                    }
                    if ($(this).attr("type") !== "file") {
                        if ($(this).attr("type") == "checkbox") {
                            if (value == "true") {
                                $(this).prop("checked", true);
                            } else {
                                $(this).prop("checked", false);
                            }
                        } else if ($(this).get(0).tagName === 'SELECT') {
                            if ($(this).hasAttr("multiple")) {
                                if (isJson(value)) {
                                    value = JSON.parse(value);
                                } else {
                                    value = value.split(",");
                                }
                            } else {
                                value = [value];
                            }
                            $(this).find("option").each(function () {
                                $(this).prop("selected", value.includes($(this).val()));
                            });
                            if ($(this).hasClass("ss-select")) {
                                $(this).get(0).dispatchEvent(new Event("change"));
                            }
                        } else if ($(this).attr("type") === "radio") {
                            if ($(this).val() == value) {
                                $(this).prop('checked', true);
                            }
                        } else $(this).val(value);
                    }
                }
            }



        }
    });
    fn._handle($(this));
});
