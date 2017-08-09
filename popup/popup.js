document.addEventListener('DOMContentLoaded', function() {
    var totalLabelCounter = 0;
    var enableCreateJiraButton = 0;
    var labelList = [];

    areAllDetailsPopulated();

    populateProjectNameAndType();

    // Clearing issue information from local storage
    chrome.storage.local.remove(['baseURI', 'searchString', 'eventOccurrences', 'stackTrace','notSavableSearch']);

    // Event Listener to create the JIRA
    var logJIRAButton = document.getElementById('createJira');
    logJIRAButton.addEventListener('click', function() {
        var currUserID;
        var currPass;
        var currJIRAInstance;
        var jiraTitle = document.getElementById("jiraTitle").value;
        var projectKey = document.getElementById("projectName").value;
        var issueType = document.getElementById("issueType").value;

        // Get checked Labels
        if (totalLabelCounter > 0) {
            var i = 1;
            chrome.storage.local.remove(['selectedJiraLabels']);
            for (i = 1; i <= totalLabelCounter; i++) {
                var checkBoxId = "cbId" + i;
                var labelId = "labelId" + i;
                var checkBoxButton = document.getElementById(checkBoxId);
                var labelValue = document.getElementById(labelId).value;
                if (checkBoxButton.checked === true) {
                    console.log(labelValue + ' Checked');
                    labelList.push(labelValue);
                }
            }
        }

        chrome.tabs.getSelected(null, function(tab) {

            chrome.storage.local.get('baseURI',function (content) {
                var jiraDescription = 'Occurrences:' +
                    document.getElementById("eventOccurrences").value +
                    '\\\\ [Splunk Search Link|' +
                    content.baseURI +
                    '] - ' +
                    'Splunk Search String:{code}' +
                    document.getElementById("searchString").value +
                    '{code} \\\\ Error/Exception:{code}' +
                    document.getElementById("stackTrace").value +
                    '{code}';

                // Retrieve the stored User ID
                chrome.storage.local.get('userID', function (content) {
                    if (content.userID != undefined) {
                        currUserID = content.userID;
                        console.log('Retrieved User ID: ' + currUserID);

                        // Retrieve the stored Password
                        chrome.storage.local.get('password', function (content) {
                            if (content.password != undefined) {
                                currPass = content.password;
                                console.log('Retrieved User Password');

                                // Retrieve the stored JIRA Instance
                                chrome.storage.sync.get('jiraInstance', function (content) {
                                    if (content.jiraInstance != undefined) {
                                        currJIRAInstance = content.jiraInstance;
                                        console.log('Retrieved JIRA Instance: ' + currJIRAInstance);

                                        var jiraAPIURL = currJIRAInstance;
                                        if (currJIRAInstance.substr(currJIRAInstance.length - 1) === '/') {
                                            jiraAPIURL += 'rest/api/2/issue/';
                                        } else {
                                            jiraAPIURL += '/rest/api/2/issue/';
                                        }

                                        var base64UserPass = window.btoa(currUserID + ':' + currPass);
                                        var postData = {
                                            "fields": {
                                                "project": {
                                                    "key": projectKey
                                                },
                                                "summary": jiraTitle,
                                                "description": jiraDescription,
                                                "issuetype": {
                                                    "name": issueType
                                                },
                                                "labels": labelList
                                            }
                                        };

                                        var createJIRARequest = new XMLHttpRequest();
                                        createJIRARequest.onload = function () {
                                            console.log('Status: ' + createJIRARequest.status);
                                            if (createJIRARequest.status === 201) {
                                                var response = JSON.parse(createJIRARequest.responseText);
                                                console.log('JIRA Identifier: ' + response.key);

                                                var jiraURL = currJIRAInstance;
                                                var jiraIdentifier = response.key;
                                                if (currJIRAInstance.substr(currJIRAInstance.length - 1) === '/') {
                                                    jiraURL += 'browse/' + response.key;
                                                } else {
                                                    jiraURL += '/browse/' + response.key;
                                                }

                                                // Retrieve any stored history
                                                chrome.storage.local.get('jiraHistory', function (content) {
                                                    var currJIRAHistory = [];
                                                    if (content.jiraHistory != undefined) {
                                                        currJIRAHistory = content.jiraHistory;
                                                    }
                                                    currJIRAHistory.push(jiraURL);
                                                    chrome.storage.local.set({
                                                        'jiraHistory': currJIRAHistory
                                                    }, function () {
                                                        console.log('Saved : ' + jiraURL);
                                                    });
                                                });

                                                // Send JIRA Identifier Notification
                                                chrome.notifications.create(
                                                    'jira-creation-notification', {
                                                        type: 'basic',
                                                        iconUrl: '/images/success.png',
                                                        title: "JIRA Creation",
                                                        message: jiraIdentifier + " Logged!"
                                                    },
                                                    function () {
                                                        console.log('Success Notification Sent');
                                                    }
                                                );

                                                document.getElementById("jiraTitle").value = '';
                                                document.getElementById("stackTrace").value = '';
                                                document.getElementById("searchString").value = '';
                                                document.getElementById("eventOccurrences").value = '';
                                            } else {
                                                chrome.notifications.create(
                                                    'jira-creation-notification', {
                                                        type: 'basic',
                                                        iconUrl: '/images/alert.png',
                                                        title: "JIRA Creation",
                                                        message: "Failed to create JIRA!"
                                                    },
                                                    function () {
                                                        console.log('Failure Notification Sent');
                                                    }
                                                );
                                            }
                                        }

                                        createJIRARequest.open("POST", jiraAPIURL, true); // Async = TRUE
                                        createJIRARequest.setRequestHeader("Content-Type", "application/json");
                                        createJIRARequest.setRequestHeader("Authorization", "Basic " + base64UserPass);
                                        createJIRARequest.send(JSON.stringify(postData));
                                    } else {
                                        console.error('Undefined JIRA Instance!');
                                    }
                                });
                            } else {
                                console.error('Undefined Password!');
                            }
                        });
                    } else {
                        console.error('Undefined User ID!');
                    }
                });
            });
        });
    }, false);

    var populateDetails = document.getElementById('populateValues');
    populateDetails.addEventListener('click', function() {
        console.log('Populating Details...');
        // Making sure we call content script of current selection
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "popDetails"
            });
            areAllDetailsPopulated();
        });
    }, false);

    document.getElementById("jiraTitle").addEventListener('keydown', function() {
        areAllDetailsPopulated();
    });

    /**
     * This will validate that all the feilds are populated before jira creation is triggered.
     */
    function areAllDetailsPopulated() {
        document.getElementById("createJira").disabled = true;
        if (document.getElementById("jiraTitle").value != "" &&
            document.getElementById("projectName").value != "" &&
            document.getElementById("issueType").value != "" &&
            document.getElementById("searchString").value != "" &&
            document.getElementById("stackTrace").value != "" &&
            document.getElementById("eventOccurrences").value != "") {
            enableCreateJiraButton = 1;
        }

        if (enableCreateJiraButton === 1) {
            console.log('enableCreateJiraButton:' + enableCreateJiraButton);
            document.getElementById("createJira").disabled = false;
            //var text = document.getElementById('tooltiptext').value;
            //document.getElementById('tooltiptext').value = 'Create Jira';
        } else {
            console.log('enableCreateJiraButton:' + enableCreateJiraButton);
        }
    }

    /**
     * This will populate project name and type based on preference
     */
    function populateProjectNameAndType() {
        chrome.storage.local.get(['projectsList', 'selectedProjectNameIdx', 'projectTypes', 'selectedIssueTypeIdx'], function(items) {
            if(items.projectsList !=  undefined && items.projectTypes!= undefined) {
                var res = items.projectsList[items.selectedProjectNameIdx].split('|');
                document.getElementById("projectName").value = res[1];
                document.getElementById("issueType").value = items.projectTypes[items.selectedIssueTypeIdx]
                document.getElementById("ProjectNameTypeissue").innerHTML = ""
            }else{
                document.getElementById("ProjectNameTypeissue").innerHTML = "Please Update Project Name and Issue Type To create Jira"
            }
        });
    }

    chrome.storage.local.get(['jiraLabels'], function(items) {
        var lsProdID = document.getElementById('labelContainer');
        var counter = 1;
        for (key in items.jiraLabels) {
            totalLabelCounter = totalLabelCounter + 1;

            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = "cbName" + totalLabelCounter;
            checkbox.value = "cbValue" + totalLabelCounter;
            checkbox.id = "cbId" + totalLabelCounter;
            var label = document.createElement('label');
            label.htmlFor = "labelId" + totalLabelCounter;
            label.id = "labelId" + totalLabelCounter;
            label.value = items.jiraLabels[key].labelText;
            label.appendChild(document.createTextNode(label.value));
            document.getElementById("labelContainer").appendChild(checkbox);
            document.getElementById("labelContainer").appendChild(label);
        }
    });
}, false);