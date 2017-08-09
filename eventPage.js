/**
 * Created by PB033954 on 7/12/2017.
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "show") {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.pageAction.show(tabs[0].id)
        });
        areAllDetailsPopulated();
    }

    if (request.action == "dataExtracted") {
        chrome.storage.local.get('searchString', function(content) {
            if (content.searchString !== undefined) {
                document.getElementById('searchString').value = content.searchString;
                document.getElementById('searchString').text = content.searchString;
            } else {
                console.error('searchString Undefined!');
            }
            areAllDetailsPopulated();
        });

        chrome.storage.local.get('eventOccurrences', function(content) {
            if (content.eventOccurrences !== undefined) {
                document.getElementById('eventOccurrences').value = content.eventOccurrences;
                document.getElementById('eventOccurrences').text = content.eventOccurrences;
            } else {
                console.error('eventOccurrences Undefined!');
            }
            areAllDetailsPopulated();
        });

        chrome.storage.local.get('stackTrace', function(content) {
            if (content.stackTrace !== undefined) {
                document.getElementById('stackTrace').value = content.stackTrace.trim();
                document.getElementById('stackTrace').text = content.stackTrace.trim();
            } else {
                console.error('stackTrace Undefined!');
            }
            areAllDetailsPopulated();
        });

        chrome.storage.local.get('notSavableSearch', function(content) {
            if (content.notSavableSearch !== undefined) {
                if (content.notSavableSearch == true) {
                    document.getElementById('SearchStringIssue').innerHTML = "Invalid Search String to create event type";
                }else{
                    document.getElementById('SearchStringIssue').innerHTML = "";
                }
            } else {
                console.error('notSavableSearch Undefined!');
            }
            areAllDetailsPopulated();
        });
    }

    function areAllDetailsPopulated() {
        var enableCreateJiraButton = 0;
        document.getElementById("createJira").disabled = true;
        if (document.getElementById("jiraTitle").value != "" &&
            document.getElementById("projectName").value != "" &&
            document.getElementById("issueType").value != "" &&
            document.getElementById("searchString").value != "" &&
            document.getElementById("stackTrace").value != "" &&
            document.getElementById("eventOccurrences").value != "" &&
            document.getElementById('SearchStringIssue') == "" &&
            document.getElementById('ProjectNameTypeissue') == "") {
            enableCreateJiraButton = 1;
        }

        if (enableCreateJiraButton === 1) {
            document.getElementById("createJira").disabled = false;
        }
    }
});