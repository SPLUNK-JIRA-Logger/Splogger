# Splogger
A Chrome extension which automates the copy-paste part of logging JIRA issues from data processed from log files in Splunk.

### What Does It Do ? 
Splogger is a simple extension that reads specific parts of the DOM from a Splunk search page and sends those specific details in a properly formatted request to JIRA to get it logged as an issue. This eliminates the manual copy-paste part an end user would otherwise have to do once they have filtered out an issue in Splunk for tracking.

### What Does It Not Do?
Splogger will not scan through Splunk logs and modify the search criteria nor log the JIRA automatically. This is not **skynet from terminator**. It replaces the manual copy-pasting task an end user has to do.

### Who Made This & Why?
We have a Splunk monitoring & issue logging process wherein a developer from each team (on a rotational basis) has to spend about an hour going through Splunk logs and log a JIRA for the issues found after tweaking the search criteria such that each search string uniquely identifies a single issue. Then the JIRA identifier can be tagged as the Event Type for that issue on Splunk for tracking purposes. Per team conventions, each JIRA should contains at least: 
* The URL of the Splunk issue (Search Page)
* The Search Criteria
* The Exception Stack Trace
* The Number of Occurences

All of the above had to be copy-pasted manually to create each JIRA which is a repetitive & annoying process.
As we were brainstorming an idea for the upcoming Hackathon, the inspiration came to us to simplify/automate this process & Splogger was born.

Splogger was created by Praveen Banthia, Neil Pathare, Tejaswi Gade & Naren Katneni in 24 hours as part of the Hackathaon. The goal of our project was to make the lives of developers happier by trying to elimate some of the manual things that could be automated.

### What Was the Final Verdict of the Hackathon?
Splogger got the first place & we have a trophy to prove it!
This sentiment was evidently shared by others since Splogger also won the "People's Choice" award for the entry that would be used by the most number of people across the organization.

### How Can You Use It ?

With a few tweaks, you can get started!

#### What Do You Need To Do?

* Splogger will only be active on certain pages which need to be set in `manifest.json` (Look for the `VALID_URL_HERE` string & replace that with the string containging the server address where your Splunk is installed, usually something like: https://logs.host.com).
* You might also want to modify what details are retreived from the DOM on the contentScript [here]( 
https://github.com/SPLUNK-JIRA-Logger/Splogger/blob/master/contentScript.js#L56).
* You also might want to modify the description being saved in JIRA on [popup.js](
https://github.com/SPLUNK-JIRA-Logger/Splogger/blob/master/popup/popup.js#L42)
* Add any other columns you require to log a JIRA on the configuration page.

#### What You Get
 So what can Splogger do for you in its current form:

* Read specific parts of the DOM (from a Splunk search page).
	 * i.e search string, URL (with the SID stripped), the exception stack trace & the number of occurences.
* Connect with JIRA and retreive Project & Issue types.
* Create custom labels when creating a JIRA
* Set the name (summary) of the JIRA that is being logged.
* Auto populate description details and show the user what will be sent to JIRA.

### Issue Tracking and Future Enhancements
* Log any issues & enhancement requests on the 'Issues' tab.
