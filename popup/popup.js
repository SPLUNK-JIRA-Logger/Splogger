document.addEventListener(
  "DOMContentLoaded",
  function() {
    // Disable scrollbars
    document.documentElement.style.overflow = "hidden";

    var totalLabelCounter = 0;
    var disableCreateJiraButton = 0;
    var labelList = [];

    areAllDetailsPopulated();

    populateProjectNameAndType();

    // Clearing issue information from local storage
    chrome.storage.local.remove(["baseURI", "searchString", "eventOccurrences", "stackTrace", "notSavableSearch"]);

    // Event Listener to create the JIRA
    var logJIRAButton = document.getElementById("createJira");
    logJIRAButton.addEventListener(
      "click",
      function() {
        var currUserID;
        var currPass;
        var currJIRAInstance;
        var jiraTitle = document.getElementById("jiraTitle").value;
        var projectKey = document.getElementById("projectName").value;
        var componentListSelection = document.getElementById("component").value;
        var issueType = document.getElementById("issueType").value;
        var searchString = document.getElementById("searchString").value;

        // Always add the Splogger Label for adoption metrics
        labelList.push("Splogger");

        // Get checked Labels
        if (totalLabelCounter > 0) {
          var i = 1;
          chrome.storage.local.remove(["selectedJiraLabels"]);
          for (i = 1; i <= totalLabelCounter; i++) {
            var checkBoxId = "cbId" + i;
            var labelId = "labelId" + i;
            var checkBoxButton = document.getElementById(checkBoxId);
            var labelValue = document.getElementById(labelId).value;
            if (checkBoxButton.checked === true) {
              console.log(labelValue + " Checked");
              labelList.push(labelValue);
            }
          }
        }

        chrome.tabs.getSelected(null, function(tab) {
          chrome.storage.local.get("baseURI", function(content) {
            var jiraDescription =
              "Occurrences:" +
              document.getElementById("eventOccurrences").value +
              "\\\\ [Splunk Search Link|" +
              content.baseURI +
              "] - " +
              "Splunk Search String:{code}" +
              document.getElementById("searchString").value +
              "{code} \\\\ Error/Exception:{code}" +
              document.getElementById("stackTrace").value +
              "{code}";

            // Retrieve the stored User ID
            chrome.storage.local.get("userID", function(content) {
              if (content.userID != undefined) {
                currUserID = content.userID;
                console.log("Retrieved User ID: " + currUserID);

                // Retrieve the stored Password
                chrome.storage.local.get("password", function(content) {
                  if (content.password != undefined) {
                    currPass = content.password;
                    console.log("Retrieved User Password");

                    // Retrieve the stored JIRA Instance
                    chrome.storage.sync.get("jiraInstance", function(content) {
                      if (content.jiraInstance != undefined) {
                        currJIRAInstance = content.jiraInstance;
                        console.log("Retrieved JIRA Instance: " + currJIRAInstance);

                        var jiraAPIURL = currJIRAInstance;
                        if (currJIRAInstance.substr(currJIRAInstance.length - 1) === "/") {
                          jiraAPIURL += "rest/api/2/issue/";
                        } else {
                          jiraAPIURL += "/rest/api/2/issue/";
                        }

                        var base64UserPass = window.btoa(currUserID + ":" + currPass);
                        var postData;

                        var component = document.getElementById("component").value;
                        if (component !== undefined && component.length > 0) {
                          postData = {
                            fields: {
                              project: {
                                key: projectKey
                              },
                              summary: jiraTitle,
                              description: jiraDescription,
                              issuetype: {
                                name: issueType
                              },
                              components:[{
                                name: componentListSelection
                              }],
                              labels: labelList
                            }
                          };
                        } else {
                          postData = {
                            fields: {
                              project: {
                                key: projectKey
                              },
                              summary: jiraTitle,
                              description: jiraDescription,
                              issuetype: {
                                name: issueType
                              },
                              labels: labelList
                            }
                          };
                        }

                        var createJIRARequest = new XMLHttpRequest();
                        createJIRARequest.onload = function() {
                          console.log("Status: " + createJIRARequest.status);
                          if (createJIRARequest.status === 201) {
                            var response = JSON.parse(createJIRARequest.responseText);
                            console.log("JIRA Identifier: " + response.key);

                            var jiraURL = currJIRAInstance;
                            var jiraIdentifier = response.key;
                            if (currJIRAInstance.substr(currJIRAInstance.length - 1) === "/") {
                              jiraURL += "browse/" + response.key;
                            } else {
                              jiraURL += "/browse/" + response.key;
                            }

                            // Retrieve any stored history
                            chrome.storage.local.get("jiraHistory", function(content) {
                              var currJIRAHistory = [];
                              if (content.jiraHistory != undefined) {
                                currJIRAHistory = content.jiraHistory;
                              }
                              currJIRAHistory.push(jiraURL);
                              chrome.storage.local.set(
                                {
                                  jiraHistory: currJIRAHistory
                                },
                                function() {
                                  console.log("Saved : " + jiraURL);
                                }
                              );
                            });

                            // Send JIRA Identifier Notification
                            chrome.notifications.create(
                              "jira-creation-notification",
                              {
                                type: "basic",
                                iconUrl: "/images/success.png",
                                title: "JIRA Creation",
                                message: jiraIdentifier + " Logged!"
                              },
                              function() {
                                console.log("Success Notification Sent");
                                chrome.tabs.create({ url: jiraURL, active: false, selected: false });
                              }
                            );

                            // Retrieve Splunk API URL
                            var splunkAPIURL;
                            chrome.storage.local.get("splunkAPIURL", function(content) {
                              if (content.splunkAPIURL === undefined || content.splunkAPIURL.length <= 0) {
                                console.debug("Undefined Splunk API URL!");
                              } else {
                                splunkAPIURL = content.splunkAPIURL;
                                console.log("Retrieved Splunk API URL");

                                // Retrieve Splunk App Name
                                var splunkApp;
                                chrome.storage.local.get("splunkApp", function(content) {
                                  if (content.splunkApp === undefined || content.splunkApp.length <= 0) {
                                    console.debug("Undefined Splunk App!");
                                  } else {
                                    splunkApp = content.splunkApp;
                                    console.log("Retrieved Splunk App");

                                    // POST EventType to SPLUNK
                                    var createEventTypeRequest = new XMLHttpRequest();
                                    var eventTypeParams =
                                      "name=" +
                                      encodeURIComponent(jiraIdentifier) +
                                      "&priority=5&disabled=0&description=" +
                                      encodeURIComponent(jiraIdentifier) +
                                      "&search=" +
                                      encodeURIComponent(searchString);
                                    createEventTypeRequest.open("POST", splunkAPIURL + currUserID + "/" + splunkApp + "/saved/eventtypes", true);
                                    createEventTypeRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                                    createEventTypeRequest.setRequestHeader("Authorization", "Basic " + base64UserPass);
                                    createEventTypeRequest.onreadystatechange = function() {
                                      if (createEventTypeRequest.readyState == 4 && createEventTypeRequest.status == 201) {
                                        console.log("Splunk Event Type Created");

                                        // Update Event Type Permissions
                                        var updateEventTypeRequest = new XMLHttpRequest();
                                        var updateEventTypeParams =
                                          "perms.read=" +
                                          encodeURIComponent("*") +
                                          "&perms.write=" +
                                          encodeURIComponent("*") +
                                          "&sharing=app&owner=" +
                                          encodeURIComponent(currUserID);
                                        updateEventTypeRequest.open(
                                          "POST",
                                          splunkAPIURL + currUserID + "/" + splunkApp + "/saved/eventtypes/" + jiraIdentifier + "/acl",
                                          true
                                        );
                                        updateEventTypeRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                                        updateEventTypeRequest.setRequestHeader("Authorization", "Basic " + base64UserPass);
                                        updateEventTypeRequest.onreadystatechange = function() {
                                          if (updateEventTypeRequest.readyState == 4 && updateEventTypeRequest.status == 200) {
                                            console.log("Splunk Event Type Updated");
                                            chrome.notifications.create(
                                              "event-type-update-notification",
                                              {
                                                type: "basic",
                                                iconUrl: "/images/success.png",
                                                title: "Splunk Event Type",
                                                message: "Splunk Event Type Created & Permissions Updated!"
                                              },
                                              function() {
                                                console.log("Success Notification Sent");
                                              }
                                            );
                                          } else if (updateEventTypeRequest.readyState == 4 && updateEventTypeRequest.status != 200) {
                                            chrome.notifications.create(
                                              "event-type-update-notification",
                                              {
                                                type: "basic",
                                                iconUrl: "/images/alert.png",
                                                title: "Event Type Update",
                                                message: "Failed to update Event Type permissions!"
                                              },
                                              function() {
                                                console.log("Failure Notification Sent");
                                              }
                                            );
                                          }
                                        };
                                        updateEventTypeRequest.send(updateEventTypeParams);
                                      } else if (createEventTypeRequest.readyState == 4 && createEventTypeRequest.status != 201) {
                                        chrome.notifications.create(
                                          "event-type-creation-notification",
                                          {
                                            type: "basic",
                                            iconUrl: "/images/alert.png",
                                            title: "Event Type Creation",
                                            message: "Failed to create Event Type!"
                                          },
                                          function() {
                                            console.log("Failure Notification Sent");
                                          }
                                        );
                                      }
                                    };
                                    createEventTypeRequest.send(eventTypeParams);
                                  }
                                });
                              }
                            });

                            document.getElementById("jiraTitle").value = "";
                            document.getElementById("stackTrace").value = "";
                            document.getElementById("searchString").value = "";
                            document.getElementById("eventOccurrences").value = "";
                          } else {
                            chrome.notifications.create(
                              "jira-creation-notification",
                              {
                                type: "basic",
                                iconUrl: "/images/alert.png",
                                title: "JIRA Creation",
                                message: "Failed to create JIRA!"
                              },
                              function() {
                                console.log("Failure Notification Sent");
                              }
                            );
                          }
                        };

                        createJIRARequest.open("POST", jiraAPIURL, true); // Async = TRUE
                        createJIRARequest.setRequestHeader("Content-Type", "application/json");
                        createJIRARequest.setRequestHeader("Authorization", "Basic " + base64UserPass);
                        createJIRARequest.send(JSON.stringify(postData));
                      } else {
                        console.error("Undefined JIRA Instance!");
                      }
                    });
                  } else {
                    console.error("Undefined Password!");
                  }
                });
              } else {
                console.error("Undefined User ID!");
              }
            });
          });
        });
      },
      false
    );

    var populateDetails = document.getElementById("populateValues");
    populateDetails.addEventListener(
      "click",
      function() {
        console.log("Populating Details...");
        // Making sure we call content script of current selection
        chrome.tabs.query(
          {
            active: true,
            currentWindow: true
          },
          function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "popDetails"
            });
            areAllDetailsPopulated();
          }
        );
      },
      false
    );

    document.getElementById("jiraTitle").addEventListener("input", function() {
      areAllDetailsPopulated();
    });

    /**
     * Validate whether all the required details are populated.
     * Enables/Disables the 'Create JIRA' button accordingly.
     */
    function areAllDetailsPopulated() {
      if (
        document.getElementById("jiraTitle").value != "" &&
        document.getElementById("projectName").value != "" &&
        document.getElementById("issueType").value != "" &&
        document.getElementById("searchString").value != "" &&
        document.getElementById("stackTrace").value != "" &&
        document.getElementById("eventOccurrences").value != ""
      ) {
        disableCreateJiraButton = false;
      } else {
        disableCreateJiraButton = true;
      }

      console.log("disableCreateJiraButton:" + disableCreateJiraButton);
      document.getElementById("createJira").disabled = disableCreateJiraButton;
    }

    /**
     * This will populate project name and type based on preference
     */
    function populateProjectNameAndType() {
      chrome.storage.local.get(["projectsList", "selectedProjectNameIdx", "projectTypes", "selectedIssueTypeIdx", "componentsList", "selectedComponentTypeIdx"], function(items) {
        if (
          items.projectsList !== undefined &&
          items.projectTypes !== undefined &&
          items.projectTypes[items.selectedIssueTypeIdx] !== undefined &&
          items.projectsList[items.selectedProjectNameIdx] !== undefined
        ) {
          var res = items.projectsList[items.selectedProjectNameIdx].split("|");
          document.getElementById("projectName").value = res[1];
          
          document.getElementById("issueType").value = items.projectTypes[items.selectedIssueTypeIdx];
          
          if(items.componentsList[items.selectedComponentTypeIdx] !== undefined) {
            var componentHolder = items.componentsList[items.selectedComponentTypeIdx].split("|");
            document.getElementById("component").value = componentHolder[0];
          }
          
          document.getElementById("projectNameTypeErrorBlock").innerHTML = "";
        } else {
          document.getElementById("projectNameTypeErrorBlock").innerHTML = "Populate Project Name & Issue Type to be able to create JIRA";
        }
      });
    }

    chrome.storage.local.get(["jiraLabels"], function(items) {
      var lsProdID = document.getElementById("labelContainer");
      var counter = 1;
      for (key in items.jiraLabels) {
        totalLabelCounter = totalLabelCounter + 1;

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "cbName" + totalLabelCounter;
        checkbox.value = "cbValue" + totalLabelCounter;
        checkbox.id = "cbId" + totalLabelCounter;
        var label = document.createElement("label");
        label.htmlFor = "labelId" + totalLabelCounter;
        label.id = "labelId" + totalLabelCounter;
        label.value = items.jiraLabels[key].labelText;
        label.appendChild(document.createTextNode(label.value));
        document.getElementById("labelContainer").appendChild(checkbox);
        document.getElementById("labelContainer").appendChild(label);
      }
    });
  },
  false
);
