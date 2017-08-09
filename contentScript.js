/**
 * Created by PB033954 on 7/12/2017.
 */

var stackTraceCount = 0;

chrome.runtime.sendMessage({
    action: "show"
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "popDetails") {
        var showMoreExists = document.getElementsByClassName("showinline");
        if (showMoreExists != undefined && showMoreExists.length > 0) {
            console.log('Need to Expand...');

            // Get the current unexpanded stack-trace count
            var stackTrace = document.getElementsByClassName("shared-eventsviewer-shared-rawfield");
            if (stackTrace != undefined) {
                stackTraceCount = stackTrace[0].textContent.length;
                console.log('Stack Trace Unexpanded Text Count: ' + stackTraceCount);
            }

            // Click to expand the Stack Trace
            showMoreExists[0].click();

            // Verify that the click has completed before reading data
            verifyExpanded();
        } else {
            console.log('No need for stack-trace expansion');
            sendSplunkDetails();
        }
    }
});

function verifyExpanded() {
    var milliSecWait = 100;
    console.log('Verifying if expanded every ' + milliSecWait + ' milliseconds');
    var stackTrace = document.getElementsByClassName("shared-eventsviewer-shared-rawfield");
    var collapseDiv = document.getElementsByClassName("hideinline");
    if (document.readyState === "complete" && stackTrace != undefined && collapseDiv[0]!= undefined) {
        console.log('Stack Trace Expanded');
        setTimeout(function() {
            sendSplunkDetails();
        }, milliSecWait);
    } else {
        console.log('Stack Trace Not Yet Expanded. Waiting for ' + milliSecWait + ' milliseconds')
        setTimeout(function() {
            verifyExpanded()
        }, milliSecWait);
    }
}

function sendSplunkDetails() {
    console.log('Send Splunk Details');
    var searchString = document.getElementsByClassName("shadowTextarea");
    var stackTrace = document.getElementsByClassName("shared-eventsviewer-shared-rawfield");
    var eventOccurrences = document.getElementsByClassName("status shared-jobstatus-count");
    var notSavableSearch = true;
    if(searchString[0].childNodes[0].data.indexOf("|")>= 0){
        notSavableSearch = true;
    }else{
        notSavableSearch = false;
    }
    var splunkUrlSidIndex = searchString[0].baseURI.lastIndexOf('&sid=')
    var trimmedSplunkUrl = searchString[0].baseURI.slice(0,splunkUrlSidIndex);

    chrome.storage.local.set({
        'baseURI': trimmedSplunkUrl,
        'searchString': searchString[0].childNodes[0].data,
        'eventOccurrences': eventOccurrences[0].innerText,
        'stackTrace': stackTrace[0].textContent,
        'notSavableSearch' : notSavableSearch
    });

    chrome.runtime.sendMessage({
        action: "dataExtracted"
    });
}