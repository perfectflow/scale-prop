const { editDocument } = require("application");
const { selection, Shadow } = require("scenegraph");
let panel;
let selectionHistory = [];
let btnPrimaryLabel = "Scale attributes";
let notSupportedObjects = ["Artboard", "RepeatGrid", "SymbolInstance", "BooleanGroup"];

function create() {
    let strokeCheck = window.localStorage.getItem("stroke") == "true" ? "checked" : "";
    let cornersCheck = window.localStorage.getItem("corners") == "true" ? "checked" : "";
    let shadowCheck = window.localStorage.getItem("shadow") == "true" ? "checked" : "";
    let roundCheck = window.localStorage.getItem("round") == "true" ? "checked" : "";
    let strokeImageDisplay = window.localStorage.getItem("stroke") == "true" ? "inline" : "none";
    let cornersImageDisplay = window.localStorage.getItem("corners") == "true" ? "inline" : "none";
    let shadowImageDisplay = window.localStorage.getItem("shadow") == "true" ? "inline" : "none";
    const HTML =
        `<style>
            #main {}
            h2 {margin: 0; line-height: 150%;}
            #preview {display: block; border: 1px solid #ddd; background: #efefef;}
            #preview img {width: 100%;}
            #preview #shadowImage {display: `+shadowImageDisplay+`; z-index: 3; position: absolute; left: 0; top: 0;}
            #preview #backgroundImage {display: inline; z-index: 2;}
            #preview #strokeImage {display: `+strokeImageDisplay+`; z-index: 3; position: absolute; left: 0; top: 0;}
            #preview #cornersImage {display: `+cornersImageDisplay+`; z-index: 4; position: absolute; left: 0; top: 0;}
            #options {width: 100%; display: block;}
            #options ul li {width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center;}
            #options ul li.separator {width: 100%; height: 0px; border-top: 1px solid #ddd; margin: 10px 0px;}
            #options ul li h3 {margin: 0;}
            #messageBox {width: 100%; text-align: center; line-height: 150%; color: #CB3131;}
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
                    <li class="separator"></li>
                    <li><h3>Round values</h3><input type="checkbox" class="updateSetting" name="round" `+roundCheck+` /></li>
                </ul>
            </div>
            <br/><br/>
            <button id="btnPrimary" uxp-variant="cta" disabled>`+btnPrimaryLabel+`</button>
            <br/>
            <div id="messageBox"></div>
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
            selection.items.forEach(function (item) {
                scaleItem(item);
            });
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
            processItem(item);
        });
    }else{
        btnPrimary.setAttribute("disabled");
    }
}

function processItem(item){
    // console.log("type:" + item.constructor.name);
    if(notSupportedObjects.includes(item.constructor.name) == false){
        if(item.children.length > 0){
            item.children.forEach(function (subitem){
                processItem(subitem);
            });
        }else{
            const btnPrimary = document.querySelector("#btnPrimary");
            if (item.guid in selectionHistory){
                if(selectionHistory[item.guid].width != item.localBounds.width || selectionHistory[item.guid].height != item.localBounds.height){
                    btnPrimary.removeAttribute("disabled");
                    highlightPrimaryButton("Click me!");
                    sessionHistoryUpdateEntry(item);
                }
            }else{
                sessionHistoryNewEntry(item);
            }
        }
    }else{
        showMessage(item.constructor.name + " is not supported.");
    }
}

function sessionHistoryNewEntry(item){
    // console.log("new entry");
    var myArray = [];
    myArray['width'] = item.localBounds.width;
    myArray['height'] = item.localBounds.width;
    myArray['scale'] = 1;
    // console.log(myArray);
    selectionHistory[item.guid] = myArray;
}

function sessionHistoryUpdateEntry(item){
    // console.log("update entry");
    // calulate scale using previous entry
    let scaleWidth = item.localBounds.width / selectionHistory[item.guid].width;
    let scaleHeight = item.localBounds.height / selectionHistory[item.guid].height;
    let finalScaleWidth = isNaN(scaleWidth) ? 0 : scaleWidth;
    let finalScaleHeight = isNaN(scaleHeight) ? 0 : scaleHeight;
    let scale = (finalScaleWidth + finalScaleHeight) / 2;
    let finalScale = isNaN(scale) ? 1 : scale;
    // update
    selectionHistory[item.guid].width = item.localBounds.width;
    selectionHistory[item.guid].height = item.localBounds.height;
    selectionHistory[item.guid].scale = finalScale;
    // console.log(selectionHistory[item.guid].width, selectionHistory[item.guid].height, selectionHistory[item.guid].scale);
}

function scaleItem(item){
    if(notSupportedObjects.includes(item.constructor.name) == false){
        if(item.children.length > 0){
            item.children.forEach(function (subitem){
                scaleItem(subitem);
            });
        }else{   
            scaleItemAttributes(item);
        }
    }else{
        showMessage(item.constructor.name + " is not supported and was skipped.");
    }
}

function scaleItemAttributes(item){
    let scale = selectionHistory[item.guid].scale;
    if(window.localStorage.getItem("stroke") == "true"){
        if(item.strokeEnabled){
            if(window.localStorage.getItem("round") == "true"){
                item.strokeWidth = round(item.strokeWidth * scale);
            }else{
                item.strokeWidth = item.strokeWidth * scale;
            }  
        }
    }
    if(window.localStorage.getItem("corners") == "true"){
        if(item.hasRoundedCorners){
            if(window.localStorage.getItem("round") == "true"){
                item.cornerRadii = { 
                    topLeft: round(item.cornerRadii.topLeft * scale),
                    topRight: round(item.cornerRadii.topRight * scale),
                    bottomRight: round(item.cornerRadii.bottomRight * scale),
                    bottomLeft: round(item.cornerRadii.bottomLeft * scale)
                };
            }else{
                item.cornerRadii = { 
                    topLeft: item.cornerRadii.topLeft * scale, 
                    topRight: item.cornerRadii.topRight * scale, 
                    bottomRight: item.cornerRadii.bottomRight * scale, 
                    bottomLeft: item.cornerRadii.bottomLeft * scale
                };
            }
        }
    }
    if(window.localStorage.getItem("shadow") == "true"){
        if(item.shadow){
            if(window.localStorage.getItem("round") == "true"){
                item.shadow = new Shadow(round(item.shadow.x * scale), round(item.shadow.y * scale), round(item.shadow.blur * scale), item.shadow.color);
            }else{
                item.shadow = new Shadow(item.shadow.x * scale, item.shadow.y * scale, item.shadow.blur * scale, item.shadow.color);
            }
        }
    }
}

function round(number){
    return parseInt((Math.ceil(number * 2) / 2).toFixed(1));
}

function showMessage(message){
    let messageBox = document.querySelector("#messageBox");
    let msg = document.createElement("span");
    msg.insertAdjacentHTML("afterbegin", message + "<br/>");
    setTimeout(function () {msg.style.display='none'}, 1500);
    messageBox.appendChild(msg);
}

function highlightPrimaryButton(message){
    const btnPrimary = document.querySelector("#btnPrimary");
    btnPrimary.innerHTML = message;
    setTimeout(function(){
        btnPrimary.innerHTML = btnPrimaryLabel;
    }, 750);
}

module.exports = {
    panels: {
        scaleprop: {
            show,
            update
        }
    }
};
