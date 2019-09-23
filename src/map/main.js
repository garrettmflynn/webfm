import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';
import {
    OnlineDataSource
} from './fmonline'

// import Worker from '../shared/source.worker.js';
// const myWorker = new Worker();
let dataset;
let uiManager;
let subject;
let task;
import Worker from '../shared/dataIndex.worker';
const dataIndexer = new Worker();

window.onload = async () => {
    // myWorker.postMessage("Connect!")
    // myWorker.onmessage = e => {
    //     console.log(e.data.state);
    //     console.log(e.data.data)
    // }
    let request = await fetch(`/config`)
    let config = await request.json()
    subject = localStorage.getItem('subject')

    task = localStorage.getItem('task')
    dataset = new fmdata();
    uiManager = new fmui();
    uiManager.setup();
    uiManager.raster.oncursormove = newTime => {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
        uiManager.brain.update(dataset.dataForTime(newTime));
    };

    uiManager.onsave = saveName => {
        dataset.put(`/api/data/${subject}/${saveName}`, {
            import: './.metadata'
        })
            .then(response => updateRecordListForSubject(subject))
            .catch(reason => console.log(reason));
    };

    uiManager.onoptionchange = function (option, newValue) {

        if (option == 'stim-trial-start') {
            // updateTrialWindow( { start: newValue } );
        }
        if (option == 'stim-trial-end') {
            // updateTrialWindow( { end: newValue } );
        }

        if (option == 'stim-baseline-start') {
            updateBaselineWindow({
                start: newValue
            });
        }
        if (option == 'stim-baseline-end') {
            updateBaselineWindow({
                end: newValue
            });
        }

        if (option == 'stim-timing') {
            if (newValue == 'state') {
                dataSource._stateTiming = true;
            } else {
                dataSource._stateTiming = false;
            }
        }
        if (option == 'stim-channel') {
            if (!newValue) return;
            dataSource._timingChannel = newValue;
        }
        if (option == 'state-name') {
            if (!newValue) return;
            dataSource._timingState = newValue;
        }



        if (option == 'stim-off') dataSource.threshold.offValue = newValue
        if (option == 'stim-on') dataSource.threshold.onValue = newValue
    };

    var sourceAddress = localStorage.getItem('source-address')
    document.getElementsByClassName('fm-subject-name')[0].innerHTML = subject;
    document.getElementsByClassName('fm-subject-name')[1].innerHTML = subject;
    document.getElementsByClassName('fm-back')[0].setAttribute('href', `/#${subject}`);
    document.getElementsByClassName('fm-task-name')[0].innerHTML = task;
    document.getElementById('fm-option-save-name').value = task;


    let imageData = JSON.parse(localStorage.getItem('brain')).brain
    let sensorGeometry = JSON.parse(localStorage.getItem('geometry')).geometry

    Object.assign(dataset.metadata, {
        kind: 'high gamma power',
        labels: ['timeseries'],
        subject: subject,
        brainImage: imageData,
        'sensorGeometry': sensorGeometry,
        setting: {
            task: task
        }
    });


    uiManager.brain.setup(imageData, sensorGeometry);
    // updateRecordListForSubject(subject);


    var taskConfig = JSON.parse(JSON.stringify(config.tasks.default || {}));
    Object.keys(config.tasks).every(function (configTask) {
        Object.assign(taskConfig, config.tasks[configTask]);
    });

    if (taskConfig.trialWindow !== undefined) {
        dataSource.updateTrialWindow(taskConfig.trialWindow);
    }
    if (taskConfig.baselineWindow !== undefined) {
        dataset.updateBaselineWindow(taskConfig.baselineWindow);
    }
    dataSource.connect(`ws://${sourceAddress}`)
}

let dataSource = new OnlineDataSource();
dataSource.onproperties = properties => {
    dataset.setupChannels(properties.channels);
    uiManager.updateChannelNames(properties.channels);

};
dataSource.onBufferCreated = () => {
    dataset.updateTimesFromWindow(dataSource.trialWindow, dataSource._trialBlocks);
};
dataSource.onStartTrial = () => {
    document.getElementsByClassName('fm-transfer-icon')[0].style.display = '';
    document.getElementsByClassName('fm-trial-label')[0].classList.add('fm-trial-label-active');
}
dataSource.ontrial = trialData => {
    setTimeout(() => document.getElementsByClassName(`fm-transfer-icon`)[0].classList.add('d-none'), 500);
    document.getElementsByClassName(`fm-working-icon`)[0].style.display = '';
    dataset.ingest(trialData)
        .then(function () {
            updateDataDisplay();
            setTimeout(() => document.getElementsByClassName(`fm-working-icon`)[0].classList.add('d-none'), 500);
            uiManager.updateTrialCount(dataset.getTrialCount());
            document.getElementsByClassName('fm-trial-label')[0].classList.remove('fm-trial-label-active');
        });
}
dataSource.onRawSignal = rawSignal => uiManager.scope.update(rawSignal);


var updateRecordListForSubject = function (theSubject) {
    fetch(`/api/list/${theSubject}`).then(response => response.json())
        .then(newRecords => {
            newRecords.sort();
            let recordsTable = document.getElementById('fm-cloud-records-table')
            while (recordsTable.hasChildNodes()) {
                recordsTable.removeChild(recordsTable.firstChild);
            }

            newRecords.forEach(record => {
                var outer = $('<tr/>');
                var inner = $('<td/>', {
                    text: record
                });
                inner.appendTo(outer);
                outer.appendTo('#fm-cloud-records-table');
            });
        })
};








var updateDataDisplay = function () {
    uiManager.raster.update(dataset.displayData);

    var dataWindow = {
        start: dataset.contents.times[0],
        end: dataset.contents.times[dataset.contents.times.length - 1]
    };

    dataIndexer.postMessage({
        displayData: dataset.displayData,
        newTime: uiManager.raster.cursorTime,
        dataWindow: dataWindow
    });
    dataIndexer.onmessage = e => {
        uiManager.brain.update(e.data);
        // uiManager.brain.update(dataset.dataForTime(uiManager.raster.cursorTime));

    }
    var timeBounds = dataset.getTimeBounds();
    if (!uiManager.raster.timeScale) {
        return;
    }
    uiManager.raster.timeScale.range([timeBounds.start, timeBounds.end]);
}

var updateBaselineWindow = function (newWindow) {
    document.getElementsByClassName(`fm-working-icon`)[0].style.display = '';

    dataset.updateBaselineWindow(newWindow)
        .then(function () {
            updateDataDisplay();
            setTimeout(() => document.getElementsByClassName(`fm-working-icon`)[0].classList.add('d-none'), 500);
        });
};

window.onresize = e => uiManager.didResize()

window.onbeforeunload = () => {
    if (!dataset.isClean()) {
        return "There are unsaved changes to your map. Are you sure you want to leave?";
    }
}