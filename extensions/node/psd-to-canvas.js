const fs = require('fs');
const PSD = require('psd');

let folderPath = '_{{folderpath}}_',
    filepath = '_{{filepath}}_'
const l = console.log.bind(this);

async function extractLayersFromPSD(psdPath) {
    // Load the PSD file
    const psd = await PSD.fromFile(psdPath);

    // Parse the PSD file
    psd.parse();
    let data = {};
    // Iterate through all layers
    let i = 0;

    psd.tree().descendants().forEach((layer, index) => {
        if (layer.isGroup()) return;

        // Set Text Properties
        if (layer.get('typeTool')) {
            const txtProps = layer.get('typeTool').export(),
                txtFont = txtProps.font,
                coords = txtProps.transform,
                color = txtFont.colors[0];
            let { width, height } = layer,
                scale = parseInt(txtFont.sizes[0]) / Math.min(width, height);
            // Set Final Props
            data = {
                [i]: {
                    type: 'text',
                    src: txtProps.value,
                    style: txtFont.styles[0],
                    weight: txtFont.weights[0],
                    fontNames: txtFont.names,
                    fontSize: txtFont.sizes[0],
                    color,
                    textDecoration: txtFont.textDecoration[0],
                    top: layer.get("top") + 15,
                    left: layer.get("left"),
                    width,
                    height,
                    opacity: layer.opacity,
                    scale,
                    d2: txtProps.transform,
                    layer: {
                        top: layer.top,
                        left: layer.left
                    }
                },
                ...data
            }
            i++;
            return;
        }

        // Get the layer image data
        let image = layer.toPng(),
            layerName = folderPath + "/layer_" + (index + 1) + ".png";
        // Save the layer image as a PNG file
        image.pack().pipe(fs.createWriteStream(layerName));
        layerName = layerName.replace(/..\/..\//gm, "");
        let item = layer.layer;
        data = {
            [i]: {
                ...layer.coords,
                src: layerName,
                width: layer.width,
                height: layer.height,
                opacity: item.opacity,
                type: 'image'
            },
            ...data
        }
        if (layer.name == "<BG>") data[i].background = true;
        i++;
    });

    const width = psd.header.cols;
    const height = psd.header.rows;

    return {
        data,
        width,
        height,
    }

}

// Run the function on the test.psd file
extractLayersFromPSD(filepath)
    .then((data) => l(JSON.stringify(data)))
    .catch((err) => l(err));