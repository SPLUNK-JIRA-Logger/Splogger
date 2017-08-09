var jiraCount = 0;
var currUserID;
var currPass;
var currJIRAInstance;
var currJIRAToken;

document.addEventListener('DOMContentLoaded', function() {

    populateProjectListOptions(document.getElementById("projectName"));
    populateProjectIssueOptions(document.getElementById("issueType"));
    chrome.storage.local.get(['jiraLabels'], function(items) {
        var lsProdID = document.getElementById('labelList');
        for (key in items.jiraLabels) {
            var label = document.createElement('option');
            label.text = items.jiraLabels[key].labelText;
            label.value = labelValue;
            try {
                lsProdID.add(label, null);
            } catch (ex) {
                lsProdID.add(label);
            }
        }
    });
    // On DOM Load, retrieve saved content
    // Check whether any stored labels exist
    chrome.storage.sync.get('hasLabels', function(content) {
        if (content.hasLabels != undefined && content.hasCredentials === 1) {
            console.log('Labels Exist');
        }
        // Retrieve the stored Labels
        chrome.storage.local.get('labelValue', function(content) {
            console.log(labelValue);
        });
    });

    // Check whether any stored credentials exist
    chrome.storage.local.get('hasCredentials', function(content) {
        if (content.hasCredentials != undefined && content.hasCredentials === 1) {
            console.log('Credentials Exist');
            document.getElementById('userID').disabled = true;
            document.getElementById('password').disabled = true;
            document.getElementById('jiraInstance').disabled = true;

            // Retrieve the stored User ID
            chrome.storage.local.get('userID', function(content) {
                if (content.userID != undefined) {
                    currUserID = content.userID;
                    console.log('Retrieved User ID: ' + currUserID);
                    document.getElementById('userID').value = currUserID;

                    // Retrieve the stored Password
                    chrome.storage.local.get('password', function(content) {
                        if (content.password != undefined) {
                            currPass = content.password;
                            console.log('Retrieved User Password');

                            // Retrieve the stored JIRA Instance
                            chrome.storage.sync.get('jiraInstance', function(content) {
                                if (content.jiraInstance != undefined) {
                                    currJIRAInstance = content.jiraInstance;
                                    console.log('Retrieved JIRA Instance: ' + currJIRAInstance);
                                    document.getElementById('jiraInstance').value = currJIRAInstance;
                                    document.getElementById("save").disabled = true;

                                    // Retrieve the stored JIRA Token
                                    chrome.storage.local.get('jiraToken', function(content) {
                                        if (content.jiraToken != undefined) {
                                            currJIRAToken = content.jiraToken;
                                            console.log('Retrieved JIRA Token: ' + currJIRAToken);
                                        } else {
                                            console.error('Undefined JIRA Token!');
                                        }
                                    });
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
        } else {
            console.log('No Saved Credentials.');
        }
    });

    var addInstanceButton = document.getElementById('addInstance');
    addInstanceButton.addEventListener('click', function() {
        var inputField = document.createElement('input');
        inputField.name = 'instanceURL';
        inputField.id = 'instanceURL' + jiraCount;
        jiraCount++;
        inputField.placeholder = 'https://jira.host.com/';
        document.getElementById("jiraInstanceContainer").appendChild(inputField);
    }, false);

    var resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function() {
        chrome.storage.local.clear(function() {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            } else {
                console.log('Reset Successful');
                document.getElementById('userID').disabled = false;
                document.getElementById('password').disabled = false;
                document.getElementById('jiraInstance').disabled = false;

                document.getElementById('userID').value = "";
                document.getElementById('password').value = "";
                document.getElementById('jiraInstance').value = "";
                document.getElementById("save").disabled = false;

                chrome.storage.local.set({
                    'hasCredentials': 0
                }, function() {
                    console.log('Saved State 0.');
                });

                // Clearing projects, issueTypes list and selected options on reset logins
                chrome.storage.local.remove(['projectsList', 'selectedProjectNameIdx', 'issueTypes', 'selectedIssueTypeIdx', 'jiraLabels'], function() {});
                removeSelectBoxOptions(document.getElementById("projectName"));
                removeSelectBoxOptions(document.getElementById("issueType"));
                removeSelectBoxOptions(document.getElementById("labelList"));
            }
        });
    }, false);

    var saveButton = document.getElementById('save');
    saveButton.addEventListener('click', function() {

        // Clearing projects, issueTypes list and selected options on reset logins
        chrome.storage.local.remove(['projectsList', 'selectedProjectNameIdx', 'issueTypes', 'selectedIssueTypeIdx'], function() {});
        removeSelectBoxOptions(document.getElementById("projectName"));
        removeSelectBoxOptions(document.getElementById("issueType"));

        chrome.storage.local.set({
            'hasCredentials': 1
        }, function() {
            console.log('Saved State 1.');
        });

        chrome.storage.local.set({
            'userID': document.getElementById('userID').value
        }, function() {
            console.log('Saved User ID: ' + document.getElementById('userID').value);
        });

        chrome.storage.local.set({
            'password': document.getElementById('password').value
        }, function() {
            console.log('Saved Password.');
        });

        chrome.storage.sync.set({
            'jiraInstance': document.getElementById('jiraInstance').value
        }, function() {
            console.log('Saved JIRA Instance: ' + document.getElementById('jiraInstance').value) + '.';
        });

        for (var i = 0; i < jiraCount; i++) {
            var jiraValue = 'jiraValue' + i;
            var jiraInstance = document.getElementById('jiraValue' + i).value;
            chrome.storage.sync.set({
                jiraValue: jiraInstance
            }, function() {
                console.log(jiraInstance);
            });
        }

        document.getElementById('userID').disabled = true;
        document.getElementById('password').disabled = true;
        document.getElementById('jiraInstance').disabled = true;
        document.getElementById("save").disabled = true;

        var jiraURL = document.getElementById('jiraInstance').value;
        if (jiraURL.substr(jiraURL.length - 1) === '/') {
            jiraURL = document.getElementById('jiraInstance').value + 'rest/auth/1/session';
        } else {
            jiraURL = document.getElementById('jiraInstance').value + '/rest/auth/1/session';
        }

        var postData = {
            "username": document.getElementById('userID').value,
            "password": document.getElementById('password').value
        };

        var request = new XMLHttpRequest();
        request.onload = function() {
            console.log('Status: ' + request.status);
            if (request.status === 200) {
                var response = JSON.parse(request.responseText);
                chrome.storage.local.set({
                    'jiraToken': response.session.value
                }, function() {
                    console.log('Saved JIRA Token: ' + response.session.value);
                });
            } else {
                chrome.notifications.create(
                    'jira-authentication-notification', {
                        type: 'basic',
                        iconUrl: '/images/alert.png',
                        title: "JIRA Authentication",
                        message: "Authentication Failure (" + request.status + ")"
                    },
                    function() {
                        console.log('Notification Sent');
                    }
                );

                document.getElementById('userID').disabled = false;
                document.getElementById('password').disabled = false;
                document.getElementById('jiraInstance').disabled = false;
                document.getElementById("save").disabled = false;
            }
        }
        request.open("POST", jiraURL, true); // Async = TRUE
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(postData));

        // Request to GET project list for the selected JIRA instance
        var jiraProjectListURL = document.getElementById('jiraInstance').value;
        if (jiraProjectListURL.substr(jiraProjectListURL.length - 1) === '/') {
            jiraProjectListURL = document.getElementById('jiraInstance').value + 'rest/api/2/project';
        } else {
            jiraProjectListURL = document.getElementById('jiraInstance').value + '/rest/api/2/project';
        }

        var projectListRequest = new XMLHttpRequest();
        projectListRequest.onload = function() {
            var projectListStatus = 'Failure';
            if (projectListRequest.status === 200) {
                projectListStatus = 'Success';
                var projectListResponse = JSON.parse(projectListRequest.responseText);
                var projectNameKey = [];
                for (var i = 0; i < projectListResponse.length; i++) {
                    projectNameKey.push(projectListResponse[i].name + '|' + projectListResponse[i].key);
                }
                chrome.storage.local.set({
                    'projectsList': projectNameKey
                }, function() {
                    chrome.storage.local.get('projectsList', function(items) {
                        console.log('Saved Project Name-Key Value Length: ' + items.projectsList.length);
                    });
                });
                populateProjectListOptions(document.getElementById("projectName"));
            }
        }

        projectListRequest.open("GET", jiraProjectListURL, true); // Async = TRUE
        projectListRequest.setRequestHeader("Content-Type", "application/json");
        projectListRequest.send();
    }, false);

    document.getElementById('jiraTabButton').addEventListener("click", function openCity(evt, cityName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById('Jira').style.display = "block";
        evt.currentTarget.className += " active";
    });

    document.getElementById('detailsTabButton').addEventListener("click", function openCity(evt, cityName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById('Labels').style.display = "block";
        evt.currentTarget.className += " active";
    });

    document.getElementById('historyTabButton').addEventListener("click", function openCity(evt, cityName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById('historyTab').style.display = "block";
        evt.currentTarget.className += " active";

        // Clear contents of DIV
        document.getElementById('historyTabDIV').innerHTML = "";

        // Retrieve any stored history
        chrome.storage.local.get('jiraHistory', function(content) {
            if (content != undefined && content.jiraHistory != undefined) {
                var historyDIV = document.getElementById('historyTabDIV');
                for (var i in content.jiraHistory) {
                    historyDIV.innerHTML +=
                        '<p><a href=\"' +
                        content.jiraHistory[i] + '\">' +
                        content.jiraHistory[i].substring(content.jiraHistory[i].indexOf("browse") + 7) +
                        '</a></p>';
                    console.log(historyDIV.innerHTML);
                }
            } else {
                console.log('No JIRA History');
            }
        });
    });

    document.getElementById('addLabel').addEventListener("click", function() {
        var label = document.createElement('option');
        var labelValue = document.getElementById('labelValue').value;
        label.text = labelValue;
        label.value = labelValue;
        var lsProdID = document.getElementById('labelList');
        try {
            lsProdID.add(label, null);
        } catch (ex) {
            lsProdID.add(label);
        }

        chrome.storage.local.get({
            jiraLabels: []
        }, function(items) {
            var labelVar = items.jiraLabels;
            labelVar.push({
                'labelText': label.text
            });
            chrome.storage.local.set({
                'jiraLabels': labelVar
            }, function() {
                chrome.storage.local.get(['jiraLabels'], function(items) {
                    console.log(items.jiraLabels);
                });
            });
        });
        document.getElementById('labelValue').value = '';
    });

    document.getElementById('removeLabel').addEventListener("click", function() {
        var labelList = document.getElementById('labelList');
        var selectedLabel = labelList.options[labelList.selectedIndex].text;
        chrome.storage.local.get(['jiraLabels'], function(items) {
            var labelVar = items.jiraLabels;
            console.log(labelVar);
            for (key in labelVar.reverse()) {
                if (labelVar[key].labelText == selectedLabel) {
                    items.jiraLabels.splice(key, 1);
                }
            }

            chrome.storage.local.set({
                'jiraLabels': labelVar
            }, function() {
                chrome.storage.local.get(['jiraLabels'], function(items) {
                    console.log(items.jiraLabels);
                });
            });
        });
        labelList = document.getElementById('labelList');
        var spliceIndex = labelList.selectedIndex;
        if (spliceIndex > -1) {
            labelList.removeChild(labelList.childNodes[spliceIndex]);
        }
    });
    document.getElementById('issueType').addEventListener("change", function() {
        chrome.storage.local.set({
            'selectedIssueTypeIdx': document.getElementById('issueType').selectedIndex
        }, function() {
            chrome.storage.local.get('selectedIssueTypeIdx', function(items) {
                console.log('Selected Issue Type Index: ' + items.selectedIssueTypeIdx);
            });
        });
    });

    var loadTypeProjectSelection = document.getElementById("projectName");

    loadTypeProjectSelection.addEventListener("change", function() {

        chrome.storage.local.set({
            'selectedProjectNameIdx': document.getElementById('projectName').selectedIndex
        }, function() {
            chrome.storage.local.get('selectedProjectNameIdx', function(items) {
                console.log('Selected Project Name Index: ' + items.selectedProjectNameIdx);
            });
        });
        // Clearing issueTypes list and selected option if Project Type dropdown is changed
        chrome.storage.local.remove(['issueTypes', 'selectedIssueTypeIdx'], function() {});
        removeSelectBoxOptions(document.getElementById('issueType'));

        var projectList = document.getElementById('projectName');
        var selectedProject = projectList.options[projectList.selectedIndex].value;

        // Request to GET project list for the selected JIRA instance
        var projectIssueListURL = document.getElementById('jiraInstance').value;
        if (projectIssueListURL.substr(projectIssueListURL.length - 1) === '/') {
            projectIssueListURL = document.getElementById('jiraInstance').value + 'rest/api/2/project/' + selectedProject;
        } else {
            projectIssueListURL = document.getElementById('jiraInstance').value + '/rest/api/2/project/' + selectedProject;
        }

        var projectIssueListReq = new XMLHttpRequest();
        projectIssueListReq.onload = function() {
            var projectIssueStatus = 'Failure';
            if (projectIssueListReq.status === 200) {
                projectIssueStatus = 'Success';
                var projectIssueResponse = JSON.parse(projectIssueListReq.responseText);
                var projectIssueKey = [];
                for (var i = 0; i < projectIssueResponse.issueTypes.length; i++) {
                    projectIssueKey.push(projectIssueResponse.issueTypes[i].name);
                }
                chrome.storage.local.set({
                    'projectTypes': projectIssueKey
                }, function() {
                    chrome.storage.local.get('projectTypes', function(items) {
                        console.log('Read Project Name-Key Values: ' + items.projectTypes.length);
                    });
                });
                populateProjectIssueOptions(document.getElementById("issueType"));
            }
        }

        projectIssueListReq.open("GET", projectIssueListURL, true); // Async = TRUE
        projectIssueListReq.setRequestHeader("Content-Type", "application/json");
        projectIssueListReq.send();

    });
}, false);

function removeSelectBoxOptions(selectbox) {
    var i;
    for (i = selectbox.options.length - 1; i >= 0; i--) {
        selectbox.remove(i);
    }
}

function populateProjectListOptions(selectbox) {
    chrome.storage.local.get('projectsList', function(items) {
        var options = (items.projectsList);
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var res = opt.split('|');
            var el = document.createElement("option");
            el.textContent = res[0];
            el.value = res[1];
            selectbox.appendChild(el);
        }
    });

    chrome.storage.local.get('selectedProjectNameIdx', function(items) {
        if (items.selectedProjectNameIdx < 0) {
            selectbox.selectedIndex = 0;
        } else {
            selectbox.selectedIndex = items.selectedProjectNameIdx;
        }
    });
}

function populateProjectIssueOptions(selectbox) {
    chrome.storage.local.get('projectTypes', function(items) {
        var options = (items.projectTypes);

        if (options != undefined) {
            for (var i = 0; i < options.length; i++) {
                var opt = options[i];
                var el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                selectbox.appendChild(el);
            }
        }
    });

    chrome.storage.local.get('selectedIssueTypeIdx', function(items) {
        if (items.selectedIssueTypeIdx < 0) {
            selectbox.selectedIndex = 0;
        } else {
            selectbox.selectedIndex = items.selectedIssueTypeIdx;
        }
    });
}