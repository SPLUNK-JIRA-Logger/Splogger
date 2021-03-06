// Global Variables (Current Context)
var currUserID;
var currPass;
var currJIRAInstance;
var currJIRAToken;

document.addEventListener(
  "DOMContentLoaded",
  function() {
    // Add listeners for the tab buttons
    // JIRA Tab onClick
    document.getElementById("jiraTabButton").addEventListener("click", function openTab(evt) {
      var tabContent = document.getElementsByClassName("tabContent");
      for (var tabcontentIndex = 0; tabcontentIndex < tabContent.length; tabcontentIndex++) {
        tabContent[tabcontentIndex].style.display = "none";
      }
      
      var tabLinks = document.getElementsByClassName("tabLinks");
      for (var tabLinkIndex = 0; tabLinkIndex < tabLinks.length; tabLinkIndex++) {
        tabLinks[tabLinkIndex].className = tabLinks[tabLinkIndex].className.replace(" active", "");
      }
      
      document.getElementById("JIRA").style.display = "block";
      evt.currentTarget.className += " active";
    });

    // Configuration Tab onClick
    document.getElementById("configTabButton").addEventListener("click", function openTab(evt) {
      var tabContent = document.getElementsByClassName("tabContent");
      for (var tabContentIndex = 0; tabContentIndex < tabContent.length; tabContentIndex++) {
        tabContent[tabContentIndex].style.display = "none";
      }

      var tabLinks = document.getElementsByClassName("tabLinks");
      for (var tabLinkIndex = 0; tabLinkIndex < tabLinks.length; tabLinkIndex++) {
        tabLinks[tabLinkIndex].className = tabLinks[tabLinkIndex].className.replace(" active", "");
      }

      // Set the Splunk API URL from saved content
      chrome.storage.local.get("splunkAPIURL", function(content) {
        if (content.splunkAPIURL !== undefined) {
          document.getElementById("splunkAPIURL").value = content.splunkAPIURL;
        } else {
          console.error("Undefined Splunk API URL!");
        }
      });

      // Set the Splunk App Name from saved content
      chrome.storage.local.get("splunkApp", function(content) {
        if (content.splunkApp !== undefined) {
          document.getElementById("splunkApp").value = content.splunkApp;
        } else {
          console.error("Undefined Splunk App!");
        }
      });

      document.getElementById("Config").style.display = "block";
      evt.currentTarget.className += " active";
    });

    // History Tab onClick
    document.getElementById("historyTabButton").addEventListener("click", function openTab(evt) {
      var tabContent = document.getElementsByClassName("tabContent");
      for (var tabContentIndex = 0; tabContentIndex < tabContent.length; tabContentIndex++) {
        tabContent[tabContentIndex].style.display = "none";
      }

      var tabLinks = document.getElementsByClassName("tabLinks");
      for (var tabLinkIndex = 0; tabLinkIndex < tabLinks.length; tabLinkIndex++) {
        tabLinks[tabLinkIndex].className = tabLinks[tabLinkIndex].className.replace(" active", "");
      }

      document.getElementById("historyTab").style.display = "block";
      evt.currentTarget.className += " active";

      // Clear contents of DIV
      document.getElementById("historyTabDIV").innerHTML = "";

      // Retrieve any stored history
      chrome.storage.local.get("jiraHistory", function(content) {
        if (content !== undefined && content.jiraHistory !== undefined) {
          var historyDIV = document.getElementById("historyTabDIV");
          for (var i in content.jiraHistory) {
            historyDIV.innerHTML +=
              '<p><a href="' + content.jiraHistory[i] + '">' + content.jiraHistory[i].substring(content.jiraHistory[i].indexOf("browse") + 7) + "</a></p>";
            console.log(historyDIV.innerHTML);
          }
        } else {
          console.log("No JIRA History");
        }
      });
    });

    // Open the JIRA tab on page load
    document.getElementById("jiraTabButton").click();

    populateProjectListOptions(document.getElementById("projectName"));
    populateProjectIssueOptions(document.getElementById("issueType"));
    populateComponentList(document.getElementById("component"));

    chrome.storage.local.get(["jiraLabels"], function(items) {
      var lsProdID = document.getElementById("labelList");
      for (key in items.jiraLabels) {
        var label = document.createElement("option");
        label.text = items.jiraLabels[key].labelText;
        label.value = labelValue;
        try {
          lsProdID.add(label, null);
        } catch (exception) {
          console.log(exception);
          lsProdID.add(label);
        }
      }
    });

    // On DOM Load, retrieve saved content
    // Check whether any stored labels exist
    chrome.storage.sync.get("hasLabels", function(content) {
      if (content.hasLabels !== undefined && content.hasCredentials === 1) {
        console.log("Labels Exist");
        // Retrieve the stored Labels
        chrome.storage.local.get("labelValue", function(content) {
          console.log(labelValue);
        });
      } else {
        console.log("No Labels Exist!");
      }
    });

    // Check whether any stored credentials exist
    chrome.storage.local.get("hasCredentials", function(content) {
      if (content.hasCredentials !== undefined && content.hasCredentials === 1) {
        console.log("Credentials Exist");
        document.getElementById("userID").disabled = true;
        document.getElementById("password").disabled = true;
        document.getElementById("jiraInstance").disabled = true;

        // Retrieve the stored User ID
        chrome.storage.local.get("userID", function(content) {
          if (content.userID !== undefined) {
            currUserID = content.userID;
            console.log("Retrieved User ID: " + currUserID);
            document.getElementById("userID").value = currUserID;

            // Retrieve the stored Password
            chrome.storage.local.get("password", function(content) {
              if (content.password !== undefined) {
                currPass = content.password;
                console.log("Retrieved User Password");

                // Retrieve the stored JIRA Instance
                chrome.storage.sync.get("jiraInstance", function(content) {
                  if (content.jiraInstance !== undefined) {
                    currJIRAInstance = content.jiraInstance;
                    console.log("Retrieved JIRA Instance: " + currJIRAInstance);
                    document.getElementById("jiraInstance").value = currJIRAInstance;
                    document.getElementById("saveJIRA").disabled = true;

                    // Retrieve the stored JIRA Token
                    chrome.storage.local.get("jiraToken", function(content) {
                      if (content.jiraToken !== undefined) {
                        currJIRAToken = content.jiraToken;
                        console.log("Retrieved JIRA Token: " + currJIRAToken);
                      } else {
                        console.error("Undefined JIRA Token!");
                      }
                    });
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
      } else {
        console.log("No Saved Credentials.");
      }
    });

    var addInstanceButton = document.getElementById("addInstance");
    addInstanceButton.addEventListener(
      "click",
      function() {
        var inputField = document.createElement("input");
        inputField.name = "instanceURL";
        inputField.id = "instanceURL" + jiraCount;
        jiraCount++;
        inputField.placeholder = "https://jira.host.com/";
        document.getElementById("jiraInstanceContainer").appendChild(inputField);
      },
      false
    );

    var resetJIRAButton = document.getElementById("resetJIRA");
    resetJIRAButton.addEventListener(
      "click",
      function() {
        chrome.storage.local.clear(function() {
          var error = chrome.runtime.lastError;
          if (error) {
            console.error(error);
          } else {
            document.getElementById("userID").disabled = false;
            document.getElementById("password").disabled = false;
            document.getElementById("jiraInstance").disabled = false;

            document.getElementById("userID").value = "";
            document.getElementById("password").value = "";
            document.getElementById("jiraInstance").value = "";
            document.getElementById("saveJIRA").disabled = false;

            chrome.storage.local.set(
              {
                hasCredentials: 0
              },
              function() {
                console.log("Saved State 0.");
              }
            );

            // Clear on reset (Projects, Issue Types, Components, Lables)
            chrome.storage.local.remove(["projectsList", "selectedProjectNameIdx", "issueTypes", "selectedIssueTypeIdx", "jiraLabels", "componentsList", "selectedComponentTypeIdx"], function() {});
            removeSelectBoxOptions(document.getElementById("projectName"));
            removeSelectBoxOptions(document.getElementById("issueType"));
            removeSelectBoxOptions(document.getElementById("labelList"));
            removeSelectBoxOptions(document.getElementById("component"));

            console.log("Reset Successful");
          }
        });
      },
      false
    );

    var saveJIRAButton = document.getElementById("saveJIRA");
    saveJIRAButton.addEventListener(
      "click",
      function() {
        // Clearing prior to saving
        chrome.storage.local.remove(["projectsList", "selectedProjectNameIdx", "issueTypes", "selectedIssueTypeIdx", "componentsList", "selectedComponentTypeIdx"], function() {});
        removeSelectBoxOptions(document.getElementById("projectName"));
        removeSelectBoxOptions(document.getElementById("issueType"));
        removeSelectBoxOptions(document.getElementById("component"));

        chrome.storage.local.set(
          {
            hasCredentials: 1
          },
          function() {
            console.log("Saved State 1.");
          }
        );

        chrome.storage.local.set(
          {
            userID: document.getElementById("userID").value
          },
          function() {
            console.log("Saved User ID: " + document.getElementById("userID").value);
          }
        );

        chrome.storage.local.set(
          {
            password: document.getElementById("password").value
          },
          function() {
            console.log("Saved Password!");
          }
        );

        chrome.storage.sync.set(
          {
            jiraInstance: document.getElementById("jiraInstance").value
          },
          function() {
            console.log("Saved JIRA Instance: " + document.getElementById("jiraInstance").value) + ".";
          }
        );

        document.getElementById("userID").disabled = true;
        document.getElementById("password").disabled = true;
        document.getElementById("jiraInstance").disabled = true;
        document.getElementById("saveJIRA").disabled = true;

        var jiraURL = document.getElementById("jiraInstance").value;
        if (jiraURL.substr(jiraURL.length - 1) === "/") {
          jiraURL = document.getElementById("jiraInstance").value + "rest/auth/1/session";
        } else {
          jiraURL = document.getElementById("jiraInstance").value + "/rest/auth/1/session";
        }

        var postData = {
          username: document.getElementById("userID").value,
          password: document.getElementById("password").value
        };

        var request = new XMLHttpRequest();
        request.onload = function() {
          console.log("Status: " + request.status);
          if (request.status === 200) {
            var response = JSON.parse(request.responseText);
            chrome.storage.local.set(
              {
                jiraToken: response.session.value
              },
              function() {
                console.log("Saved JIRA Token: " + response.session.value);
              }
            );
          } else {
            chrome.notifications.create(
              "jira-authentication-notification",
              {
                type: "basic",
                iconUrl: "/images/alert.png",
                title: "JIRA Authentication",
                message: "Authentication Failure (" + request.status + ")"
              },
              function() {
                console.log("Notification Sent");
              }
            );

            document.getElementById("userID").disabled = false;
            document.getElementById("password").disabled = false;
            document.getElementById("jiraInstance").disabled = false;
            document.getElementById("saveJIRA").disabled = false;
          }
        };
        request.open("POST", jiraURL, true); // Async = TRUE
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(postData));

        // Request to GET project list for the selected JIRA instance
        var jiraProjectListURL = document.getElementById("jiraInstance").value;
        if (jiraProjectListURL.substr(jiraProjectListURL.length - 1) === "/") {
          jiraProjectListURL = document.getElementById("jiraInstance").value + "rest/api/2/project";
        } else {
          jiraProjectListURL = document.getElementById("jiraInstance").value + "/rest/api/2/project";
        }

        var projectListRequest = new XMLHttpRequest();
        projectListRequest.onload = function() {
          var projectListStatus = "Failure";
          if (projectListRequest.status === 200) {
            projectListStatus = "Success";
            var projectListResponse = JSON.parse(projectListRequest.responseText);
            var projectNameKey = [];
            for (var i = 0; i < projectListResponse.length; i++) {
              projectNameKey.push(projectListResponse[i].name + "|" + projectListResponse[i].key);
            }
            chrome.storage.local.set(
              {
                projectsList: projectNameKey
              },
              function() {
                chrome.storage.local.get("projectsList", function(items) {
                  console.log("Saved Project Name-Key Value Length: " + items.projectsList.length);
                });
              }
            );
            populateProjectListOptions(document.getElementById("projectName"));
          }
        };

        projectListRequest.open("GET", jiraProjectListURL, true); // Async = TRUE
        projectListRequest.setRequestHeader("Content-Type", "application/json");
        projectListRequest.send();
      },
      false
    );

    var removeProjectSelectionButton = document.getElementById("removeProjectSelection");
    removeProjectSelectionButton.addEventListener(
      "click",
      function() {
        document.getElementById("projectName").selectedIndex = -1;
        document.getElementById("issueType").selectedIndex = -1;
        document.getElementById("component").selectedIndex = -1;
      },
      false
    );

    var removeIssueTypeSelectionButton = document.getElementById("removeIssueTypeSelection");
    removeIssueTypeSelectionButton.addEventListener(
      "click",
      function() {
        document.getElementById("issueType").selectedIndex = -1;
      },
      false
    );

    var removeComponentSelectionButton = document.getElementById("removeComponentSelection");
    removeComponentSelectionButton.addEventListener(
      "click",
      function() {
        document.getElementById("component").selectedIndex = -1;
      },
      false
    );

    var saveConfigButton = document.getElementById("saveConfig");
    saveConfigButton.addEventListener(
      "click",
      function() {
        // Clear existing configuration (Only Splunk information as of now)
        chrome.storage.local.remove(["splunkAPIURL", "splunkApp"], function() {});

        chrome.storage.local.set(
          {
            splunkAPIURL: document.getElementById("splunkAPIURL").value,
            splunkApp: document.getElementById("splunkApp").value
          },
          function() {
            console.log("Saved Splunk API URL & App Name.");
          }
        );

        // Send a notification indicating that the save is successful
        chrome.notifications.create(
          "configuration-save-notification",
          {
            type: "basic",
            iconUrl: "/images/success.png",
            title: "Configuration Saved",
            message: "Configuration Saved"
          },
          function() {
            console.log("Configuration Save Success Notification Sent");
          }
        );
      },
      false
    );
    
    var resetConfigButton = document.getElementById("resetConfig");
    resetConfigButton.addEventListener(
      "click",
      function() {
        document.getElementById("splunkAPIURL").value = "";
        document.getElementById("splunkApp").value = "";
        document.getElementById("projectName").selectedIndex = -1;
        document.getElementById("issueType").selectedIndex = -1;
        document.getElementById("component").selectedIndex = -1;

        console.log("Configuration Reset Successful");
      },
      false
    );

    var exportConfigButton = document.getElementById("exportConfig");
    exportConfigButton.addEventListener(
      "click",
      function() {
        var labelList = "";
        var labelListSelect = document.getElementById("labelList");
        if(labelListSelect !== undefined && labelListSelect.options !== undefined && labelListSelect.options.length > 0) {
          for(var labelListIndex = 0; labelListIndex < labelListSelect.options.length; labelListIndex++) {
            labelList += labelListSelect.options[labelListIndex].text + ",";
          }
          labelList = labelList.slice(0, -1);
        }

        var componentValue = "";
        var componentSelection = document.getElementById("component");
        if(componentSelection.options[componentSelection.selectedIndex] !== undefined && componentSelection.options[componentSelection.selectedIndex].text !== undefined) {
          componentValue = componentSelection.options[componentSelection.selectedIndex].text;
        }

        const data = [
          ["User ID", document.getElementById("userID").value],
          ["JIRA URL", document.getElementById("jiraInstance").value],
          ["Splunk API URL", document.getElementById("splunkAPIURL").value],
          ["Splunk APP", document.getElementById("splunkApp").value],
          ["JIRA Project", document.getElementById("projectName").value],
          ["JIRA Issue Type", document.getElementById("issueType").value],
          ["JIRA Component", componentValue],
          ["JIRA Labels", labelList]];
        var lineArray = [];
        data.forEach(function (infoArray, index) {
          var line = infoArray.join(",");
          lineArray.push(line);
        });

        var fileName = "Splogger_Config_" + Date.now() + ".csv";
        var csvContent = lineArray.join("\n");
        var blobContent = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var downloadLink = document.createElement("a");
        
        downloadLink.setAttribute("href", URL.createObjectURL(blobContent));
        downloadLink.setAttribute("download", fileName);
        downloadLink.style.visibility = 'hidden';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      },
      false
    );

    // This will auto update the history tab with the newly created JIRAs
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        if (key == "jiraHistory") {
          document.getElementById("historyTabButton").click();
          console.log("Update of JIRA history detected");
        }
      }
    });

    // Add a label to the list & local storage
    document.getElementById("addLabel").addEventListener("click", function() {
      var label = document.createElement("option");
      var labelValue = document.getElementById("labelValue").value;
      label.text = labelValue;
      label.value = labelValue;
      var lsProdID = document.getElementById("labelList");
      try {
        lsProdID.add(label, null);
      } catch (ex) {
        lsProdID.add(label);
      }

      chrome.storage.local.get(
        {
          jiraLabels: []
        },
        function(items) {
          var labelVar = items.jiraLabels;
          labelVar.push({
            labelText: label.text
          });
          chrome.storage.local.set(
            {
              jiraLabels: labelVar
            },
            function() {
              chrome.storage.local.get(["jiraLabels"], function(items) {
                console.log("JIRA Label List Length:" + items.jiraLabels.length);
              });
            }
          );
        }
      );
      document.getElementById("labelValue").value = "";
    });

    // Remove label from the list & local storage
    document.getElementById("removeLabel").addEventListener("click", function() {
      var labelList = document.getElementById("labelList");
      var selectedLabel = labelList.options[labelList.selectedIndex].text;
      chrome.storage.local.get(["jiraLabels"], function(items) {
        var labelVar = items.jiraLabels;
        console.log(labelVar);
        for (key in labelVar.reverse()) {
          if (labelVar[key].labelText == selectedLabel) {
            items.jiraLabels.splice(key, 1);
          }
        }

        chrome.storage.local.set(
          {
            jiraLabels: labelVar
          },
          function() {
            chrome.storage.local.get(["jiraLabels"], function(items) {
              console.log(items.jiraLabels);
            });
          }
        );
      });
      labelList = document.getElementById("labelList");
      var spliceIndex = labelList.selectedIndex;
      if (spliceIndex > -1) {
        labelList.removeChild(labelList.childNodes[spliceIndex]);
      }
    });

    document.getElementById("issueType").addEventListener("change", function() {
      chrome.storage.local.set(
        {
          selectedIssueTypeIdx: document.getElementById("issueType").selectedIndex
        },
        function() {
          chrome.storage.local.get("selectedIssueTypeIdx", function(items) {
            console.log("Selected Issue Type Index: " + items.selectedIssueTypeIdx);
          });
        }
      );
    });

    document.getElementById("component").addEventListener("change", function() {
      chrome.storage.local.set(
        {
          selectedComponentTypeIdx: document.getElementById("component").selectedIndex
        },
        function() {
          chrome.storage.local.get("selectedComponentTypeIdx", function(items) {
            console.log("Selected Component Type Index: " + items.selectedComponentTypeIdx);
          });
        }
      );
    });

    var loadTypeProjectSelection = document.getElementById("projectName");
    loadTypeProjectSelection.addEventListener("change", function() {
      chrome.storage.local.set(
        {
          selectedProjectNameIdx: document.getElementById("projectName").selectedIndex
        },
        function() {
          chrome.storage.local.get("selectedProjectNameIdx", function(items) {
            console.log("Selected Project Name Index: " + items.selectedProjectNameIdx);
          });
        }
      );

      // Clearing Issue Types & Components if Project Type dropdown is changed
      chrome.storage.local.remove(["issueTypes", "selectedIssueTypeIdx", "componentsList", "selectedComponentTypeIdx"], function() {});
      removeSelectBoxOptions(document.getElementById("issueType"));
      removeSelectBoxOptions(document.getElementById("component"));

      var projectList = document.getElementById("projectName");
      var selectedProject = projectList.options[projectList.selectedIndex].value;

      // Request to GET project list for the selected JIRA instance
      var projectIssueListURL = document.getElementById("jiraInstance").value;
      if (projectIssueListURL.substr(projectIssueListURL.length - 1) === "/") {
        projectIssueListURL = document.getElementById("jiraInstance").value + "rest/api/2/project/" + selectedProject;
      } else {
        projectIssueListURL = document.getElementById("jiraInstance").value + "/rest/api/2/project/" + selectedProject;
      }

      var projectIssueListReq = new XMLHttpRequest();
      projectIssueListReq.onload = function() {
        var projectIssueStatus = "Failure";
        if (projectIssueListReq.status === 200) {
          projectIssueStatus = "Success";
          var projectIssueResponse = JSON.parse(projectIssueListReq.responseText);
          var projectIssueKey = [];
          for (var i = 0; i < projectIssueResponse.issueTypes.length; i++) {
            projectIssueKey.push(projectIssueResponse.issueTypes[i].name);
          }
          chrome.storage.local.set(
            {
              projectTypes: projectIssueKey
            },
            function() {
              chrome.storage.local.get("projectTypes", function(items) {
                console.log("Read Project Name-Key Values: " + items.projectTypes.length);
              });
            }
          );
          populateProjectIssueOptions(document.getElementById("issueType"));
        }
      };

      projectIssueListReq.open("GET", projectIssueListURL, true); // Async = TRUE
      projectIssueListReq.setRequestHeader("Content-Type", "application/json");
      projectIssueListReq.send();

      if (projectList !== undefined
         && projectList.options[projectList.selectedIndex] !== undefined
         && projectList.options[projectList.selectedIndex].value !== undefined
         && projectList.options[projectList.selectedIndex].value != "") {
        
        // Request to GET component list for the selected Project on the JIRA instance
        var selectedProjectName = projectList.options[projectList.selectedIndex].value;
        if (selectedProjectName != "") {
          var componentURL = document.getElementById("jiraInstance").value;
          if (componentURL.substr(component.length - 1) === "/") {
            componentURL = document.getElementById("jiraInstance").value + "rest/api/2/project/" + selectedProjectName + "/components";
          } else {
            componentURL = document.getElementById("jiraInstance").value + "/rest/api/2/project/" + selectedProjectName + "/components";
          }
          
          var componentListRequest = new XMLHttpRequest();
          componentListRequest.onload = function() {
            var componentListStatus = "Failure";
            if (componentListRequest.status === 200) {
              componentListStatus = "Success";
              var componentListResponse = JSON.parse(componentListRequest.responseText);
              var componentNameKey = [];
              for (var i = 0; i < componentListResponse.length; i++) {
                componentNameKey.push(componentListResponse[i].name + "|" + componentListResponse[i].key);
              }
              chrome.storage.local.set(
                {
                  componentsList: componentNameKey
                },
                function() {
                  chrome.storage.local.get("componentsList", function(items) {
                    console.log("Read Component Name-Key Value Length: " + items.componentsList.length);
                  });
                }
              );
              populateComponentList(document.getElementById("component"));
            }
          };

          componentListRequest.open("GET", componentURL, true); // Async = TRUE
          componentListRequest.setRequestHeader("Content-Type", "application/json");
          componentListRequest.send();
        }
      }
    });
  },
  false
);

function removeSelectBoxOptions(selectbox) {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}

function populateComponentList(selectbox) {
  chrome.storage.local.get("componentsList", function(items) {
    if(items !== undefined && items.componentsList !== undefined) {
      var options = items.componentsList;

      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var res = opt.split("|");
        var el = document.createElement("option");
        el.textContent = res[0];
        el.value = res[1];
        selectbox.appendChild(el);
      }
    }
  });

  chrome.storage.local.get("selectedComponentTypeIdx", function(items) {
    if (items.selectedComponentTypeIdx < 0 || items.selectedComponentTypeIdx == undefined) {
      selectbox.selectedIndex = -1;
    } else {
      selectbox.selectedIndex = items.selectedComponentTypeIdx;
    }
  });
}

function populateProjectListOptions(selectbox) {
  chrome.storage.local.get("projectsList", function(items) {
    if(items !== undefined && items.projectsList !== undefined) {
      var options = items.projectsList;
      
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var res = opt.split("|");
        var el = document.createElement("option");
        el.textContent = res[0];
        el.value = res[1];
        selectbox.appendChild(el);
      }
    }
  });

  chrome.storage.local.get("selectedProjectNameIdx", function(items) {
    if (items.selectedProjectNameIdx < 0 || items.selectedProjectNameIdx === undefined) {
      selectbox.selectedIndex = -1;
    } else {
      selectbox.selectedIndex = items.selectedProjectNameIdx;
    }
  });
}

function populateProjectIssueOptions(selectbox) {
  chrome.storage.local.get("projectTypes", function(items) {
    if(items !== undefined && items.projectTypes !== undefined) {
      var options = items.projectTypes;

      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        selectbox.appendChild(el);
      }
    }
  });

  chrome.storage.local.get("selectedIssueTypeIdx", function(items) {
    if (items.selectedIssueTypeIdx < 0 || items.selectedIssueTypeIdx === undefined) {
      selectbox.selectedIndex = -1;
    } else {
      selectbox.selectedIndex = items.selectedIssueTypeIdx;
    }
  });
}

function enableSaveConfig() {
  document.getElementById("saveConfig").disabled = false;
}
