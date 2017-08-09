# Splogger
A Chrome extension which helps user automate the process of logging jira's tasks from data processed from log files in splunk.

### What does it do ? 
This is a simple application which reads specific parts of the DOM on the page and then once all the data is collected from page sends it to jira with necessary details to create a jira. This eliminates the manual copy-paste the programmer currently has to do once he has filtered out an issue in splunk for tracking.

### What does it not do?
This will not scan through splunk logs and modify the search criteria and then log the jira automatically. This is not **skynet from terminator** . It facilitates the manual task user has to do of copy-paste not process logs and log jira's automatically.

### Who made this and why?
The inspiration came when we were brainstorming for an idea for hackathon. We have  a process in company where everyday a developer from team has to spend 1 hour going through splunk logs and after tweaking the search criteria such that it only filters a unique issue log a jira on it for tracking. 
We have to put details on jira such as 
* URL of the splunk issue
* Search criteria
* Stack trace
* No of Occurence 

All this had to be copy pasted manually to jira which is annoying and repetative.Hence Splogger was born

This was made by me[Praveen Banthia],Pathare Neil,Gade Tejaswi,Katneni Naren in 24 hours  as part of Revenue Cycle Hackathaon. The goal of our project was to make life of programmer happier by trying to elimate manual things that can be done in otherways.

### What was the final verdict of hackathon?
This sentiment was shared by others since we won the competetion as the most finished and useful product across. We also won the people's choice award for the product that will be used by most people across the organization

### Can you use it ?

#### what you get
Of course you can you although you will have to tweak a few things for that. Let me first put out what it can do for you in its current form

* It can read specific parts of the DOM
	 * i.e search string,url(with SID stripped), stack trace & no of occurences
* It has API to connect with jira and retreive project types and  subtype
* It can create custom labels when creating a jira
* It can auto populate those and show the user what will be send to jira
* It has ability to let user create the name of jira he is logging


#### What you need to do?

* It also will only be active on certain pages which can be tweaked in manifest.json in ***PUT VALID URL HERE*** section
* You might also want to modify what details are retreived from DOM in 
https://github.com/praveen2710/Chrome-Extensions/blob/master/Splogger/contentScript.js#L56
* You also might want to modift the description being saved in jira in 
https://github.com/praveen2710/Chrome-Extensions/blob/master/Splogger/popup/popup.js#L42
* And also add any other columns required by jira in configuration page.

### Issue Tracking and Future Enhancements
* https://praveenbanthia.myjetbrains.com/youtrack/issues/SPLOGGER
