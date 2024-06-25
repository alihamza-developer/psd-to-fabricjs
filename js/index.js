// create a wrapper around native canvas element (with id="c")
const canvas = new fabric.Canvas('canvas');
let count = 0;
tc.fn.cb.psdLayersCB = ($el, res) => {
    if (res.status !== 'success') return false;
    let { file, layersData } = res.data;
    canvas.clear();
    for (let i = 0; i < layersData.length; i++) {
        let item = layersData[i];
        count++;
        let { left, top, src, type } = item;
        // Set Text

        if (type == "text") {
            let { weight, style, color, fontSize, fontNames, width, height } = item;
            fontSize = ptToPx(fontSize)

            color = color.join(',');
            fontFamily = fontNames.join(', ');
            color = `rgba(${color})`;

            const text = new fabric.IText(src, {
                left,
                top,
                id: count,
                fontFamily,
                fontWeight: weight,
                fontStyle: style,
                fill: color,
                editable: true,
                fontSize,
                orgItem: {
                    width,
                    height
                }
            });
            let scale = width / text.width;
            text.scale(scale);
            text.set({
                top: top - text.getScaledHeight(),
            })
            canvas.add(text);
            let html = ` <div class="single-layer" data-id="${count}"> 
                            <span>${src}</span>
                            <div>
                            <i class="fas fa-trash-alt delete-btn"></i>
                        <i class="fa fa-eye toggle-view" aria-hidden="true"></i>
                        </div>
                        </div>`;
            $(".layers-collection").append(html)

        }
        // Set Image 
        if (type == 'image') {
            let { bottom, height, opacity, right, width, background } = item;
            fabric.Image.fromURL(src, function (img) {
                img.set({
                    top,
                    left,
                    id: count,
                    opacity,
                    width,
                    height,
                    bottom,
                    right,
                    selectable: background ? false : true
                })
                canvas.add(img);
                if (background)
                    img.moveTo(0)
            });
            let html = ` <div class="single-layer" data-id="${count}">
            <img src="${src}" class="img-fluid w-50" alt="">
            <div>
            <i class="fas fa-trash-alt delete-btn"></i>
        <i class="fa fa-eye toggle-view" aria-hidden="true"></i>
        </div>
        </div>`;
            $(".layers-collection").append(html)
        }
    }
    canvas.renderAll();
}

function downloadImage() {
    let src = canvas.toDataURL('image/jpeg');
    downloadFile(src, 'test.jpeg')
}

$(document).on('click', '.delete-btn', function () {
    let $parent = $(this).parents('.single-layer'),
        id = $parent.attr('data-id');
    canvas._objects.forEach(obj => {
        if (obj.id == id) canvas.remove(obj)
    });
    $parent.remove();
    canvas.renderAll()
});
$(document).on('click', '.toggle-view', function () {
    let $parent = $(this).parents('.single-layer'),
        id = $parent.attr('data-id');

    $(this).toggleClass('active');
    let active = $(this).hasClass('active') ? true : false;

    canvas._objects.forEach(obj => {
        if (obj.id == id) {
            obj.visible = active ? false : true;
        }
    });
    if (active) {
        $(this).removeClass('fa-eye')
        $(this).addClass('fa-eye-slash')
    } else {
        $(this).addClass('fa-eye')
        $(this).removeClass('fa-eye-slash')
    }
    canvas.renderAll()
});