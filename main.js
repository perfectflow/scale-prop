const { editDocument } = require("application");
const { selection, Shadow } = require("scenegraph");
let panel;
let selectionHistory = [];
let scaleStroke = window.localStorage.getItem("stroke") == "true" ? true : false;
let scaleCorners = window.localStorage.getItem("corners") == "true" ? true : false;
let scaleShadow = window.localStorage.getItem("shadow") == "true" ? true : false;

function create() {
    let strokeCheck = scaleStroke ? "checked" : "";
    let cornersCheck = scaleCorners ? "checked" : "";
    let shadowCheck = scaleShadow ? "checked" : "";
    let strokeImageDisplay = scaleStroke ? "inline" : "none";
    let cornersImageDisplay = scaleCorners ? "inline" : "none";
    let shadowImageDisplay = scaleShadow ? "inline" : "none";
    const HTML =
        `<style>
            #main {}
            h2 {margin: 0; line-height: 150%;}
            #preview {display: block; border: 1px solid #ddd; background: #efefef;}
            #preview img {width: 100%;}
    let shadowImageDisplay = scaleCorners ? "inline" : "none";
            #preview #shadowImage {display: `+shadowImageDisplay+`; z-index: 3; position: absolute; left: 0; top: 0;}
            #preview #backgroundImage {display: inline; z-index: 2;}
            #preview #strokeImage {display: `+strokeImageDisplay+`; z-index: 3; position: absolute; left: 0; top: 0;}
            #preview #cornersImage {display: `+cornersImageDisplay+`; z-index: 4; position: absolute; left: 0; top: 0;}
            #options {width: 100%; display: block;}
            #options ul li {width: 100%; display: flex; flex-direction: row; justify-content: space-between;}
            #options ul li h3 {margin: 0;}
            button {width: 100%;}
        </style>
        <div id="main">
            <div id="preview">
                <img id="shadowImage" src="images/layerShadow.svg" />
                <img id="backgroundImage" src="images/layerBackground.svg" />
                <img id="strokeImage" src="images/layerStroke.svg" />
                <img id="cornersImage" src="images/layerCorners.svg" />
            </div>
            <br/>
            <h2>1. Select and resize one or multiple shapes in your document &rarr;</h2>
            <br/><br/>
            <h2>2. Select the attributes you want to be scaled to match the new dimensions &darr;</h2>
            <br/><br/>
            <div id="options">
                <ul>
                    <li><h3>Stroke</h3><input type="checkbox" class="updateSetting" name="stroke" `+strokeCheck+` /></li>
                    <li><h3>Corners</h3><input type="checkbox" class="updateSetting" name="corners" `+cornersCheck+` /></li>
                    <li><h3>Shadow</h3><input type="checkbox" class="updateSetting" name="shadow" `+shadowCheck+` /></li>
                </ul>
            </div>
            <br/><br/>
            <button id="btnPrimary" uxp-variant="cta" disabled>Scale attributes</button>
        </div>
        `;

    panel = document.createElement("div");
    panel.innerHTML = HTML;

    panel.querySelectorAll(".updateSetting").forEach(item => {
        item.addEventListener('click', async function () {
            window.localStorage.setItem(this.name, this.checked ? true : false);
            let layer = document.querySelector("#" + this.name + "Image");
            layer.style.display = this.checked ? "inline" : "none";
        })
    })

    panel.querySelector("#btnPrimary").addEventListener("click", async function(){
        this.setAttribute("disabled");
        editDocument({ editLabel: "Scale attributes" }, function () {
            scaleAttributes();
        });
    });
    
    return panel;
}

function show(event) {
    if (!panel) event.node.appendChild(create());
}

async function update() {
    const btnPrimary = document.querySelector("#btnPrimary");
    if(selection.items.length > 0){
        selection.items.forEach(function (item) {
            if (item.guid in selectionHistory){
                if(selectionHistory[item.guid].width != item.width || selectionHistory[item.guid].height != item.height){
                    btnPrimary.removeAttribute("disabled");
                    // calulate scale using previous entry
                    console.log("update entry");
                    let scaleWidth = item.width / selectionHistory[item.guid].width;
                    let scaleHeight = item.height / selectionHistory[item.guid].height;
                    let finalScale = (scaleWidth + scaleHeight) / 2;
                    // update
                    selectionHistory[item.guid].width = item.width;
                    selectionHistory[item.guid].height = item.height;
                    selectionHistory[item.guid].scale = finalScale;
                }
            }else {
                // save
                console.log("new entry");
                var myArray = [];
                myArray['width'] = item.width;
                myArray['height'] = item.height;
                selectionHistory[item.guid] = myArray;
            }
        });
    }else{
        btnPrimary.setAttribute("disabled");
    }
}

function scaleAttributes(){
    selection.items.forEach(function (item) {
        let scale = selectionHistory[item.guid].scale ? selectionHistory[item.guid].scale : 1;
        if(scaleStroke == true){
            item.strokeWidth = item.strokeWidth * scale;
        }
        if(scaleCorners == true){
            if(item.hasRoundedCorners){
                item.cornerRadii = { 
                    topLeft: item.cornerRadii.topLeft * scale, 
                    topRight: item.cornerRadii.topRight * scale, 
                    bottomRight: item.cornerRadii.bottomRight * scale, 
                    bottomLeft: item.cornerRadii.bottomLeft * scale
                };
            }
        }
        if(scaleShadow == true){
            item.shadow = new Shadow(item.shadow.x * scale, item.shadow.y * scale, item.shadow.blur * scale, item.shadow.color);
        }

    });
}

module.exports = {
    panels: {
        scaleprop: {
            show,
            update
        }
    }
};
