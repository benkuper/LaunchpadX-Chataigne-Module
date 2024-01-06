var CMD_HEADER = [0, 32, 41, 2, 12];
var CMD_PRG_LIVE_MODE = 14;
var CMD_LED_COLOR = 3;
var LIGHT_TYPE_RGB = 3;
var ROWS = 9;
var COLUMNS = 9;

var colorParams;
var valParams;

function init() {
    colorParams =
        [
            local.parameters.colors.transport.up,
            local.parameters.colors.transport.down,
            local.parameters.colors.transport.left,
            local.parameters.colors.transport.right,
            local.parameters.colors.transport.session,
            local.parameters.colors.transport.note,
            local.parameters.colors.transport.custom,
            local.parameters.colors.transport.capture,
            local.parameters.colors.transport.logo
        ];

    valParams = [
        local.values.pads.transport.up,
        local.values.pads.transport.down,
        local.values.pads.transport.left,
        local.values.pads.transport.right,
        local.values.pads.transport.session,
        local.values.pads.transport.note,
        local.values.pads.transport.custom,
        local.values.pads.transport.capture,
        local.values.pads.transport.logo
    ];

    var index = 9;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < COLUMNS; j++) {

            colorParams[index] = local.parameters.colors.getChild("row" + (i + 1)).getChild((j + 1));
            valParams[index] = local.values.pads.getChild("row" + (i + 1)).getChild((j + 1));
            index++;
        }
    }

    initLaunchpad();

}

function setColor(type, transportID, row, column, id, col) {

    var targetRow = 0;
    var targetColumn = 0;

    if (type == 0) {
        targetRow = 0;
        targetColumn = transportID;
    } else if (type == 1) {
        targetRow = row - 1;
        targetColumn = column - 1;
    } else if (type == 2) {
        targetRow = Math.floor((id - 1) / 9);
        targetColumn = (id - 1) % 9;
    }

    var param = colorParams[targetRow * COLUMNS + targetColumn];
    param.set(col);
}

function sendRowColumnColor(row, column, col) {
    var index = (ROWS - row) * 10 + column + 1;
    sendPadColor(index, col);
}


function moduleParameterChanged(param) {
    if (param.getParent().getParent() == local.parameters.colors) {
        updateColorParam(param);
    }
}


function onPress(row, column, value) {
    if (local.parameters.highlightOnPress.get()) {
        sendRowColumnColor(row, column, local.parameters.highlightColor.get());
    }

    script.log("onPress " + row + ", " + column);

    var valParam = valParams[row * COLUMNS + column];
    valParam.set(value);

}

function onRelease(row, column) {
    script.log("onRelease " + row + ", " + column);
   
    if (local.parameters.highlightOnPress.get()) {
        updateColorParam(colorParams[row * COLUMNS + column]);
    }

    var valParam = valParams[row * COLUMNS + column];
    valParam.set(0);
}


function updateColorParam(param) {
    var color = param.get();
    var id = colorParams.indexOf(param);
    var row = Math.floor(id / 9);
    var column = id % 9;
    // script.log(id, row, column);
    sendRowColumnColor(row, column, color);
}

function noteOnEvent(channel, pitch, velocity) {
    //script.log("Note on received "+channel+", "+pitch+", "+velocity);
    var row = ROWS - parseInt(Math.floor(pitch / 10));
    var column = pitch % 10 - 1;
    onPress(row, column, velocity / 127.0);
}


function noteOffEvent(channel, pitch, velocity) {
    //script.log("Note off received "+channel+", "+pitch+", "+velocity);
    var row = ROWS - parseInt(Math.floor(pitch / 10));
    var column = pitch % 10 - 1;
    onRelease(row, column);
}

function ccEvent(channel, pitch, velocity) {
    //script.log("Note off received "+channel+", "+pitch+", "+velocity);

    var row = ROWS - parseInt(Math.floor(pitch / 10));
    var column = pitch % 10 - 1;
    if (velocity > 0) onPress(row, column, velocity/127.0);
    else onRelease(row, column);

}

// LAUNCHPAD FUNCTIONS

function initLaunchpad() {
    sendCommand(CMD_PRG_LIVE_MODE, 1); //switch to programmer mode

    for (var i = 0; i < colorParams.length; i++) {
        updateColorParam(colorParams[i]);
    }
}

function clearColors() {
    for (var i = 0; i < colorParams.length; i++) {
        colorParams[i].set([0, 0, 0]);
    }
}


function sendPadColor(index, col) {
    var index = (ROWS - row) * 10 + column + 1;
    sendCommand(CMD_LED_COLOR, [LIGHT_TYPE_RGB, index, Math.min(col[0], 1) * 127, Math.min(col[1], 1) * 127, Math.min(col[2], 1) * 127]);
}

function sendCommand(command, data) {
    local.sendSysex(CMD_HEADER, command, data);
}